import type { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";

export const formatPrice = (value: number) => `${new Intl.NumberFormat("vi-VN").format(value)}đ`;

export const formatDate = (value: Date | string) => new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
}).format(new Date(value));

export const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING_CONFIRMATION: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  AWAITING_PAYMENT: "Chờ thanh toán",
  PREPARING: "Đang chuẩn bị hàng",
  PACKING: "Đang đóng gói",
  HANDED_TO_CARRIER: "Đã bàn giao vận chuyển",
  SHIPPING: "Đang giao hàng",
  DELIVERED: "Giao hàng thành công",
  DELIVERY_FAILED: "Giao hàng thất bại",
  CANCELLED: "Đã hủy",
  RETURN_REQUESTED: "Yêu cầu hoàn trả",
  REFUNDED: "Đã hoàn tiền",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  UNPAID: "Chưa thanh toán",
  AWAITING_TRANSFER: "Chờ chuyển khoản",
  VERIFYING: "Chờ xác nhận thanh toán",
  PAID: "Đã thanh toán",
  FAILED: "Thanh toán thất bại",
  REFUNDED: "Đã hoàn tiền",
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  COD: "Thanh toán khi nhận hàng (COD)",
  BANK_TRANSFER: "Chuyển khoản ngân hàng",
};

export const statusTone = (status: OrderStatus | PaymentStatus) => {
  if (["DELIVERED", "PAID", "CONFIRMED"].includes(status)) return "success";
  if (["CANCELLED", "DELIVERY_FAILED", "FAILED"].includes(status)) return "danger";
  if (["PENDING_CONFIRMATION", "AWAITING_PAYMENT", "AWAITING_TRANSFER", "VERIFYING"].includes(status)) return "warning";
  return "info";
};
