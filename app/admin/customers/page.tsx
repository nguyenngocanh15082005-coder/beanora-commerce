import { prisma } from "@/lib/prisma";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminCustomers } from "@/components/admin/admin-customers";
export default async function CustomersPage() {
  const users = await prisma.user.findMany({ include: { roles: { include: { role: true } }, _count: { select: { orders: true } }, orders: { select: { total: true, paymentStatus: true } } }, orderBy: { createdAt: "desc" }, take: 200 });
  return <><AdminHeader eyebrow="QUẢN LÝ KHÁCH HÀNG" title="Khách hàng" description="Thông tin tài khoản, lịch sử mua hàng tổng hợp và trạng thái truy cập." /><AdminCustomers users={users.map((user) => ({ id: user.id, name: user.name, email: user.email, phone: user.phone, createdAt: user.createdAt.toISOString(), locked: Boolean(user.lockedAt), roles: user.roles.map(({ role }) => role.name), orderCount: user._count.orders, paidTotal: user.orders.filter((o) => o.paymentStatus === "PAID").reduce((sum,o) => sum+o.total,0) }))} /></>;
}
