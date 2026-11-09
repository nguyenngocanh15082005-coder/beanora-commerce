import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { apiError } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const input = z.object({ productId: z.string(), orderId: z.string(), rating: z.number().int().min(1).max(5), comment: z.string().trim().min(10).max(1500) }).parse(await request.json());
    const order = await prisma.order.findFirst({ where: { id: input.orderId, userId: user.id, status: "DELIVERED", items: { some: { productId: input.productId } } } });
    if (!order) return NextResponse.json({ error: "Chỉ khách hàng đã nhận đơn chứa sản phẩm này mới có thể gửi đánh giá xác minh." }, { status: 403 });
    const review = await prisma.review.create({ data: { ...input, userId: user.id, verifiedPurchase: true, approved: false } });
    return NextResponse.json({ review, message: "Đánh giá đã được gửi và đang chờ duyệt." }, { status: 201 });
  } catch (error) { return apiError(error); }
}
