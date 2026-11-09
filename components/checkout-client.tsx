"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Banknote, Check, ChevronRight, CreditCard, Loader2, LockKeyhole, MapPin, PackageCheck, ShoppingBag, UserRound } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { formatPrice } from "@/lib/format";
import { apiFetch } from "@/lib/client";
import type { CheckoutResponse } from "@/lib/cart-types";

type Settings = { codEnabled: boolean; bankEnabled: boolean; shippingFee: number; freeShippingFrom: number };
type User = { name: string; email: string; phone: string } | null;
type FormState = { customerName: string; customerPhone: string; customerEmail: string; province: string; ward: string; addressLine: string; deliveryNote: string };

export function CheckoutClient({ settings, user }: { settings: Settings; user: User }) {
  const { items, subtotal, hydrated, clearCart } = useCart();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>({ customerName: user?.name || "", customerPhone: user?.phone || "", customerEmail: user?.email || "", province: "", ward: "", addressLine: "", deliveryNote: "" });
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "BANK_TRANSFER">("COD");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [terms, setTerms] = useState(true);
  const [error, setError] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const router = useRouter();
  const shipping = subtotal - (coupon?.discount || 0) >= settings.freeShippingFrom ? 0 : settings.shippingFee;
  const total = subtotal - (coupon?.discount || 0) + shipping;
  const update = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const validateStep = () => {
    if (step === 1 && (!form.customerName.trim() || !/^(0|\+84)\d{9,10}$/.test(form.customerPhone) || !/^\S+@\S+\.\S+$/.test(form.customerEmail))) { setError("Vui lòng nhập đúng họ tên, số điện thoại và email."); return false; }
    if (step === 2 && (!form.province.trim() || !form.ward.trim() || form.addressLine.trim().length < 5)) { setError("Vui lòng nhập đầy đủ địa chỉ nhận hàng."); return false; }
    setError(""); return true;
  };
  const next = () => { if (validateStep()) setStep((current) => Math.min(3, current + 1)); };
  const applyCoupon = async () => {
    setCouponMessage(""); setError("");
    try {
      const result = await apiFetch<{ discount: number; message: string }>("/api/coupons/validate", { method: "POST", body: JSON.stringify({ code: couponInput, subtotal }) });
      setCoupon({ code: couponInput.toUpperCase(), discount: result.discount }); setCouponMessage(result.message);
    } catch (reason) { setCoupon(null); setCouponMessage(reason instanceof Error ? reason.message : "Mã không hợp lệ"); }
  };
  const submit = async () => {
    if (!terms) { setError("Vui lòng đồng ý với điều khoản và chính sách mua hàng."); return; }
    setLoading(true); setError("");
    try {
      const result = await apiFetch<CheckoutResponse>("/api/orders", { method: "POST", body: JSON.stringify({ ...form, items: items.map(({ variantId, quantity }) => ({ variantId, quantity })), paymentMethod, couponCode: coupon?.code, idempotencyKey }) });
      clearCart(); router.push(`/order/${result.orderCode}?phone=${encodeURIComponent(form.customerPhone)}&new=1`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể tạo đơn hàng."); setLoading(false); }
  };
  const steps = useMemo(() => [{ number: 1, label: "Thông tin", icon: UserRound }, { number: 2, label: "Địa chỉ", icon: MapPin }, { number: 3, label: "Kiểm tra & thanh toán", icon: CreditCard }], []);
  if (!hydrated) return <div className="page-loading"><div className="coffee-loader"><span /><span /><span /></div><p>Đang chuẩn bị thanh toán...</p></div>;
  if (!items.length) return <div className="container checkout-empty"><span className="empty-icon"><ShoppingBag size={28} /></span><h1>Chưa có sản phẩm để thanh toán</h1><p>Thêm cà phê vào giỏ hàng trước khi tiếp tục.</p><Link href="/shop" className="button button-copper">Khám phá sản phẩm</Link></div>;
  return <div className="checkout-page container"><div className="checkout-top"><Link href="/cart" className="text-link"><ArrowLeft size={14} />Quay lại giỏ hàng</Link><span><LockKeyhole size={13} />Thanh toán an toàn</span></div><div className="checkout-title"><span className="eyebrow">Complete your order</span><h1>Thanh toán</h1></div><div className="checkout-steps">{steps.map(({ number, label, icon: Icon }) => <div key={number} className={`${step === number ? "active" : ""} ${step > number ? "done" : ""}`}><span>{step > number ? <Check size={16} /> : <Icon size={16} />}</span><p><small>Bước {number}</small><strong>{label}</strong></p>{number < 3 && <ChevronRight />}</div>)}</div>
    <div className="checkout-layout"><div className="checkout-main">
      {step === 1 && <section className="checkout-panel"><div className="panel-heading"><span>01</span><div><h2>Thông tin khách hàng</h2><p>Để Beanora liên hệ và gửi xác nhận đơn hàng.</p></div></div><div className="form-grid"><label className="full">Họ và tên *<input value={form.customerName} onChange={(e) => update("customerName", e.target.value)} placeholder="Nguyễn Ngọc Anh" autoComplete="name" /></label><label>Số điện thoại *<input value={form.customerPhone} onChange={(e) => update("customerPhone", e.target.value)} placeholder="0901 234 567" autoComplete="tel" inputMode="tel" /></label><label>Email nhận hóa đơn *<input type="email" value={form.customerEmail} onChange={(e) => update("customerEmail", e.target.value)} placeholder="ban@email.vn" autoComplete="email" /></label></div><div className="checkout-nav"><span /><button className="button button-copper" onClick={next}>Tiếp tục đến địa chỉ <ArrowRight size={16} /></button></div></section>}
      {step === 2 && <section className="checkout-panel"><div className="panel-heading"><span>02</span><div><h2>Địa chỉ nhận hàng</h2><p>Nhập địa chỉ chi tiết để đơn vị vận chuyển giao hàng thuận tiện.</p></div></div><div className="form-grid"><label>Tỉnh / Thành phố *<input value={form.province} onChange={(e) => update("province", e.target.value)} placeholder="Ví dụ: Đồng Nai" autoComplete="address-level1" /></label><label>Phường / Xã *<input value={form.ward} onChange={(e) => update("ward", e.target.value)} placeholder="Ví dụ: Trảng Dài" autoComplete="address-level2" /></label><label className="full">Số nhà, tên đường *<input value={form.addressLine} onChange={(e) => update("addressLine", e.target.value)} placeholder="Số nhà, đường, khu phố" autoComplete="street-address" /></label><label className="full">Ghi chú giao hàng (không bắt buộc)<textarea value={form.deliveryNote} onChange={(e) => update("deliveryNote", e.target.value)} placeholder="Ví dụ: Giao trong giờ hành chính, gọi trước khi đến..." rows={3} maxLength={500} /></label></div><div className="address-review"><MapPin size={18} /><div><strong>{form.customerName} · {form.customerPhone}</strong><p>{form.addressLine || "Địa chỉ"}, {form.ward || "Phường/xã"}, {form.province || "Tỉnh/thành"}</p></div></div><div className="checkout-nav"><button className="button button-outline" onClick={() => setStep(1)}>Quay lại</button><button className="button button-copper" onClick={next}>Kiểm tra đơn hàng <ArrowRight size={16} /></button></div></section>}
      {step === 3 && <section className="checkout-panel"><div className="panel-heading"><span>03</span><div><h2>Phương thức thanh toán</h2><p>Chọn cách thanh toán phù hợp cho đơn hàng của bạn.</p></div></div><div className="payment-methods">{settings.codEnabled && <label className={paymentMethod === "COD" ? "selected" : ""}><input type="radio" name="payment" checked={paymentMethod === "COD"} onChange={() => setPaymentMethod("COD")} /><span className="payment-icon"><Banknote /></span><span><strong>Thanh toán khi nhận hàng (COD)</strong><small>Thanh toán bằng tiền mặt khi đơn hàng được giao tới bạn.</small></span><i>{paymentMethod === "COD" && <Check size={13} />}</i></label>}{settings.bankEnabled ? <label className={paymentMethod === "BANK_TRANSFER" ? "selected" : ""}><input type="radio" name="payment" checked={paymentMethod === "BANK_TRANSFER"} onChange={() => setPaymentMethod("BANK_TRANSFER")} /><span className="payment-icon"><CreditCard /></span><span><strong>Chuyển khoản ngân hàng / VietQR</strong><small>Quét mã QR, tự điền số tiền và mã đơn sau khi xác nhận.</small></span><i>{paymentMethod === "BANK_TRANSFER" && <Check size={13} />}</i></label> : <div className="payment-unavailable"><CreditCard size={17} /><span>Chuyển khoản QR sẽ hiển thị sau khi Super Admin cấu hình tài khoản ngân hàng thật.</span></div>}</div>{paymentMethod === "BANK_TRANSFER" && <div className="payment-explainer"><PackageCheck size={18} /><p>Sau khi đặt hàng, bạn sẽ nhận mã QR và thông tin chuyển khoản được lưu riêng cho đơn. Nút “Tôi đã chuyển khoản” chỉ gửi yêu cầu; Beanora cần đối chiếu giao dịch thực tế trước khi xác nhận.</p></div>}<div className="final-review"><h3>Xác nhận thông tin</h3><div><span>Người nhận</span><strong>{form.customerName} · {form.customerPhone}</strong></div><div><span>Giao tới</span><strong>{form.addressLine}, {form.ward}, {form.province}</strong></div><button onClick={() => setStep(2)}>Chỉnh sửa</button></div><label className="terms-check"><input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />Tôi đã kiểm tra đơn hàng và đồng ý với <Link href="/policy/terms">điều khoản mua hàng</Link>.</label><div className="checkout-nav"><button className="button button-outline" onClick={() => setStep(2)}>Quay lại</button><button className="button button-copper" onClick={submit} disabled={loading}>{loading ? <><Loader2 className="spin" size={17} />Đang tạo đơn hàng...</> : <>Xác nhận đặt hàng · {formatPrice(total)} <ArrowRight size={16} /></>}</button></div></section>}
      {error && <div className="form-error" role="alert">{error}</div>}
    </div><aside className="checkout-summary"><h2>Đơn hàng của bạn <span>{items.reduce((s, i) => s + i.quantity, 0)} món</span></h2><div className="checkout-items">{items.map((item) => <div key={item.variantId}><div className="checkout-item-image"><Image src={item.image} alt={item.productName} fill sizes="65px" /><b>{item.quantity}</b></div><p><strong>{item.productName}</strong><span>{item.variantName}</span></p><strong>{formatPrice(item.price * item.quantity)}</strong></div>)}</div><div className="coupon-box"><label>Mã giảm giá</label><div><input value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="Nhập mã ưu đãi" /><button onClick={applyCoupon} disabled={!couponInput.trim()}>Áp dụng</button></div>{couponMessage && <small className={coupon ? "success" : "error"}>{couponMessage}</small>}</div><div className="summary-lines"><div><span>Tạm tính</span><strong>{formatPrice(subtotal)}</strong></div><div><span>Giảm giá {coupon && `(${coupon.code})`}</span><strong className="discount">-{formatPrice(coupon?.discount || 0)}</strong></div><div><span>Phí vận chuyển</span><strong>{shipping === 0 ? "Miễn phí" : formatPrice(shipping)}</strong></div></div><div className="checkout-total"><span>Tổng thanh toán<small>Đã bao gồm các khoản phí</small></span><strong>{formatPrice(total)}</strong></div><p className="secure-note"><LockKeyhole size={14} />Giá và tồn kho được xác thực lại trên server khi đặt hàng.</p></aside></div>
  </div>;
}
