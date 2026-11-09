import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/http";

const schema = z.object({
  name: z.string().trim().min(2).max(160).optional(), shortDescription: z.string().min(5).optional(),
  description: z.string().min(10).optional(), story: z.string().min(10).optional(), badge: z.string().nullable().optional(),
  featured: z.boolean().optional(), active: z.boolean().optional(), image: z.string().optional(),
  variantId: z.string().optional(), price: z.number().int().positive().optional(), salePrice: z.number().int().positive().nullable().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requirePermission("products:write");
    const { id } = await params;
    const input = schema.parse(await request.json());
    await prisma.$transaction(async (tx) => {
      await tx.product.update({ where: { id }, data: { name: input.name, shortDescription: input.shortDescription, description: input.description, story: input.story, badge: input.badge, featured: input.featured, active: input.active } });
      if (input.image) {
        const image = await tx.productImage.findFirst({ where: { productId: id } });
        if (image) await tx.productImage.update({ where: { id: image.id }, data: { url: input.image } });
        else await tx.productImage.create({ data: { productId: id, url: input.image, alt: input.name || "Sản phẩm Beanora" } });
      }
      if (input.variantId && (input.price || input.salePrice !== undefined)) await tx.productVariant.update({ where: { id: input.variantId }, data: { price: input.price, salePrice: input.salePrice } });
      await tx.adminAuditLog.create({ data: { actorId: admin.id, action: "PRODUCT_UPDATE", entityType: "Product", entityId: id, metadata: input } });
    });
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requirePermission("products:write");
    const { id } = await params;
    await prisma.product.update({ where: { id }, data: { active: false } });
    await prisma.adminAuditLog.create({ data: { actorId: admin.id, action: "PRODUCT_ARCHIVE", entityType: "Product", entityId: id } });
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
