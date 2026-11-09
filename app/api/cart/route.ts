import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { apiError } from "@/lib/http";

async function getCartResponse(userId: string) {
  const cart = await prisma.cart.upsert({ where: { userId }, update: {}, create: { userId }, include: { items: { include: { variant: { include: { product: { include: { images: { take: 1 } } }, inventory: true } } } } } });
  return cart.items.map((item) => ({
    variantId: item.variantId, productId: item.variant.productId, productName: item.variant.product.name,
    slug: item.variant.product.slug, image: item.variant.product.images[0]?.url || "/images/hero-coffee.jpg",
    variantName: item.variant.name, sku: item.variant.sku, price: item.variant.salePrice ?? item.variant.price,
    originalPrice: item.variant.salePrice ? item.variant.price : null, quantity: item.quantity,
    stock: Math.max(0, (item.variant.inventory?.quantity ?? 0) - (item.variant.inventory?.reserved ?? 0)),
  }));
}

export async function GET() {
  try { const user = await requireUser(); return NextResponse.json({ items: await getCartResponse(user.id) }); }
  catch (error) { return apiError(error); }
}

export async function PUT(request: Request) {
  try {
    const user = await requireUser();
    const { items } = z.object({ items: z.array(z.object({ variantId: z.string(), quantity: z.number().int().min(1).max(20) })).max(50) }).parse(await request.json());
    const variants = await prisma.productVariant.findMany({ where: { id: { in: items.map((i) => i.variantId) }, active: true }, include: { inventory: true } });
    for (const item of items) {
      const variant = variants.find((v) => v.id === item.variantId);
      if (!variant) return NextResponse.json({ error: "Một sản phẩm trong giỏ không còn khả dụng." }, { status: 400 });
      if ((variant.inventory?.quantity ?? 0) < item.quantity) return NextResponse.json({ error: `${variant.name} không đủ tồn kho.` }, { status: 409 });
    }
    await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } });
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      if (items.length) await tx.cartItem.createMany({ data: items.map((item) => ({ cartId: cart.id, ...item })) });
    });
    return NextResponse.json({ items: await getCartResponse(user.id) });
  } catch (error) { return apiError(error); }
}
