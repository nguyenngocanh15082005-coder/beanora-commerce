import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { createOrder } from "@/lib/orders";
import { getCurrentUser } from "@/lib/auth";
import { sendNewOrderEmails } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { apiError } from "@/lib/http";

const schema = z.object({
  items: z.array(z.object({ variantId: z.string().min(1), quantity: z.number().int().min(1).max(20) })).min(1).max(50),
  customerName: z.string().trim().min(2).max(100),
  customerPhone: z.string().trim().regex(/^(0|\+84)\d{9,10}$/, "Số điện thoại không hợp lệ"),
  customerEmail: z.string().trim().email().max(160),
  province: z.string().trim().min(2).max(100), ward: z.string().trim().min(2).max(100),
  addressLine: z.string().trim().min(5).max(250), deliveryNote: z.string().trim().max(500).optional(),
  paymentMethod: z.enum(["COD", "BANK_TRANSFER"]), couponCode: z.string().trim().max(40).optional(),
  idempotencyKey: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  try {
    const ip = (await headers()).get("x-forwarded-for") || "local";
    if (!rateLimit(`checkout:${ip}`, 12, 300_000).allowed) return NextResponse.json({ error: "Bạn đã tạo quá nhiều đơn trong thời gian ngắn." }, { status: 429 });
    const input = schema.parse(await request.json());
    const user = await getCurrentUser();
    const order = await createOrder({ ...input, userId: user?.id });
    try { await sendNewOrderEmails(order.orderCode); } catch (error) { console.error("Order email failed", error); }
    return NextResponse.json({ orderCode: order.orderCode, total: order.total, paymentMethod: order.paymentMethod }, { status: 201 });
  } catch (error) { return apiError(error); }
}
