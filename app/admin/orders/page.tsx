import Link from "next/link";
import { Download } from "lucide-react";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminOrdersTable } from "@/components/admin/admin-orders-table";
import { AdminOrderFilters } from "@/components/admin/admin-order-filters";

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ search?: string; status?: string; payment?: string }> }) {
  const params = await searchParams;
  const where: Prisma.OrderWhereInput = { ...(params.search ? { OR: [{ orderCode: { contains: params.search, mode: "insensitive" } }, { customerName: { contains: params.search, mode: "insensitive" } }, { customerPhone: { contains: params.search } }] } : {}), ...(params.status ? { status: params.status as Prisma.EnumOrderStatusFilter["equals"] } : {}), ...(params.payment ? { paymentMethod: params.payment as Prisma.EnumPaymentMethodFilter["equals"] } : {}) };
  const orders = await prisma.order.findMany({ where, include: { items: true, invoice: true }, orderBy: { createdAt: "desc" }, take: 100 });
  return <><AdminHeader eyebrow="QUẢN LÝ BÁN HÀNG" title="Đơn hàng" description={`${orders.length} đơn hàng phù hợp bộ lọc. Trạng thái giao hàng và thanh toán được quản lý riêng.`} action={<a href="/api/admin/orders/export" className="button button-outline"><Download size={15} />Xuất CSV</a>} /><AdminOrderFilters /><AdminOrdersTable orders={orders.map((order) => ({ id: order.id, orderCode: order.orderCode, customerName: order.customerName, customerPhone: order.customerPhone, customerEmail: order.customerEmail, total: order.total, status: order.status, paymentStatus: order.paymentStatus, paymentMethod: order.paymentMethod, createdAt: order.createdAt.toISOString(), itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0), invoiceNumber: order.invoice?.invoiceNumber || null }))} /></>;
}
