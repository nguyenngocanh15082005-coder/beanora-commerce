import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { orderStatusLabels, paymentStatusLabels } from "@/lib/format";
const csvCell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
export async function GET() {
  try {
    await requirePermission("orders:write");
    const orders = await prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: "desc" }, take: 10000 });
    const rows = [["Mã đơn", "Ngày tạo", "Khách hàng", "Điện thoại", "Email", "Sản phẩm", "Tạm tính", "Giảm giá", "Phí ship", "Tổng", "Phương thức", "Trạng thái thanh toán", "Trạng thái đơn"], ...orders.map((o) => [o.orderCode, o.createdAt.toISOString(), o.customerName, o.customerPhone, o.customerEmail, o.items.map((i) => `${i.quantity}x ${i.productName} (${i.variantName})`).join("; "), o.subtotal, o.discount, o.shippingFee, o.total, o.paymentMethod, paymentStatusLabels[o.paymentStatus], orderStatusLabels[o.status]])];
    const csv = "\ufeff" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="beanora-orders-${new Date().toISOString().slice(0,10)}.csv"` } });
  } catch { return new Response("Forbidden", { status: 403 }); }
}
