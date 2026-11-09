import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { AuthForm } from "@/components/auth-form";
export const metadata: Metadata = { title: "Đăng nhập", robots: { index: false, follow: false } };
export default function LoginPage() { return <AuthShell><AuthForm mode="login" /></AuthShell>; }
