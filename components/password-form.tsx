"use client";
import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/client";
export function PasswordForm({ mode, token = "" }: { mode: "forgot" | "reset"; token?: string }) {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(""); setMessage("");
    if (mode === "reset" && password !== confirm) { setError("Mật khẩu xác nhận chưa khớp."); return; }
    setLoading(true);
    try { const result = await apiFetch<{ message: string }>(`/api/auth/${mode === "forgot" ? "forgot" : "reset"}`, { method: "POST", body: JSON.stringify(mode === "forgot" ? { email } : { token, password }) }); setMessage(result.message); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể xử lý."); }
    finally { setLoading(false); }
  };
  return <div className="auth-card"><span className="eyebrow">Account recovery</span><h1>{mode === "forgot" ? "Khôi phục mật khẩu." : "Đặt mật khẩu mới."}</h1><p>{mode === "forgot" ? "Nhập email đã đăng ký. Chúng tôi sẽ gửi hướng dẫn nếu tài khoản tồn tại và dịch vụ email đã được cấu hình." : "Mật khẩu mới cần tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và chữ số."}</p><form onSubmit={submit}>{mode === "forgot" ? <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="ban@email.vn" /></label> : <><label>Mật khẩu mới<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} /></label><label>Xác nhận mật khẩu<input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} /></label></>}{error && <div className="form-error">{error}</div>}{message && <div className="form-success">{message}</div>}<button className="button button-copper button-full" disabled={loading || !token && mode === "reset"}>{loading && <Loader2 className="spin" size={16} />}{mode === "forgot" ? "Gửi hướng dẫn" : "Cập nhật mật khẩu"}</button></form><div className="auth-switch"><Link href="/login">← Quay lại đăng nhập</Link></div></div>;
}
