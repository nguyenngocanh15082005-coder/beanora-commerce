export type PriceCoupon = {
  code: string;
  type: string;
  value: number;
  minimumOrder: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  startsAt: Date;
  endsAt: Date;
  active: boolean;
  usages?: { id: string }[];
};

export function calculateDiscount(subtotal: number, coupon: PriceCoupon | null, now = new Date()) {
  if (!coupon) return { valid: true as const, discount: 0, message: "" };
  if (!coupon.active || coupon.startsAt > now || coupon.endsAt < now) return { valid: false as const, discount: 0, message: "Mã giảm giá đã hết hạn hoặc chưa có hiệu lực." };
  if (subtotal < coupon.minimumOrder) return { valid: false as const, discount: 0, message: `Đơn hàng chưa đạt giá trị tối thiểu ${coupon.minimumOrder.toLocaleString("vi-VN")}đ.` };
  if (coupon.usageLimit !== null && (coupon.usages?.length ?? 0) >= coupon.usageLimit) return { valid: false as const, discount: 0, message: "Mã giảm giá đã hết lượt sử dụng." };
  let discount = coupon.type === "PERCENT" ? Math.round(subtotal * coupon.value / 100) : coupon.value;
  if (coupon.maxDiscount !== null) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.max(0, Math.min(subtotal, discount));
  return { valid: true as const, discount, message: `Đã áp dụng mã ${coupon.code}.` };
}

export function calculateShipping(subtotalAfterDiscount: number, baseFee: number, freeShippingFrom: number) {
  return subtotalAfterDiscount >= freeShippingFrom ? 0 : baseFee;
}
