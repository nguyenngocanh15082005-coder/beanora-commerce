"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Loader2, PackageSearch, Search } from "lucide-react";
import { apiFetch } from "@/lib/client";
import { formatDate, formatPrice, orderStatusLabels, paymentStatusLabels, statusTone } from "@/lib/format";
import type { OrderStatus, PaymentStatus } from "@prisma/client";

type TrackedOrder = { id: string; orderCode: string; createdAt: string; total: number; status: OrderStatus; paymentStatus: PaymentStatus; customerName: string; items: { id: string; productName: string; variantName: string; quantity: number }[]; history: { id: string; status: OrderStatus; note: string | null; createdAt: string }[]; invoice: { invoiceNumber: string } | null };

export function OrderTracker({ initialCode = "", initialPhone = "" }: { initialCode?: string; initialPhone?: string }) {
  const [orderCode, setOrderCode] = useState(initialCode);
  const [phone, setPhone] = useState(initialPhone);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const track = async (event?: React.FormEvent) => {
    event?.preventDefault(); setLoading(true); setError(""); setOrder(null);
    try {
      const result = await apiFetch<{ order: TrackedOrder }>("/api/orders/track", { method: "POST", body: JSON.stringify({ orderCode, phone }) });
      setOrder(result.order);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể tra cứu đơn hàng."); }
    finally { setLoading(false); }
  };
  return <div className="tracker-layout"><section className="tracker-intro"><span className="eyebrow">Order tracking</span><h1>Theo dõi từng nhịp<br />đơn hàng của bạn.</h1><p>Nhập mã đơn và số điện thoại đã dùng khi đặt hàng. Không cần đăng nhập.</p><form onSubmit={track} className="tracker-form"><label>Mã đơn hàng<div><PackageSearch size={17} /><input value={orderCode} onChange={(e) => setOrderCode(e.target.value.toUpperCase())} placeholder="Ví dụ: BN2611041234" required /></div></label><label>Số điện thoại<div><Search size={17} /><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Số điện thoại đặt hàng" required /></div></label><button className="button button-copper" disabled={loading}>{loading ? <Loader2 className="spin" size={16} /> : <Search size={16} />}Tra cứu đơn hàng</button></form>{error && <div className="form-error">{error}</div>}<small>Thông tin đơn hàng chỉ hiển thị khi mã đơn và số điện thoại khớp nhau.</small></section><section className={`tracker-result ${order ? "has-order" : ""}`}>{!order ? <div className="tracker-placeholder"><PackageSearch size={52} strokeWidth={1} /><h2>Đơn hàng ở đâu rồi?</h2><p>Kết quả và lịch sử cập nhật sẽ xuất hiện tại đây.</p></div> : <><div className="tracked-head"><div><span>Đơn hàng</span><h2>#{order.orderCode}</h2><small>Đặt lúc {formatDate(order.createdAt)}</small></div><span className={`status-badge ${statusTone(order.status)}`}>{orderStatusLabels[order.status]}</span></div><div className="tracked-products">{order.items.map((item) => <div key={item.id}><span>{item.quantity} × {item.productName}<small>{item.variantName}</small></span></div>)}<strong>Tổng: {formatPrice(order.total)}</strong><span className={`status-badge ${statusTone(order.paymentStatus)}`}>{paymentStatusLabels[order.paymentStatus]}</span></div><div className="tracking-timeline">{order.history.map((history, index) => <div key={history.id} className={index === order.history.length - 1 ? "current" : "done"}><span>{index < order.history.length - 1 && <Check size={13} />}</span><div><strong>{orderStatusLabels[history.status]}</strong><p>{history.note}</p><small>{formatDate(history.createdAt)}</small></div></div>)}</div><Link href={`/order/${order.orderCode}?phone=${encodeURIComponent(phone)}`} className="button button-dark">Xem chi tiết & thanh toán →</Link></>}</section></div>;
}
