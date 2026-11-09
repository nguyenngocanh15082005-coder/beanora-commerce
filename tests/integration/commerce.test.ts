import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createOrder, updateOrderStatus } from "@/lib/orders";
import { POST as bankWebhook } from "@/app/api/payments/webhook/route";
import { sendNewOrderEmails } from "@/lib/email";

let actorId = "";

const previous = {
  webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET,
  resendKey: process.env.RESEND_API_KEY,
};

async function cleanup() {
  const orders = await prisma.order.findMany({ where: { customerEmail: { startsWith: "integration-" } }, include: { items: true } });
  const orderIds = orders.map((order) => order.id);
  const invoices = orderIds.length ? await prisma.invoice.findMany({ where: { orderId: { in: orderIds } }, select: { id: true } }) : [];
  // AdminAuditLog không có FK tới Order/Invoice/User; phải xóa theo entityId trước khi xóa entity.
  if (orderIds.length) {
    await prisma.adminAuditLog.deleteMany({
      where: {
        OR: [
          { entityType: "Order", entityId: { in: orderIds } },
          { entityType: "Invoice", entityId: { in: invoices.map((invoice) => invoice.id) } },
        ],
      },
    });
  }
  for (const order of orders) {
    if (order.status !== "CANCELLED") {
      for (const item of order.items) if (item.variantId) await prisma.inventory.update({ where: { variantId: item.variantId }, data: { quantity: { increment: item.quantity } } });
    }
  }
  if (orders.length) await prisma.inventoryTransaction.deleteMany({ where: { reference: { in: orders.map((order) => order.orderCode) } } });
  await prisma.emailLog.deleteMany({ where: { recipient: { startsWith: "integration-" } } });
  await prisma.invoice.deleteMany({ where: { orderId: { in: orders.map((order) => order.id) } } });
  await prisma.order.deleteMany({ where: { customerEmail: { startsWith: "integration-" } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: "integration-" } } });
}

function checkout(overrides: Partial<Parameters<typeof createOrder>[0]> = {}): Parameters<typeof createOrder>[0] {
  return {
    items: [], customerName: "Integration Test", customerPhone: "0900000001",
    customerEmail: `integration-${Date.now()}-${Math.random()}@example.com`,
    province: "Đồng Nai", ward: "Trảng Dài", addressLine: "12 Test", paymentMethod: "COD",
    ...overrides,
  };
}

beforeAll(async () => {
  process.env.RESEND_API_KEY = "";
  await cleanup();
  actorId = (await prisma.user.findUniqueOrThrow({ where: { email: "admin@beanora.vn" } })).id;
  await prisma.paymentSetting.update({ where: { id: "default" }, data: { bankEnabled: false } });
});

