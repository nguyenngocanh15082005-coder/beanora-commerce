import Image from "next/image";
import { Coffee, Leaf, PackageCheck } from "lucide-react";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return <div className="auth-page container"><div className="auth-visual"><Image src="/images/hero-coffee.jpg" alt="Không gian cà phê Beanora" fill priority sizes="(max-width: 800px) 0vw, 50vw" /><div><span>BEANORA MEMBERS</span><h2>Mỗi tách cà phê,<br />một hành trình đáng nhớ.</h2><p>Lưu lại hương vị yêu thích và theo dõi từng đơn hàng từ xưởng rang đến bạn.</p><div><span><Coffee />Tư vấn đúng gu</span><span><PackageCheck />Theo dõi đơn dễ dàng</span><span><Leaf />Ưu tiên mẻ rang mới</span></div></div></div>{children}</div>;
}
