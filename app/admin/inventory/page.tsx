import { prisma } from "@/lib/prisma";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminInventory } from "@/components/admin/admin-inventory";
export default async function InventoryPage() {
  const [variants, movements] = await Promise.all([prisma.productVariant.findMany({ include: { product: true, inventory: true }, orderBy: [{ product: { name: "asc" } }, { weight: "asc" }] }), prisma.inventoryTransaction.findMany({ include: { variant: { include: { product: true } }, actor: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 20 })]);
  return <><AdminHeader eyebrow="QUẢN LÝ KHO" title="Tồn kho & biến động" description="Nhập kho, kiểm kê điều chỉnh và theo dõi lịch sử theo từng SKU." /><AdminInventory variants={variants.map((v) => ({ id: v.id, productName: v.product.name, name: v.name, sku: v.sku, quantity: v.inventory?.quantity || 0, reserved: v.inventory?.reserved || 0, reorderPoint: v.inventory?.reorderPoint || 10 }))} movements={movements.map((m) => ({ id: m.id, product: `${m.variant.product.name} · ${m.variant.name}`, type: m.type, quantity: m.quantity, balanceAfter: m.balanceAfter, reference: m.reference, note: m.note, actor: m.actor?.name || "Hệ thống", createdAt: m.createdAt.toISOString() }))} /></>;
}
