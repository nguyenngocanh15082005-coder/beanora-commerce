import Link from "next/link";

export function BrandMark({ size = 38 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden="true"><path d="M8 30C7 17 17 7 35 7c1 18-9 29-23 28" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M10 34C16 25 23 18 34 10M16 26c-1-5 0-9 2-12M21 21c5 1 9 0 12-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M8 36c8 2 17 2 26-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
}

export function BrandLogo({ light = false, href = "/" }: { light?: boolean; href?: string }) {
  return <Link href={href} className={`brand-logo ${light ? "light" : ""}`} aria-label="Beanora - Trang chủ"><BrandMark /><span><strong>Beanora</strong><small>Coffee & Lifestyle</small></span></Link>;
}
