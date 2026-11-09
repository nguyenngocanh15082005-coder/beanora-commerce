import type { Metadata } from "next";
import { Be_Vietnam_Pro, Playfair_Display } from "next/font/google";
import "./globals.css";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { CartProvider } from "@/components/cart-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ChatWidget } from "@/components/chat-widget";

const sans = Be_Vietnam_Pro({ subsets: ["vietnamese", "latin"], weight: ["400", "500", "600", "700"], variable: "--font-sans", display: "swap" });
const serif = Playfair_Display({ subsets: ["vietnamese", "latin"], weight: ["500", "600", "700"], variable: "--font-serif", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
  title: { default: "Beanora — Tinh hoa cà phê Việt", template: "%s | Beanora Coffee" },
  description: "Cà phê Việt rang mới theo mẻ nhỏ. Arabica, Robusta, Specialty và công thức phin truyền thống, giao hàng toàn quốc.",
  keywords: ["cà phê Việt", "cà phê rang xay", "Arabica", "Robusta", "Beanora"],
  openGraph: { title: "Beanora — Tinh hoa cà phê Việt", description: "More than coffee — It’s a lifestyle", images: ["/images/hero-coffee.jpg"], locale: "vi_VN", type: "website" },
  robots: { index: true, follow: true },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const currentUser = await getCurrentUser();
  const user = currentUser ? { name: currentUser.name, isAdmin: isAdmin(currentUser) } : null;
  return <html lang="vi" className={`${sans.variable} ${serif.variable}`}>
    <body><CartProvider userId={currentUser?.id}><SiteHeader user={user} /><main>{children}</main><SiteFooter /><ChatWidget /></CartProvider></body>
  </html>;
}
