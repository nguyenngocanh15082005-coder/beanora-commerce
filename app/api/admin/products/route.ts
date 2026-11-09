import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/http";

const schema = z.object({
  name: z.string().trim().min(2).max(160), slug: z.string().regex(/^[a-z0-9-]+$/), sku: z.string().min(3).max(60),
  shortDescription: z.string().min(5), description: z.string().min(10), story: z.string().min(10),
  origin: z.string().default("Việt Nam"), region: z.string().optional(), altitude: z.string().optional(),
  flavor: z.string().min(2), roastLevel: z.string().min(2), process: z.string().optional(),
  brewMethods: z.string().min(2), storage: z.string().min(2), badge: z.string().optional(),
  image: z.string().min(1), price: z.number().int().positive(), stock: z.number().int().nonnegative(),
  categoryIds: z.array(z.string()).default([]), featured: z.boolean().default(false),
});

export async function POST(request: Request) {
  try {
    const admin = await requirePermission("products:write");
    const input = schema.parse(await request.json());
    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({ data: {
        name: input.name, slug: input.slug, sku: input.sku, shortDescription: input.shortDescription,
        description: input.description, story: input.story, origin: input.origin, region: input.region,
        altitude: input.altitude, flavor: input.flavor, roastLevel: input.roastLevel, process: input.process,
        brewMethods: input.brewMethods, storage: input.storage, badge: input.badge, featured: input.featured,
        images: { create: { url: input.image, alt: input.name } },
        categories: { create: input.categoryIds.map((categoryId) => ({ categoryId })) },
      } });
      const variant = await tx.productVariant.create({ data: { productId: created.id, name: "500g · Xay phin", sku: `${input.sku}-500-GF`, weight: "500g", roast: input.roastLevel, grind: "Xay phin", price: input.price } });
      await tx.inventory.create({ data: { variantId: variant.id, quantity: input.stock } });
      await tx.inventoryTransaction.create({ data: { variantId: variant.id, type: "IMPORT", quantity: input.stock, balanceAfter: input.stock, note: "Tồn kho khởi tạo", actorId: admin.id } });
      await tx.adminAuditLog.create({ data: { actorId: admin.id, action: "PRODUCT_CREATE", entityType: "Product", entityId: created.id } });
      return created;
    });
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) { return apiError(error); }
}
