import { prisma } from "@/lib/prisma";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminCategories } from "@/components/admin/admin-categories";
export default async function CategoriesPage() { const categories = await prisma.category.findMany({ include: { _count: { select: { products: true } } }, orderBy: { position: "asc" } }); return <><AdminHeader eyebrow="CẤU TRÚC DANH MỤC" title="Danh mục sản phẩm" description="Thêm, đổi tên, sắp xếp và ẩn danh mục trên cửa hàng." /><AdminCategories categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug, description: c.description || "", position: c.position, active: c.active, productCount: c._count.products }))} /></>; }
