import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccountClient } from "@/components/account-client";
export const metadata: Metadata = { title: "Tài khoản của tôi", robots: { index: false, follow: false } };
export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [orders, wishlist, points] = await Promise.all([
    prisma.order.findMany({ where: { userId: user.id }, include: { items: true, invoice: true }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.wishlist.count({ where: { userId: user.id } }),
    prisma.loyaltyPoint.aggregate({ where: { userId: user.id }, _sum: { points: true } }),
  ]);
  return <AccountClient user={{ name: user.name, email: user.email, phone: user.phone || "" }} orders={orders.map((order) => ({ ...order, createdAt: order.createdAt.toISOString(), updatedAt: order.updatedAt.toISOString(), paymentExpiresAt: order.paymentExpiresAt?.toISOString() || null, transferReportedAt: order.transferReportedAt?.toISOString() || null, paymentConfirmedAt: order.paymentConfirmedAt?.toISOString() || null, invoice: order.invoice ? { ...order.invoice, issuedAt: order.invoice.issuedAt.toISOString() } : null }))} wishlistCount={wishlist} points={points._sum.points || 0} />;
}
