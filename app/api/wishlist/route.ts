import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { apiError } from "@/lib/http";

export async function GET() {
  try {
    const user = await requireUser();
    const items = await prisma.wishlist.findMany({ where: { userId: user.id }, select: { productId: true } });
    return NextResponse.json({ productIds: items.map((item) => item.productId) });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const { productId } = z.object({ productId: z.string() }).parse(await request.json());
    const existing = await prisma.wishlist.findUnique({ where: { userId_productId: { userId: user.id, productId } } });
    if (existing) await prisma.wishlist.delete({ where: { id: existing.id } });
    else await prisma.wishlist.create({ data: { userId: user.id, productId } });
    return NextResponse.json({ saved: !existing });
  } catch (error) { return apiError(error); }
}
