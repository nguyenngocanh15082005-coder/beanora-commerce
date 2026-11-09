"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { useCart } from "@/components/cart-provider";

type HeaderUser = { name: string; isAdmin: boolean } | null;

export function SiteHeader({ user }: { user: HeaderUser }) {
  const { count, openCart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => { setMenuOpen(false); setSearchOpen(false); }, [pathname]);
  const links = [{ href: "/", label: "Trang chủ" }, { href: "/shop", label: "Sản phẩm" }, { href: "/about", label: "Câu chuyện" }, { href: "/blog", label: "Góc cà phê" }, { href: "/contact", label: "Liên hệ" }];
  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (search.trim()) router.push(`/shop?search=${encodeURIComponent(search.trim())}`);
  };
  return <>
    <div className="announcement"><div className="container"><span>Giao hàng toàn quốc · Miễn phí vận chuyển đơn từ 1.000.000đ</span><span className="announcement-right">Rang mới mỗi tuần <i /> <Link href="/track">Tra cứu đơn hàng</Link></span></div></div>
    <header className="site-header">
      <div className="container header-inner">
        <button className="mobile-menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Mở menu">{menuOpen ? <X /> : <Menu />}</button>
        <BrandLogo />
        <nav className={`main-nav ${menuOpen ? "is-open" : ""}`} aria-label="Điều hướng chính">
          {links.map((link) => <Link key={link.href} href={link.href} className={pathname === link.href ? "active" : ""}>{link.label}</Link>)}
          <Link href="/track" className="mobile-only">Theo dõi đơn hàng</Link>
          <Link href={user ? "/account" : "/login"} className="mobile-only">{user ? "Tài khoản của tôi" : "Đăng nhập"}</Link>
        </nav>
        <div className="header-actions">
          <form className={`header-search ${searchOpen ? "is-open" : ""}`} onSubmit={submitSearch}>
            {searchOpen && <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm hương vị của bạn..." aria-label="Tìm kiếm sản phẩm" />}
            <button type={searchOpen ? "submit" : "button"} onClick={() => !searchOpen && setSearchOpen(true)} aria-label="Tìm kiếm"><Search size={19} /></button>
            {searchOpen && <button type="button" onClick={() => setSearchOpen(false)} aria-label="Đóng tìm kiếm"><X size={16} /></button>}
          </form>
          <button className="header-action cart-action" onClick={openCart} aria-label={`Giỏ hàng, ${count} sản phẩm`}><ShoppingBag size={20} /><span className="action-label">Giỏ hàng</span>{count > 0 && <b>{count > 99 ? "99+" : count}</b>}</button>
          <Link href={user ? "/account" : "/login"} className="header-action account-action" aria-label={user ? `Tài khoản ${user.name}` : "Đăng nhập"}><UserRound size={20} /><span className="action-label">{user ? user.name.split(" ").pop() : "Đăng nhập"}</span>{user && <ChevronDown size={13} />}</Link>
        </div>
      </div>
    </header>
  </>;
}