afterAll(async () => {
  await cleanup();
  await prisma.paymentSetting.update({ where: { id: "default" }, data: { bankEnabled: false } });
  if (previous.webhookSecret === undefined) delete process.env.PAYMENT_WEBHOOK_SECRET; else process.env.PAYMENT_WEBHOOK_SECRET = previous.webhookSecret;
  if (previous.resendKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = previous.resendKey;
});

describe("commerce integration với PostgreSQL", () => {
  it("khóa/tính tồn, tạo hóa đơn một lần và hoàn kho khi hủy", async () => {
    const variant = await prisma.productVariant.findFirstOrThrow({ where: { active: true, product: { active: true }, inventory: { quantity: { gte: 3 } } }, include: { inventory: true } });
    const before = variant.inventory!.quantity;
    const order = await createOrder(checkout({ items: [{ variantId: variant.id, quantity: 2 }] }));
    expect(order.subtotal).toBe((variant.salePrice ?? variant.price) * 2);
    expect(order.total).toBe(order.subtotal - order.discount + order.shippingFee);
    expect((await prisma.inventory.findUniqueOrThrow({ where: { variantId: variant.id } })).quantity).toBe(before - 2);
    await updateOrderStatus(order.id, "CONFIRMED", actorId);
    await updateOrderStatus(order.id, "CONFIRMED", actorId);
    expect(await prisma.invoice.count({ where: { orderId: order.id } })).toBe(1);
    await updateOrderStatus(order.id, "CANCELLED", actorId, "Integration cleanup");
    expect((await prisma.inventory.findUniqueOrThrow({ where: { variantId: variant.id } })).quantity).toBe(before);
    expect(await prisma.inventoryTransaction.count({ where: { reference: order.orderCode, type: "RETURN" } })).toBe(1);
  });

  it("idempotency key không tạo đơn hoặc trừ kho lần hai", async () => {
    const variant = await prisma.productVariant.findFirstOrThrow({ where: { active: true, inventory: { quantity: { gte: 2 } } }, include: { inventory: true } });
    const key = crypto.randomUUID();
    const input = checkout({ items: [{ variantId: variant.id, quantity: 1 }], idempotencyKey: key });
    const first = await createOrder(input);
    const afterFirst = (await prisma.inventory.findUniqueOrThrow({ where: { variantId: variant.id } })).quantity;
    const second = await createOrder(input);
    expect(second.id).toBe(first.id);
    expect(await prisma.order.count({ where: { idempotencyKey: key } })).toBe(1);
    expect((await prisma.inventory.findUniqueOrThrow({ where: { variantId: variant.id } })).quantity).toBe(afterFirst);
  });

  it("webhook kiểm chữ ký, đơn, tiền, tài khoản và transaction trùng", async () => {
    process.env.PAYMENT_WEBHOOK_SECRET = "integration-webhook-secret";
    await prisma.paymentSetting.update({ where: { id: "default" }, data: { bankEnabled: true, bankName: "Vietcombank", bankCode: "VCB", bankBin: "970436", accountNumber: "0123456789", accountName: "CONG TY TEST" } });
    const variant = await prisma.productVariant.findFirstOrThrow({ where: { active: true, inventory: { quantity: { gte: 1 } } } });
    const order = await createOrder(checkout({ items: [{ variantId: variant.id, quantity: 1 }], paymentMethod: "BANK_TRANSFER" }));
    expect(order.paymentStatus).toBe("AWAITING_TRANSFER");
    const body = JSON.stringify({ transactionId: `tx-${crypto.randomUUID()}`, orderCode: order.orderCode, amount: order.total, receivingAccount: "0123456789", occurredAt: new Date().toISOString() });
    const signature = createHmac("sha256", process.env.PAYMENT_WEBHOOK_SECRET).update(body).digest("hex");
    const call = (raw: string, sig = signature) => bankWebhook(new NextRequest("http://localhost/api/payments/webhook", { method: "POST", headers: { "content-type": "application/json", "x-webhook-signature": sig }, body: raw }));
    expect((await call(body)).status).toBe(200);
    const paid = await prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: { invoice: true } });
    expect(paid.paymentStatus).toBe("PAID");
    expect(paid.status).toBe("CONFIRMED");
    expect(paid.invoice).toBeTruthy();
    expect(await prisma.paymentTransaction.count({ where: { orderId: order.id } })).toBe(1);
    const duplicate = await call(body);
    expect(duplicate.status).toBe(200);
    expect((await duplicate.json()).duplicate).toBe(true);
    expect(await prisma.paymentTransaction.count({ where: { orderId: order.id } })).toBe(1);
    const wrongAmount = JSON.stringify({ ...JSON.parse(body), transactionId: `tx-${crypto.randomUUID()}`, amount: order.total - 1 });
    const wrongSignature = createHmac("sha256", process.env.PAYMENT_WEBHOOK_SECRET).update(wrongAmount).digest("hex");
    expect((await call(wrongAmount, wrongSignature)).status).toBe(400);
    expect((await call(body, "invalid")).status).toBe(401);
    await sendNewOrderEmails(order.orderCode);
    await sendNewOrderEmails(order.orderCode);
    expect(await prisma.emailLog.count({ where: { dedupeKey: `order-customer:${order.id}`, status: "SKIPPED" } })).toBe(1);
  });

  it("tránh bán vượt tồn khi hai checkout cạnh tranh", async () => {
    const variant = await prisma.productVariant.findFirstOrThrow({ where: { active: true, inventory: { quantity: { gte: 0 } } }, include: { inventory: true } });
    const originalQuantity = variant.inventory!.quantity;
    await prisma.inventory.update({ where: { variantId: variant.id }, data: { quantity: 2, reserved: 0 } });
    const results = await Promise.allSettled([
      createOrder(checkout({ items: [{ variantId: variant.id, quantity: 2 }] })),
      createOrder(checkout({ items: [{ variantId: variant.id, quantity: 2 }] })),
    ]);
    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");
    const afterRace = (await prisma.inventory.findUniqueOrThrow({ where: { variantId: variant.id } })).quantity;
    for (const result of fulfilled) await updateOrderStatus(result.value.id, "CANCELLED", actorId);
    const afterCancellation = (await prisma.inventory.findUniqueOrThrow({ where: { variantId: variant.id } })).quantity;
    await prisma.inventory.update({ where: { variantId: variant.id }, data: { quantity: originalQuantity } });
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(afterRace).toBe(0);
    expect(afterCancellation).toBe(2);
  });
});
