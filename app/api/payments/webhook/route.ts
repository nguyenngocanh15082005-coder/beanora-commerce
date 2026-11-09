import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { safeSecretEqual } from "@/lib/auth";
import { createInvoiceInTransaction } from "@/lib/orders";

export async function POST(request: Request) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook thanh toán chưa được cấu hình." }, { status: 503 });
  const raw = await request.text();
  const signature = request.headers.get("x-webhook-signature") || "";
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  if (!safeSecretEqual(signature, expected)) return NextResponse.json({ error: "Chữ ký không hợp lệ." }, { status: 401 });
  try {
    const payload = z.object({ transactionId: z.string().min(3), orderCode: z.string().min(6), amount: z.number().int().positive(), receivingAccount: z.string().min(6) }).parse(JSON.parse(raw));
    const result = await prisma.$transaction(async (tx) => {
      const duplicate = await tx.paymentTransaction.findUnique({ where: { providerTransactionId: payload.transactionId } });
      if (duplicate) return { duplicate: true };
      const order = await tx.order.findUnique({ where: { orderCode: payload.orderCode } });
      if (!order || order.total !== payload.amount) throw new Error("Đơn hàng hoặc số tiền không khớp.");
      const snapshot = order.paymentSnapshot as { accountNumber?: string } | null;
      if (snapshot?.accountNumber !== payload.receivingAccount) throw new Error("Tài khoản nhận không khớp snapshot đơn hàng.");
      if (order.paymentStatus === "PAID") return { duplicate: true };
      await tx.paymentTransaction.create({ data: { orderId: order.id, provider: "BANK_WEBHOOK", providerTransactionId: payload.transactionId, amount: payload.amount, status: "PAID", receivingAccount: payload.receivingAccount, rawPayload: payload, verifiedAt: new Date() } });
      await tx.order.update({ where: { id: order.id }, data: { paymentStatus: "PAID", paymentConfirmedAt: new Date(), status: order.status === "AWAITING_PAYMENT" ? "CONFIRMED" : order.status } });
      await tx.orderStatusHistory.create({ data: { orderId: order.id, status: order.status === "AWAITING_PAYMENT" ? "CONFIRMED" : order.status, note: `Webhook xác thực giao dịch ${payload.transactionId}` } });
      if (order.status === "AWAITING_PAYMENT") await createInvoiceInTransaction(tx, order.id);
      return { ok: true };
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Payload không hợp lệ" }, { status: 400 });
  }
}
