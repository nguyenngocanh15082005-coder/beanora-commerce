import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, CheckCircle2, Clock3, Download, Home, MapPin, PackageCheck, QrCode, ReceiptText, Truck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { formatDate, formatPrice, orderStatusLabels, paymentMethodLabels, paymentStatusLabels, statusTone } from "@/lib/format";
import { generateVietQrDataUrl } from "@/lib/vietqr";
import { PaymentActions } from "@/components/payment-actions";

export const metadata: Metadata = { title: "Xác nhận đơn hàng", robots: { index: false, follow: false } };

type Snapshot = { bankName: string; bankCode: string; bankBin: string; accountNumber: string; accountName: string; branch?: string; qrImageUrl?: string; instructions?: string; amount: number; description: string };

export default async function OrderPage({ params, searchParams }: { params: Promise<{ orderCode: string }>; searchParams: Promise<{ phone?: string; new?: string }> }) {
  const { orderCode } = await params;
  const { phone, new: isNew } = await searchParams;
  const [order, user] = await Promise.all([prisma.order.findUnique({ where: { orderCode }, include: { items: true, history: { orderBy: { createdAt: "asc" } }, invoice: true } }), getCurrentUser()]);
  if (!order) notFound();
  if (!isAdmin(user) && order.userId !== user?.id && order.customerPhone !== phone) notFound();
  const snapshot = order.paymentSnapshot as Snapshot | null;
  let qrCode: string | null = null;
  if (order.paymentMethod === "BANK_TRANSFER" && snapshot && order.paymentStatus !== "PAID") {
    try {
      qrCode = await generateVietQrDataUrl({ bankBin: snapshot.bankBin, accountNumber: snapshot.accountNumber, amount: order.total, description: order.orderCode });
    } catch {
      qrCode = snapshot.qrImageUrl || null;
    }
  }
  return <div className="order-page container">
    {isNew && <div className="order-success-banner"><CheckCircle2 size={30} /><div><span>Đặt hàng thành công</span><h1>Cảm ơn bạn, {order.customerName}!</h1><p>Đơn hàng <strong>#{order.orderCode}</strong> đã được lưu vào hệ thống Beanora.</p></div></div>}
    {!isNew && <div className="page-title-row"><div><span className="eyebrow">Order details</span><h1>Đơn hàng #{order.orderCode}</h1></div><span className={`status-badge ${statusTone(order.status)}`}>{orderStatusLabels[order.status]}</span></div>}
    <div className="order-meta-cards"><div><PackageCheck /><span>Mã đơn hàng<strong>#{order.orderCode}</strong></span></div><div><Clock3 /><span>Thời gian đặt<strong>{formatDate(order.createdAt)}</strong></span></div><div><Truck /><span>Trạng thái đơn<strong>{orderStatusLabels[order.status]}</strong></span></div><div><ReceiptText /><span>Thanh toán<strong>{paymentStatusLabels[order.paymentStatus]}</strong></span></div></div>
    <div className="order-layout"><div className="order-main">
      {order.paymentMethod === "BANK_TRANSFER" && order.paymentStatus !== "PAID" && snapshot && <section className="bank-payment-card"><div className="bank-card-title"><div><span className="eyebrow">Bank transfer · VietQR</span><h2>Hoàn tất chuyển khoản</h2><p>Quét QR bằng ứng dụng ngân hàng hoặc sao chép thông tin bên dưới.</p></div><QrCode size={32} /></div><div className="bank-card-body"><div className="payment-qr">{qrCode && <img src={qrCode} alt={`Mã QR thanh toán đơn ${order.orderCode}`} />}<span>Quét mã để tự điền thông tin</span></div><div className="bank-details"><div><span>Ngân hàng</span><strong>{snapshot.bankName}</strong></div><div><span>Chủ tài khoản</span><strong>{snapshot.accountName}</strong></div><div><span>Số tài khoản</span><strong>{snapshot.accountNumber}</strong></div><div><span>Số tiền</span><strong className="bank-amount">{formatPrice(order.total)}</strong></div><div><span>Nội dung chuyển khoản</span><strong>{order.orderCode}</strong></div>{order.paymentExpiresAt && <div><span>Hạn thanh toán</span><strong>{formatDate(order.paymentExpiresAt)}</strong></div>}</div></div><div className="payment-notice">Vui lòng chuyển đúng số tiền và ghi đúng mã đơn. Thông tin tài khoản này là bản chụp tại thời điểm đặt hàng, không thay đổi khi Admin cập nhật tài khoản mới.</div><PaymentActions orderCode={order.orderCode} phone={order.customerPhone} accountNumber={snapshot.accountNumber} amount={order.total} content={order.orderCode} initialStatus={order.paymentStatus} /></section>}
      <section className="order-items-card"><h2>Sản phẩm trong đơn</h2>{order.items.map((item) => <div className="order-product" key={item.id}><div><strong>{item.productName}</strong><span>{item.variantName} · SKU {item.sku}</span></div><span>{item.quantity} × {formatPrice(item.unitPrice)}</span><strong>{formatPrice(item.lineTotal)}</strong></div>)}<div className="order-totals"><div><span>Tạm tính</span><strong>{formatPrice(order.subtotal)}</strong></div><div><span>Giảm giá {order.couponCode && `(${order.couponCode})`}</span><strong>-{formatPrice(order.discount)}</strong></div><div><span>Phí vận chuyển</span><strong>{formatPrice(order.shippingFee)}</strong></div><div className="grand-total"><span>Tổng thanh toán</span><strong>{formatPrice(order.total)}</strong></div></div></section>
      <section className="tracking-card"><h2>Hành trình đơn hàng</h2><div className="tracking-timeline">{order.history.map((history, index) => <div key={history.id} className={index === order.history.length - 1 ? "current" : "done"}><span>{index < order.history.length - 1 ? <Check size={13} /> : <PackageCheck size={14} />}</span><div><strong>{orderStatusLabels[history.status]}</strong><p>{history.note || "Cập nhật trạng thái đơn hàng"}</p><small>{formatDate(history.createdAt)}</small></div></div>)}</div></section>
    </div><aside className="order-sidebar"><section><h3>Thông tin giao hàng</h3><p><strong>{order.customerName}</strong><br />{order.customerPhone}<br />{order.customerEmail}</p><p className="order-address"><MapPin size={15} />{order.addressLine}, {order.ward}, {order.province}</p>{order.deliveryNote && <small>Ghi chú: {order.deliveryNote}</small>}</section><section><h3>Thanh toán</h3><p>{paymentMethodLabels[order.paymentMethod]}</p><span className={`status-badge ${statusTone(order.paymentStatus)}`}>{paymentStatusLabels[order.paymentStatus]}</span>{order.paymentConfirmedAt && <small>Xác nhận lúc {formatDate(order.paymentConfirmedAt)}</small>}</section><section><h3>Hóa đơn bán hàng</h3>{order.invoice ? <><p>Mã hóa đơn: <strong>{order.invoice.invoiceNumber}</strong></p><Link href={`/invoice/${order.invoice.invoiceNumber}?phone=${encodeURIComponent(order.customerPhone)}`} className="button button-outline button-full"><ReceiptText size={15} />Xem hóa đơn</Link><a href={`/api/invoices/${order.invoice.invoiceNumber}/pdf?phone=${encodeURIComponent(order.customerPhone)}`} className="button button-dark button-full"><Download size={15} />Tải PDF</a></> : <p>Hóa đơn sẽ được tạo tự động sau khi đơn hàng được xác nhận theo quy trình.</p>}</section><Link href="/shop" className="button button-copper button-full">Tiếp tục mua sắm</Link><Link href="/" className="text-link centered"><Home size={13} />Về trang chủ</Link></aside></div>
  </div>;
}
