import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { PasswordForm } from "@/components/password-form";
export const metadata: Metadata = { title: "Quên mật khẩu", robots: { index: false, follow: false } };
export default function ForgotPasswordPage() { return <AuthShell><PasswordForm mode="forgot" /></AuthShell>; }
