import Link from "next/link";
import { Facebook, Instagram, Mail, MapPin, Phone, Youtube } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

export function SiteFooter() {
  return <footer className="site-footer">
    <div className="container footer-newsletter">
      <div><span className="eyebrow light">Thư từ xưởng rang</span><h3>Một chút cà phê, một chút cảm hứng.</h3><p>Nhận hướng dẫn pha, câu chuyện vùng trồng và thông tin mẻ rang mới.</p></div>
      <form action="/api/newsletter" method="post" className="newsletter-form"><input type="email" name="email" required placeholder="Email của bạn" aria-label="Email đăng ký nhận tin" /><button className="button button-copper">Đăng ký <span>→</span></button></form>
    </div>
    <div className="container footer-grid">
      <div className="footer-brand"><BrandLogo light /><p>Tôn vinh hạt cà phê Việt qua từng mẻ rang chân thành, từ vùng nguyên liệu đến tách cà phê mỗi ngày.</p><div className="social-links"><a href="https://facebook.com" aria-label="Facebook" rel="noreferrer"><Facebook size={17} /></a><a href="https://instagram.com" aria-label="Instagram" rel="noreferrer"><Instagram size={17} /></a><a href="https://youtube.com" aria-label="Youtube" rel="noreferrer"><Youtube size={17} /></a></div></div>
      <div><h4>Khám phá</h4><Link href="/shop">Tất cả sản phẩm</Link><Link href="/shop?category=ca-phe-arabica">Cà phê Arabica</Link><Link href="/shop?category=ca-phe-robusta">Cà phê Robusta</Link><Link href="/shop?category=combo-ca-phe">Combo & quà tặng</Link><Link href="/blog">Góc kiến thức</Link></div>
      <div><h4>Hỗ trợ khách hàng</h4><Link href="/track">Theo dõi đơn hàng</Link><Link href="/account">Tài khoản của tôi</Link><Link href="/policy/shipping">Chính sách vận chuyển</Link><Link href="/policy/returns">Chính sách đổi trả</Link><Link href="/policy/privacy">Bảo mật thông tin</Link><Link href="/policy/terms">Điều khoản sử dụng</Link></div>
      <div><h4>Liên hệ Beanora</h4><p className="footer-contact"><MapPin size={16} />Biên Hòa, Đồng Nai, Việt Nam</p><p className="footer-contact"><Phone size={16} /><span>Hotline đang được cập nhật</span></p><p className="footer-contact"><Mail size={16} />hello@beanora.vn</p><small>Thứ Hai – Thứ Bảy<br />08:00 – 18:00</small></div>
    </div>
    <div className="container footer-bottom"><span>© {new Date().getFullYear()} Beanora Coffee. All rights reserved.</span><span>Made with care in Vietnam <i>♥</i></span></div>
  </footer>;
}
