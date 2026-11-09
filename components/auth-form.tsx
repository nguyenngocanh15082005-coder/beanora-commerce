"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import { apiFetch } from "@/lib/client";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", identifier: "", password: "", confirm: "", remember: true, terms: false });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const update = (key: string, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError("");
    if (mode === "register" && form.password !== form.confirm) { setError("Mật khẩu xác nhận chưa khớp."); return; }
    setLoading(true);
    try {
      const result = await apiFetch<{ user: { roles?: string[] } }>(`/api/auth/${mode}`, { method: "POST", body: JSON.stringify(mode === "login" ? { identifier: form.identifier, password: form.password, remember: form.remember } : { name: form.name, email: form.email, phone: form.phone, password: form.password, terms: form.terms }) });
      router.push(result.user.roles?.some((r) => ["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"].includes(r)) ? "/admin" : "/account"); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể xử lý."); setLoading(false); }
  };
  return <div className="auth-card"><span className="eyebrow">{mode === "login" ? "Welcome back" : "Join Beanora"}</span><h1>{mode === "login" ? "Chào mừng trở lại." : "Tạo tài khoản Beanora."}</h1><p>{mode === "login" ? "Đăng nhập để theo dõi đơn hàng, hóa đơn và những hương vị bạn yêu thích." : "Lưu hành trình cà phê, đặt hàng nhanh hơn và quản lý đơn ở một nơi."}</p><form onSubmit={submit}>
    {mode === "register" && <label>Họ và tên<div className="input-with-icon"><UserRound size={16} /><input value={form.name} onChange={(e) => update("name", e.target.value)} required minLength={2} placeholder="Họ tên của bạn" autoComplete="name" /></div></label>}
    {mode === "login" ? <label>Email hoặc số điện thoại<div className="input-with-icon"><Mail size={16} /><input value={form.identifier} onChange={(e) => update("identifier", e.target.value)} required placeholder="ban@email.vn" autoComplete="username" /></div></label> : <><label>Email<div className="input-with-icon"><Mail size={16} /><input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required placeholder="ban@email.vn" autoComplete="email" /></div></label><label>Số điện thoại<div className="input-with-icon"><Phone size={16} /><input value={form.phone} onChange={(e) => update("phone", e.target.value)} required placeholder="0901 234 567" autoComplete="tel" /></div></label></>}
    <label>Mật khẩu<div className="input-with-icon"><LockKeyhole size={16} /><input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => update("password", e.target.value)} required minLength={mode === "register" ? 8 : 1} placeholder={mode === "register" ? "Tối thiểu 8 ký tự" : "Mật khẩu của bạn"} autoComplete={mode === "login" ? "current-password" : "new-password"} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Hiện mật khẩu">{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button></div>{mode === "register" && <small>Bao gồm chữ hoa, chữ thường và ít nhất một chữ số.</small>}</label>
    {mode === "register" && <label>Xác nhận mật khẩu<div className="input-with-icon"><LockKeyhole size={16} /><input type="password" value={form.confirm} onChange={(e) => update("confirm", e.target.value)} required placeholder="Nhập lại mật khẩu" autoComplete="new-password" /></div></label>}
    {mode === "login" ? <div className="auth-options"><label><input type="checkbox" checked={form.remember} onChange={(e) => update("remember", e.target.checked)} />Ghi nhớ đăng nhập</label><Link href="/forgot-password">Quên mật khẩu?</Link></div> : <label className="terms-check"><input type="checkbox" checked={form.terms} onChange={(e) => update("terms", e.target.checked)} required />Tôi đồng ý với <Link href="/policy/terms">điều khoản sử dụng</Link> và <Link href="/policy/privacy">chính sách bảo mật</Link>.</label>}
    {error && <div className="form-error">{error}</div>}<button className="button button-copper button-full" disabled={loading}>{loading ? <Loader2 className="spin" size={17} /> : <>{mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}<ArrowRight size={16} /></>}</button>
  </form><div className="auth-switch">{mode === "login" ? <>Chưa có tài khoản? <Link href="/register">Đăng ký ngay</Link></> : <>Đã có tài khoản? <Link href="/login">Đăng nhập</Link></>}</div></div>;
}
