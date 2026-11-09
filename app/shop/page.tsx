import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import { getCatalog, getCategories } from "@/lib/catalog";
import { ProductGrid } from "@/components/product-grid";

export const metadata: Metadata = { title: "Cửa hàng cà phê", description: "Khám phá cà phê Arabica, Robusta, Blend và Specialty rang mới từ Beanora." };

type SearchParams = Promise<{ search?: string; category?: string; sort?: string; page?: string }>;

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page || 1));
  const [{ products, total, pages }, categories] = await Promise.all([getCatalog({ search: params.search, category: params.category, sort: params.sort, page, limit: 10 }), getCategories()]);
  const makeUrl = (newPage: number) => {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.category) query.set("category", params.category);
    if (params.sort) query.set("sort", params.sort);
    query.set("page", String(newPage));
    return `/shop?${query.toString()}`;
  };
  return <div className="shop-page">
    <section className="page-hero shop-hero"><div className="container"><span className="eyebrow">Beanora Coffee Collection</span><h1>{params.search ? `Kết quả cho “${params.search}”` : "Tìm tách cà phê của bạn"}</h1><p>Từ thanh nhẹ đến đậm đà, mỗi sản phẩm là một cách để tận hưởng cà phê Việt.</p></div></section>
    <div className="container shop-layout">
      <aside className="shop-sidebar">
        <div className="filter-title"><SlidersHorizontal size={16} /><strong>Danh mục sản phẩm</strong></div>
        <nav className="category-filter"><Link href="/shop" className={!params.category ? "active" : ""}><span>Tất cả sản phẩm</span><small>{!params.category ? total : ""}</small></Link>{categories.map((category) => <Link key={category.id} href={`/shop?category=${category.slug}`} className={params.category === category.slug ? "active" : ""}><span>{category.name}</span><ChevronRight size={13} /></Link>)}</nav>
        <div className="sidebar-note"><span>Chưa biết chọn gì?</span><h3>Để Beanora giúp bạn.</h3><p>Cho chúng tôi biết khẩu vị và cách pha bạn yêu thích.</p><Link href="/contact" className="text-link">Nhận tư vấn →</Link></div>
      </aside>
      <div className="shop-content">
        <form className="shop-toolbar" action="/shop">
          {params.category && <input type="hidden" name="category" value={params.category} />}
          <div className="shop-search"><Search size={16} /><input name="search" defaultValue={params.search} placeholder="Tìm tên, hương vị cà phê..." /><button>Tìm kiếm</button></div>
          <div className="shop-sort"><span>{total} sản phẩm</span><select name="sort" defaultValue={params.sort || "featured"} aria-label="Sắp xếp sản phẩm"><option value="featured">Nổi bật</option><option value="popular">Phổ biến</option><option value="newest">Mới nhất</option><option value="price-asc">Giá tăng dần</option><option value="price-desc">Giá giảm dần</option></select></div>
        </form>
        {products.length ? <ProductGrid products={products} /> : <div className="catalog-empty"><Search size={30} /><h2>Chưa tìm thấy hương vị phù hợp</h2><p>Hãy thử từ khóa khác hoặc khám phá toàn bộ danh mục.</p><Link href="/shop" className="button button-dark">Xem tất cả sản phẩm</Link></div>}
        {pages > 1 && <nav className="pagination" aria-label="Phân trang">{page > 1 && <Link href={makeUrl(page - 1)}><ChevronLeft size={16} /></Link>}{Array.from({ length: pages }, (_, i) => i + 1).map((value) => <Link key={value} className={value === page ? "active" : ""} href={makeUrl(value)}>{value}</Link>)}{page < pages && <Link href={makeUrl(page + 1)}><ChevronRight size={16} /></Link>}</nav>}
      </div>
    </div>
  </div>;
}
