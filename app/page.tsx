import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, ChevronRight, Coffee, CreditCard, Headphones, Leaf, PackageCheck, RotateCcw, Truck } from "lucide-react";
import { getCatalog } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { ProductGrid } from "@/components/product-grid";
import { SectionHeading } from "@/components/section-heading";

export const revalidate = 60;

export default async function HomePage() {
  const [{ products }, posts] = await Promise.all([
    getCatalog({ featured: true, limit: 5 }),
    prisma.blogPost.findMany({ where: { published: true }, orderBy: { publishedAt: "desc" }, take: 3 }),
  ]);
  return <>
    <section className="hero">
      <Image src="/images/hero-coffee.jpg" alt="Tách cà phê và hạt cà phê Việt Beanora" fill priority sizes="100vw" />
      <div className="hero-overlay" />
      <div className="container hero-content">
        <div className="hero-copy"><span className="hero-kicker"><i /> Từ vùng trồng Việt Nam <i /></span><h1>Tinh hoa<br /><em>cà phê Việt</em></h1><p>Hương vị thuần khiết từ những hạt cà phê được chọn lọc, rang mới theo mẻ nhỏ và gói trọn câu chuyện vùng trồng.</p><div className="hero-actions"><Link href="/shop" className="button button-copper">Khám phá ngay <ArrowRight size={17} /></Link><Link href="/product/ca-phe-arabica-dak-lak" className="button button-glass">Mua ngay <span>→</span></Link></div><div className="hero-proof"><div><strong>100%</strong><span>Cà phê Việt Nam</span></div><i /><div><strong>Rang mới</strong><span>Theo từng mẻ nhỏ</span></div><i /><div><strong>Truy xuất</strong><span>Rõ vùng nguyên liệu</span></div></div></div>
      </div>
      <div className="hero-caption"><Coffee size={15} /><span>A good day starts with a thoughtful cup.</span></div>
    </section>

    <section className="service-strip"><div className="container"><div><Truck /><span><strong>Giao hàng toàn quốc</strong><small>Miễn phí đơn từ 1 triệu</small></span></div><div><RotateCcw /><span><strong>Đổi trả rõ ràng</strong><small>Hỗ trợ khi có vấn đề</small></span></div><div><CreditCard /><span><strong>Thanh toán linh hoạt</strong><small>COD & chuyển khoản QR</small></span></div><div><Headphones /><span><strong>Tư vấn tận tâm</strong><small>Chọn đúng gu cà phê</small></span></div></div></section>

    <section className="section featured-section"><div className="container"><SectionHeading eyebrow="Lựa chọn từ xưởng rang" title="Sản phẩm nổi bật" description="Những hương vị được yêu thích cho tách cà phê mỗi ngày." link={{ href: "/shop", label: "Xem tất cả" }} /><ProductGrid products={products} /><div className="featured-note"><BadgeCheck size={16} />Giá và tồn kho được cập nhật trực tiếp từ hệ thống cửa hàng.</div></div></section>

    <section className="section story-section"><div className="container story-layout"><div className="story-image"><Image src="/images/arabica-dak-lak.jpg" alt="Cà phê Beanora từ vùng nguyên liệu Việt" fill sizes="(max-width: 800px) 100vw, 50vw" /><div className="story-seal"><Leaf /><span>VIETNAMESE<br />COFFEE CRAFT</span></div></div><div className="story-copy"><span className="eyebrow">Câu chuyện Beanora</span><h2>Mỗi hạt cà phê,<br />một <em>nhịp sống</em> chân thành.</h2><p className="story-lead">Beanora bắt đầu từ một điều giản dị: mong mỗi buổi sáng của bạn đều có một tách cà phê thật ngon.</p><p>Chúng tôi tìm đến những vùng nguyên liệu Việt, lắng nghe đặc trưng của từng giống hạt và rang theo mẻ nhỏ. Không chạy theo sự phức tạp, chỉ chăm chút để hương vị được nói đúng câu chuyện của nó.</p><div className="story-values"><div><span>01</span><p><strong>Chọn hạt có lý do</strong>Rõ nguồn gốc, rõ đặc trưng.</p></div><div><span>02</span><p><strong>Rang để tôn vinh</strong>Biểu đồ riêng cho từng mẻ.</p></div><div><span>03</span><p><strong>Pha theo cách của bạn</strong>Đồng hành cùng từng khẩu vị.</p></div></div><Link href="/about" className="button button-dark">Khám phá câu chuyện <ArrowRight size={17} /></Link></div></div></section>

    <section className="section category-section"><div className="container"><SectionHeading eyebrow="Tìm đúng gu của bạn" title="Chọn cà phê theo phong vị" align="center" /><div className="category-showcase"><Link href="/shop?category=ca-phe-arabica" className="category-card"><Image src="/images/arabica-cau-dat.jpg" alt="Cà phê Arabica" fill sizes="(max-width: 600px) 50vw, 25vw" /><div><span>Thanh nhẹ · Nhiều lớp hương</span><h3>Arabica</h3><p>Khám phá <ArrowRight /></p></div></Link><Link href="/shop?category=ca-phe-robusta" className="category-card"><Image src="/images/robusta-buon-ma-thuot.jpg" alt="Cà phê Robusta" fill sizes="(max-width: 600px) 50vw, 25vw" /><div><span>Đậm đà · Mạnh mẽ</span><h3>Robusta</h3><p>Khám phá <ArrowRight /></p></div></Link><Link href="/shop?category=ca-phe-specialty" className="category-card"><Image src="/images/specialty-cau-dat.jpg" alt="Cà phê Specialty" fill sizes="(max-width: 600px) 50vw, 25vw" /><div><span>Chọn lọc · Đặc trưng vùng</span><h3>Specialty</h3><p>Khám phá <ArrowRight /></p></div></Link><Link href="/shop?category=combo-ca-phe" className="category-card"><Image src="/images/combo-kham-pha.jpg" alt="Combo cà phê" fill sizes="(max-width: 600px) 50vw, 25vw" /><div><span>Trải nghiệm · Sẻ chia</span><h3>Combo & quà</h3><p>Khám phá <ArrowRight /></p></div></Link></div></div></section>

    <section className="section craft-section"><div className="container"><SectionHeading eyebrow="Từ hạt đến tách" title="Chăm chút ở từng nhịp" description="Một quy trình rõ ràng để hương vị luôn có sự nhất quán." align="center" /><div className="craft-steps"><div><span className="craft-number">01</span><div className="craft-icon"><Leaf /></div><h3>Chọn từ vùng trồng</h3><p>Ưu tiên hạt chín, nguồn gốc rõ ràng và đặc trưng vùng nguyên liệu.</p></div><ChevronRight className="craft-arrow" /><div><span className="craft-number">02</span><div className="craft-icon"><Coffee /></div><h3>Rang mới mẻ nhỏ</h3><p>Theo dõi nhiệt độ và thời gian để tìm điểm ngọt của từng loại hạt.</p></div><ChevronRight className="craft-arrow" /><div><span className="craft-number">03</span><div className="craft-icon"><PackageCheck /></div><h3>Đóng gói & giao tới bạn</h3><p>Giữ trọn hương thơm, kèm hướng dẫn pha phù hợp với từng sản phẩm.</p></div></div></div></section>

    {posts.length > 0 && <section className="section journal-section"><div className="container"><SectionHeading eyebrow="Góc cà phê" title="Pha ngon hơn mỗi ngày" description="Kiến thức đơn giản để bạn hiểu và tận hưởng tách cà phê theo cách riêng." link={{ href: "/blog", label: "Xem tất cả bài viết" }} /><div className="journal-grid">{posts.map((post, index) => <Link href={`/blog/${post.slug}`} className={`journal-card ${index === 0 ? "large" : ""}`} key={post.id}><div className="journal-image"><Image src={post.coverUrl || "/images/hero-coffee.jpg"} alt={post.title} fill sizes="(max-width: 800px) 100vw, 33vw" /></div><div><span>Kiến thức cà phê</span><h3>{post.title}</h3><p>{post.excerpt}</p><b>Đọc bài viết <ArrowRight size={15} /></b></div></Link>)}</div></div></section>}
  </>;
}
