import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { AuthForm } from "@/components/auth-form";
export const metadata: Metadata = { title: "Đăng ký", robots: { index: false, follow: false } };
export default function RegisterPage() { return <AuthShell><AuthForm mode="register" /></AuthShell>; }
