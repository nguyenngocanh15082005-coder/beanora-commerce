import "server-only";
import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateDiscount, calculateShipping } from "@/lib/pricing";
import { makeInvoiceNumber, makeOrderCode } from "@/lib/utils";
import { getPaymentSettings, getSiteSetting } from "@/lib/settings";

export type CheckoutItem = { variantId: string; quantity: number };
export type CheckoutInput = {
  items: CheckoutItem[];
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  province: string;
  ward: string;
  addressLine: string;
  deliveryNote?: string;
  paymentMethod: "COD" | "BANK_TRANSFER";
  couponCode?: string;
  idempotencyKey?: string;
  userId?: string;
};

export async function createOrder(input: CheckoutInput) {
  if (!input.items.length) throw new Error("Giỏ hàng đang trống.");
  if (input.idempotencyKey) {
    const existing = await prisma.order.findUnique({ where: { idempotencyKey: input.idempotencyKey }, include: { items: true } });
    if (existing) return existing;
  }
  const orderCode = makeOrderCode();
  const order = await prisma.$transaction(async (tx) => {
    const variantIds = input.items.map((item) => item.variantId);
    await tx.$queryRaw`SELECT id FROM "Inventory" WHERE "variantId" IN (${Prisma.join(variantIds)}) FOR UPDATE`;
    const variants = await tx.productVariant.findMany({
      where: { id: { in: variantIds }, active: true, product: { active: true } },
      include: { product: true, inventory: true },
    });
    if (variants.length !== variantIds.length) throw new Error("Một số sản phẩm không còn khả dụng. Vui lòng tải lại giỏ hàng.");

    const lines = input.items.map((item) => {
      const variant = variants.find((record) => record.id === item.variantId)!;
      const available = (variant.inventory?.quantity ?? 0) - (variant.inventory?.reserved ?? 0);
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) throw new Error("Số lượng sản phẩm phải từ 1 đến 20.");
      if (available < item.quantity) throw new Error(`OUT_OF_STOCK:${variant.product.name} ${variant.name} chỉ còn ${available} sản phẩm.`);
      const unitPrice = variant.salePrice ?? variant.price;
      return { variant, unitPrice, quantity: item.quantity, lineTotal: unitPrice * item.quantity };
    });
    const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    let coupon = null;
    if (input.couponCode) {
      coupon = await tx.coupon.findUnique({ where: { code: input.couponCode.toUpperCase() }, include: { usages: { select: { id: true } } } });
      if (!coupon) throw new Error("Mã giảm giá không tồn tại.");
      if (input.userId) {
        const used = await tx.couponUsage.count({ where: { couponId: coupon.id, userId: input.userId } });
        if (used >= coupon.perUserLimit) throw new Error("Bạn đã sử dụng hết lượt áp dụng mã này.");
      }
    }
    const discountResult = calculateDiscount(subtotal, coupon);
    if (!discountResult.valid) throw new Error(discountResult.message);
    const settings = await tx.paymentSetting.findUnique({ where: { id: "default" } });
    if (!settings) throw new Error("Cửa hàng chưa cấu hình thanh toán.");
    if (input.paymentMethod === "COD" && !settings.codEnabled) throw new Error("Phương thức COD hiện chưa được kích hoạt.");
    if (input.paymentMethod === "BANK_TRANSFER") {
      if (!settings.bankEnabled) throw new Error("Chuyển khoản ngân hàng chưa được kích hoạt. Vui lòng chọn COD.");
      if (!settings.bankBin || !settings.accountNumber || !settings.accountName || !settings.bankName) throw new Error("Thông tin ngân hàng của cửa hàng chưa đầy đủ.");
    }
    const shippingFee = calculateShipping(subtotal - discountResult.discount, settings.shippingFee, settings.freeShippingFrom);
    const total = subtotal - discountResult.discount + shippingFee;
    const paymentSnapshot = input.paymentMethod === "BANK_TRANSFER" ? {
      bankName: settings.bankName, bankCode: settings.bankCode, bankBin: settings.bankBin,
      accountNumber: settings.accountNumber, accountName: settings.accountName, branch: settings.branch,
      qrImageUrl: settings.qrImageUrl, instructions: settings.instructions, amount: total,
      description: orderCode, capturedAt: new Date().toISOString(),
    } : Prisma.JsonNull;

    for (const line of lines) {
      const balanceAfter = (line.variant.inventory!.quantity) - line.quantity;
      await tx.inventory.update({ where: { variantId: line.variant.id }, data: { quantity: { decrement: line.quantity } } });
      await tx.inventoryTransaction.create({ data: {
        variantId: line.variant.id, type: "SALE", quantity: -line.quantity, balanceAfter,
        reference: orderCode, note: "Trừ tồn khi tạo đơn hàng", actorId: input.userId,
      } });
    }

    const created = await tx.order.create({ data: {
      orderCode, idempotencyKey: input.idempotencyKey, userId: input.userId, customerName: input.customerName, customerPhone: input.customerPhone,
      customerEmail: input.customerEmail, province: input.province, ward: input.ward,
      addressLine: input.addressLine, deliveryNote: input.deliveryNote, subtotal,
      discount: discountResult.discount, shippingFee, total, couponCode: coupon?.code,
      paymentMethod: input.paymentMethod,
      paymentStatus: input.paymentMethod === "BANK_TRANSFER" ? "AWAITING_TRANSFER" : "UNPAID",
      status: input.paymentMethod === "BANK_TRANSFER" ? "AWAITING_PAYMENT" : "PENDING_CONFIRMATION",
      paymentSnapshot, paymentExpiresAt: input.paymentMethod === "BANK_TRANSFER" ? new Date(Date.now() + settings.paymentTimeoutMinutes * 60_000) : null,
      items: { create: lines.map(({ variant, unitPrice, quantity, lineTotal }) => ({
        productId: variant.productId, variantId: variant.id, productName: variant.product.name,
        variantName: variant.name, sku: variant.sku, unitPrice, quantity, lineTotal,
      })) },
      history: { create: { status: input.paymentMethod === "BANK_TRANSFER" ? "AWAITING_PAYMENT" : "PENDING_CONFIRMATION", note: "Đơn hàng được tạo từ website", actorId: input.userId } },
    }, include: { items: true } });

    if (coupon) await tx.couponUsage.create({ data: { couponId: coupon.id, orderId: created.id, userId: input.userId, amount: discountResult.discount } });
    return created;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15_000 });
  return order;
}

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING_CONFIRMATION: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "AWAITING_PAYMENT", "CANCELLED"],
  AWAITING_PAYMENT: ["CONFIRMED", "PREPARING", "CANCELLED"],
  PREPARING: ["PACKING", "CANCELLED"],
  PACKING: ["HANDED_TO_CARRIER"],
  HANDED_TO_CARRIER: ["SHIPPING"],
  SHIPPING: ["DELIVERED", "DELIVERY_FAILED"],
  DELIVERED: ["RETURN_REQUESTED"],
  DELIVERY_FAILED: ["SHIPPING", "RETURN_REQUESTED", "CANCELLED"],
  CANCELLED: [],
  RETURN_REQUESTED: ["REFUNDED", "DELIVERED"],
  REFUNDED: [],
};

