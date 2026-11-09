import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { PasswordForm } from "@/components/password-form";
export const metadata: Metadata = { title: "Đặt lại mật khẩu", robots: { index: false, follow: false } };
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) { const { token = "" } = await searchParams; return <AuthShell><PasswordForm mode="reset" token={token} /></AuthShell>; }
