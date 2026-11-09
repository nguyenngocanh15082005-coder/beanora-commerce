"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { BadgePercent, Boxes, ChevronRight, CircleUserRound, CreditCard, ExternalLink, FileText, LayoutDashboard, LogOut, Menu, Package, Settings, ShoppingCart, Tags, Users, UserCog, X } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

const nav = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Đơn hàng", icon: ShoppingCart },
  { href: "/admin/products", label: "Sản phẩm", icon: Package },
  { href: "/admin/categories", label: "Danh mục", icon: Tags },
  { href: "/admin/inventory", label: "Kho hàng", icon: Boxes },
  { href: "/admin/customers", label: "Khách hàng", icon: Users },
  { href: "/admin/staff", label: "Nhân viên & phân quyền", icon: UserCog },
  { href: "/admin/promotions", label: "Khuyến mãi", icon: BadgePercent },
  { href: "/admin/content", label: "Nội dung & thương hiệu", icon: FileText },
  { href: "/admin/settings", label: "Cài đặt thanh toán", icon: CreditCard },
];
export function AdminShell({ children, user }: { children: React.ReactNode; user: { name: string; email: string; roles: string[] } }) {
  const pathname = usePathname(); const router = useRouter(); const [open, setOpen] = useState(false);
  const logout = async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); router.refresh(); };
  return <div className="admin-shell"><aside className={`admin-sidebar ${open ? "is-open" : ""}`}><div className="admin-logo"><BrandLogo /><span>ADMIN</span><button onClick={() => setOpen(false)}><X /></button></div><div className="admin-store"><span>BN</span><div><strong>Beanora Coffee</strong><small>Kênh bán hàng độc lập</small></div></div><nav>{nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setOpen(false)} className={pathname === href ? "active" : ""}><Icon size={17} /><span>{label}</span>{pathname === href && <ChevronRight size={13} />}</Link>)}</nav><div className="admin-sidebar-bottom"><Link href="/" target="_blank"><ExternalLink size={16} />Xem cửa hàng</Link><button onClick={logout}><LogOut size={16} />Đăng xuất</button><small>Beanora Commerce · v1.0</small></div></aside><div className="admin-workspace"><header className="admin-topbar"><button className="admin-menu" onClick={() => setOpen(true)}><Menu /></button><div><span>Hệ thống vận hành Beanora</span><small>Dữ liệu trực tiếp từ PostgreSQL</small></div><div className="admin-user"><span><CircleUserRound /></span><div><strong>{user.name}</strong><small>{user.roles.join(", ")}</small></div></div></header><main className="admin-main">{children}</main></div></div>;
}
