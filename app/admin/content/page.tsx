import { prisma } from "@/lib/prisma";
import { getSiteSetting } from "@/lib/settings";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminContent } from "@/components/admin/admin-content";
type Brand = { name: string; slogan: string; tagline: string; description: string };
type Contact = { address: string; phone: string; email: string };
type Business = { storeName: string; address: string; phone: string; email: string };
export default async function ContentPage() { const [brand, contact, business, posts] = await Promise.all([getSiteSetting<Brand>("brand", { name: "Beanora", slogan: "Tinh hoa cà phê Việt", tagline: "", description: "" }), getSiteSetting<Contact>("contact", { address: "", phone: "", email: "" }), getSiteSetting<Business>("business", { storeName: "Beanora Coffee", address: "", phone: "", email: "" }), prisma.blogPost.findMany({ orderBy: { createdAt: "desc" } })]); return <><AdminHeader eyebrow="QUẢN LÝ NỘI DUNG" title="Thương hiệu & Blog" description="Nội dung nhận diện, thông tin xuất hóa đơn và trạng thái bài viết trên website." /><AdminContent brand={brand} contact={contact} business={business} posts={posts.map((p) => ({ id: p.id, title: p.title, slug: p.slug, published: p.published, updatedAt: p.updatedAt.toISOString() }))} integrations={{ ai: Boolean(process.env.OPENAI_API_KEY), email: Boolean(process.env.RESEND_API_KEY), shipping: Boolean(process.env.GHN_TOKEN) }} /></>; }
