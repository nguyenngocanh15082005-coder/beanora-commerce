"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Search, UnlockKeyhole } from "lucide-react";
import { formatDate, formatPrice } from "@/lib/format";
import { apiFetch } from "@/lib/client";
type User = { id: string; name: string; email: string; phone: string | null; createdAt: string; locked: boolean; roles: string[]; orderCount: number; paidTotal: number };
export function AdminCustomers({ users }: { users: User[] }) {
  const [search, setSearch] = useState(""); const [message, setMessage] = useState(""); const router = useRouter();
  const filtered = users.filter((u) => `${u.name} ${u.email} ${u.phone}`.toLowerCase().includes(search.toLowerCase()));
  const toggle = async (user: User) => { if (!confirm(user.locked ? "Mở khóa tài khoản này?" : "Khóa tài khoản và hủy toàn bộ phiên đăng nhập?")) return; try { await apiFetch(`/api/admin/customers/${user.id}`, { method: "PATCH", body: JSON.stringify({ locked: !user.locked }) }); setMessage("Đã cập nhật trạng thái tài khoản."); router.refresh(); } catch (error) { setMessage(error instanceof Error ? error.message : "Không thể cập nhật"); } };
  return <><div className="admin-toolbar-row"><div className="admin-inline-search"><Search size={15} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm khách hàng..." /></div><span className="admin-filter-pill">{filtered.length} tài khoản</span></div>{message && <div className="admin-notice">{message}</div>}<section className="admin-card"><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Khách hàng</th><th>Liên hệ</th><th>Vai trò</th><th>Đơn hàng</th><th>Đã thanh toán</th><th>Ngày tham gia</th><th>Trạng thái</th></tr></thead><tbody>{filtered.map((user) => <tr key={user.id}><td><strong>{user.name}</strong></td><td>{user.email}<small>{user.phone || "Chưa có SĐT"}</small></td><td>{user.roles.length ? user.roles.join(", ") : "Khách hàng"}</td><td>{user.orderCount}</td><td>{formatPrice(user.paidTotal)}</td><td>{formatDate(user.createdAt)}</td><td>{user.locked ? <span className="status-badge danger">Đã khóa</span> : <span className="status-badge success">Hoạt động</span>}{!user.roles.length && <button className="admin-view-link" onClick={() => toggle(user)}>{user.locked ? <UnlockKeyhole size={13} /> : <LockKeyhole size={13} />}{user.locked ? "Mở khóa" : "Khóa"}</button>}</td></tr>)}</tbody></table></div></section></>;
}
