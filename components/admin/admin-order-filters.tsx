"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { orderStatusLabels } from "@/lib/format";
import type { OrderStatus } from "@prisma/client";
export function AdminOrderFilters() {
  const router = useRouter(); const params = useSearchParams();
  const submit = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); const query = new URLSearchParams(); for (const [key, value] of data) if (String(value)) query.set(key, String(value)); router.push(`/admin/orders?${query.toString()}`); };
  return <form className="admin-filters" onSubmit={submit}><div><Search size={15} /><input name="search" defaultValue={params.get("search") || ""} placeholder="Mã đơn, tên hoặc số điện thoại..." /></div><select name="status" defaultValue={params.get("status") || ""}><option value="">Tất cả trạng thái</option>{Object.entries(orderStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select name="payment" defaultValue={params.get("payment") || ""}><option value="">Tất cả thanh toán</option><option value="COD">COD</option><option value="BANK_TRANSFER">Chuyển khoản</option></select><button className="button button-dark">Lọc đơn</button><button type="button" className="button button-outline" onClick={() => router.push("/admin/orders")}>Đặt lại</button></form>;
}
