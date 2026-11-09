import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getCatalog, getProductBySlug } from "@/lib/catalog";
import { ProductDetail } from "@/components/product-detail";
import { ProductGrid } from "@/components/product-grid";
import { SectionHeading } from "@/components/section-heading";
import { formatPrice } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Không tìm thấy sản phẩm" };
  return { title: product.name, description: product.shortDescription, openGraph: { images: [product.image] } };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const { products } = await getCatalog({ limit: 5 });
  const related = products.filter((item) => item.id !== product.id).slice(0, 4);
  const schema = { "@context": "https://schema.org", "@type": "Product", name: product.name, image: product.image, description: product.shortDescription, sku: product.sku, brand: { "@type": "Brand", name: "Beanora" }, offers: { "@type": "Offer", priceCurrency: "VND", price: product.price, availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: `/product/${product.slug}` } };
  return <div className="product-page"><div className="container breadcrumbs"><Link href="/">Trang chủ</Link><ChevronRight /><Link href="/shop">Sản phẩm</Link><ChevronRight /><span>{product.name}</span></div><div className="container"><ProductDetail product={product} /></div><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />{related.length > 0 && <section className="section related-section"><div className="container"><SectionHeading eyebrow="Có thể bạn sẽ thích" title="Thêm một chút hương vị" link={{ href: "/shop", label: "Xem tất cả" }} /><ProductGrid products={related} /></div></section>}<div className="container product-price-note">Giá hiển thị: {formatPrice(product.price)} · Cập nhật theo biến thể mặc định.</div></div>;
}
