import "server-only";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]!);

export async function sendEmailOnce(dedupeKey: string, to: string, subject: string, html: string) {
  if (!to) return { status: "SKIPPED", reason: "Chưa cấu hình email người nhận" };
  const existing = await prisma.emailLog.findUnique({ where: { dedupeKey } });
  if (existing?.status === "SENT") return { status: "ALREADY_SENT" };
  const log = existing ?? await prisma.emailLog.create({ data: { dedupeKey, recipient: to, subject, status: "PENDING" } });
  if (!process.env.RESEND_API_KEY) {
    await prisma.emailLog.update({ where: { id: log.id }, data: { status: "SKIPPED", lastError: "Thiếu RESEND_API_KEY" } });
    return { status: "SKIPPED", reason: "Thiếu RESEND_API_KEY" };
  }
  let lastError = "";
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: process.env.RESEND_FROM || "Beanora <onboarding@resend.dev>", to: [to], subject, html }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || `Resend HTTP ${response.status}`);
      await prisma.emailLog.update({ where: { id: log.id }, data: { status: "SENT", providerId: result.id, attempts: attempt, sentAt: new Date(), lastError: null } });
      return { status: "SENT", id: result.id };
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Lỗi gửi email";
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
  }
  await prisma.emailLog.update({ where: { id: log.id }, data: { status: "FAILED", attempts: 3, lastError } });
  return { status: "FAILED", reason: lastError };
}

export async function sendNewOrderEmails(orderCode: string) {
  const order = await prisma.order.findUnique({ where: { orderCode }, include: { items: true } });
  if (!order) return;
  const rows = order.items.map((item) => `<tr><td>${escapeHtml(item.productName)}<br><small>${escapeHtml(item.variantName)}</small></td><td>${item.quantity}</td><td>${formatPrice(item.unitPrice)}</td><td>${formatPrice(item.lineTotal)}</td></tr>`).join("");
  const html = `<div style="font-family:Arial,sans-serif;color:#2c160f"><h2>Beanora — Đơn hàng ${order.orderCode}</h2><p>Khách hàng: <strong>${escapeHtml(order.customerName)}</strong><br>Điện thoại: ${escapeHtml(order.customerPhone)}<br>Email: ${escapeHtml(order.customerEmail)}<br>Địa chỉ: ${escapeHtml(`${order.addressLine}, ${order.ward}, ${order.province}`)}</p><table cellpadding="8" cellspacing="0" border="1" style="border-collapse:collapse;width:100%"><thead><tr><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead><tbody>${rows}</tbody></table><p>Tạm tính: ${formatPrice(order.subtotal)}<br>Giảm giá: -${formatPrice(order.discount)}<br>Phí vận chuyển: ${formatPrice(order.shippingFee)}<br><strong>Tổng thanh toán: ${formatPrice(order.total)}</strong></p><p>Phương thức: ${order.paymentMethod}<br>Trạng thái thanh toán: ${order.paymentStatus}<br>Ghi chú: ${escapeHtml(order.deliveryNote || "Không có")}</p></div>`;
  const results = [];
  results.push(await sendEmailOnce(`order-customer:${order.id}`, order.customerEmail, `[Beanora] Xác nhận đơn hàng ${order.orderCode}`, html));
  if (process.env.ADMIN_EMAIL) results.push(await sendEmailOnce(`order-admin:${order.id}`, process.env.ADMIN_EMAIL, `[Beanora] Đơn mới ${order.orderCode} — ${formatPrice(order.total)}`, html));
  return results;
}
