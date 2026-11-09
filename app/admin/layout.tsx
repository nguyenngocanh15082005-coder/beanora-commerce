import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdmin(user)) redirect("/");
  return <AdminShell user={{ name: user.name, email: user.email, roles: user.roles.map(({ role }) => role.name) }}>{children}</AdminShell>;
}