export async function updateOrderStatus(orderId: string, status: OrderStatus, actorId: string, note?: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true, invoice: true } });
    if (order.status === status) return order;
    if (!allowedTransitions[order.status].includes(status)) throw new Error(`Không thể chuyển từ ${order.status} sang ${status}.`);
    if (status === "CANCELLED") {
      for (const item of order.items) {
        if (!item.variantId) continue;
        const inventory = await tx.inventory.findUnique({ where: { variantId: item.variantId } });
        if (!inventory) continue;
        const balanceAfter = inventory.quantity + item.quantity;
        await tx.inventory.update({ where: { id: inventory.id }, data: { quantity: { increment: item.quantity } } });
        await tx.inventoryTransaction.create({ data: { variantId: item.variantId, type: "RETURN", quantity: item.quantity, balanceAfter, reference: order.orderCode, note: "Hoàn tồn do hủy đơn", actorId } });
      }
    }
    const updated = await tx.order.update({ where: { id: orderId }, data: { status }, include: { items: true } });
    await tx.orderStatusHistory.create({ data: { orderId, status, note, actorId } });
    if (["CONFIRMED", "PREPARING", "PACKING", "HANDED_TO_CARRIER", "SHIPPING", "DELIVERED"].includes(status) && !order.invoice) {
      await createInvoiceInTransaction(tx, orderId, actorId);
    }
    if (status === "DELIVERED" && order.paymentMethod === "COD") {
      await tx.order.update({ where: { id: orderId }, data: { paymentStatus: "PAID", paymentConfirmedAt: new Date(), paymentConfirmedBy: actorId } });
    }
    await tx.adminAuditLog.create({ data: { actorId, action: "ORDER_STATUS_UPDATE", entityType: "Order", entityId: orderId, metadata: { from: order.status, to: status, note } } });
    return updated;
  });
}

export async function createInvoiceInTransaction(tx: Prisma.TransactionClient, orderId: string, actorId?: string) {
  const existing = await tx.invoice.findUnique({ where: { orderId } });
  if (existing) return existing;
  const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
  const business = await getSiteSetting("business", { storeName: "Beanora Coffee", address: "", phone: "", email: "" });
  return tx.invoice.create({ data: {
    invoiceNumber: makeInvoiceNumber(), orderId,
    businessSnapshot: business,
    customerSnapshot: { name: order.customerName, phone: order.customerPhone, email: order.customerEmail, address: `${order.addressLine}, ${order.ward}, ${order.province}` },
    notes: "Hóa đơn bán hàng nội bộ, không phải hóa đơn điện tử VAT có giá trị pháp lý.",
    items: { create: order.items.map((item) => ({ productName: item.productName, variantName: item.variantName, sku: item.sku, unitPrice: item.unitPrice, quantity: item.quantity, lineTotal: item.lineTotal })) },
  } }).then(async (invoice) => {
    await tx.adminAuditLog.create({ data: { actorId, action: "INVOICE_CREATE", entityType: "Invoice", entityId: invoice.id, metadata: { orderCode: order.orderCode } } });
    return invoice;
  });
}

export async function verifyPaymentManually(orderId: string, actorId: string, approved: boolean, note?: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
    if (order.paymentMethod !== "BANK_TRANSFER") throw new Error("Đơn hàng không sử dụng chuyển khoản.");
    if (order.paymentStatus === "PAID") throw new Error("Giao dịch đã được xác nhận trước đó.");
    const status: PaymentStatus = approved ? "PAID" : "FAILED";
    await tx.order.update({ where: { id: orderId }, data: {
      paymentStatus: status, paymentConfirmedAt: approved ? new Date() : null, paymentConfirmedBy: actorId,
      status: approved && order.status === "AWAITING_PAYMENT" ? "CONFIRMED" : order.status,
    } });
    await tx.paymentTransaction.create({ data: {
      orderId, provider: "MANUAL_BANK_RECONCILIATION", amount: order.total, status,
      receivingAccount: (order.paymentSnapshot as { accountNumber?: string } | null)?.accountNumber,
      verifiedById: actorId, verifiedAt: new Date(), rawPayload: { note, approved },
    } });
    await tx.orderStatusHistory.create({ data: { orderId, status: approved && order.status === "AWAITING_PAYMENT" ? "CONFIRMED" : order.status, note: note || (approved ? "Admin đã đối chiếu giao dịch ngân hàng" : "Admin từ chối xác nhận thanh toán"), actorId } });
    if (approved && order.status === "AWAITING_PAYMENT") await createInvoiceInTransaction(tx, orderId, actorId);
    await tx.adminAuditLog.create({ data: { actorId, action: approved ? "PAYMENT_APPROVE" : "PAYMENT_REJECT", entityType: "Order", entityId: orderId, metadata: { note } } });
  });
}
