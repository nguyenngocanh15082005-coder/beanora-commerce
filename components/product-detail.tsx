"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, Heart, Minus, Plus, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import type { StoreProduct } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/components/cart-provider";

export function ProductDetail({ product }: { product: StoreProduct }) {
  const initial = product.variants.find((v) => v.weight === "500g" && v.grind === "Xay phin") || product.variants[0];
  const [weight, setWeight] = useState(initial?.weight || "");
  const [grind, setGrind] = useState(initial?.grind || "");
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState<"info" | "story" | "reviews">("info");
  const { addItem } = useCart();
  const router = useRouter();
  const variant = product.variants.find((v) => v.weight === weight && v.grind === grind) || initial;
  const weights = [...new Set(product.variants.map((v) => v.weight))];
  const grinds = [...new Set(product.variants.filter((v) => v.weight === weight).map((v) => v.grind))];
  const buyNow = () => { if (!variant) return; addItem(product, variant, quantity, false); router.push("/checkout"); };
  return <>
    <div className="detail-layout">
      <div className="detail-gallery"><div className="detail-main-image"><Image src={product.image} alt={product.name} fill priority sizes="(max-width: 800px) 100vw, 50vw" /><span>Ảnh sản phẩm Beanora</span></div><div className="detail-assurance"><ShieldCheck size={18} /><span><strong>Cam kết nguồn gốc</strong>Thông tin vùng trồng và quy trình được quản lý theo sản phẩm.</span></div></div>
      <div className="detail-info"><span className="eyebrow">{product.categories.map((c) => c.name).slice(0, 2).join(" · ")}</span><h1>{product.name}</h1><p className="detail-subtitle">{product.shortDescription}</p><div className="detail-price"><strong>{formatPrice(variant?.salePrice ?? variant?.price ?? 0)}</strong>{variant?.salePrice && <del>{formatPrice(variant.price)}</del>}<small>/ {variant?.weight}</small></div><div className="detail-flavor"><span>Ghi chú hương vị</span><p>{product.flavor}</p></div>
        <div className="detail-variant"><label>01 · Chọn khối lượng</label><div className="variant-options">{weights.map((value) => <button key={value} className={weight === value ? "selected" : ""} onClick={() => { setWeight(value); const next = product.variants.find((v) => v.weight === value); if (next) setGrind(next.grind); }}>{value}</button>)}</div></div>
        <div className="detail-variant"><label>02 · Chọn hạt hoặc xay</label><div className="variant-options">{grinds.map((value) => <button key={value} className={grind === value ? "selected" : ""} onClick={() => setGrind(value)}>{value}</button>)}</div><small>Độ rang: {variant?.roast} · SKU: {variant?.sku}</small></div>
        <div className="detail-stock"><span className={variant?.stock ? "stock-dot" : "stock-dot out"} />{variant?.stock ? `Còn hàng — giao từ kho Beanora` : "Tạm hết hàng"}</div>
        <div className="detail-buy"><div className="quantity-control"><button onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={15} /></button><span>{quantity}</span><button onClick={() => setQuantity(Math.min(variant?.stock || 1, quantity + 1))}><Plus size={15} /></button></div><button className="button button-outline" disabled={!variant?.stock} onClick={() => variant && addItem(product, variant, quantity)}><ShoppingBag size={17} />Thêm vào giỏ</button><button className="button button-copper" disabled={!variant?.stock} onClick={buyNow}>Mua ngay →</button></div>
        <div className="detail-services"><span><Truck size={16} />Giao hàng toàn quốc</span><span><Check size={16} />Đổi trả theo chính sách</span><button><Heart size={16} />Lưu yêu thích</button></div>
      </div>
    </div>
    <div className="detail-tabs"><div className="tab-buttons"><button className={tab === "info" ? "active" : ""} onClick={() => setTab("info")}>Thông tin sản phẩm</button><button className={tab === "story" ? "active" : ""} onClick={() => setTab("story")}>Câu chuyện hạt cà phê</button><button className={tab === "reviews" ? "active" : ""} onClick={() => setTab("reviews")}>Đánh giá ({product.reviewCount})</button></div><div className="detail-tab-body">{tab === "info" && <div className="detail-description"><div><h3>Về sản phẩm</h3><p>{product.description}</p><h3>Hướng dẫn bảo quản</h3><p>{product.storage}</p></div><dl><div><dt>Xuất xứ</dt><dd>{product.origin}</dd></div><div><dt>Vùng trồng</dt><dd>{product.region || "Đang cập nhật"}</dd></div><div><dt>Độ cao</dt><dd>{product.altitude || "Không có dữ liệu"}</dd></div><div><dt>Mức rang</dt><dd>{variant?.roast}</dd></div><div><dt>Sơ chế</dt><dd>{product.process || "Đang cập nhật"}</dd></div><div><dt>Cách pha phù hợp</dt><dd>{product.brewMethods}</dd></div></dl></div>}{tab === "story" && <div className="story-tab"><span className="eyebrow">From soil to soul</span><h3>Từ vùng nguyên liệu đến tách cà phê của bạn</h3><p>{product.story}</p></div>}{tab === "reviews" && <div>{product.reviews.length ? product.reviews.map((review) => <div className="review" key={review.id}><strong>{review.author}</strong><span>{"★".repeat(review.rating)}</span><p>{review.comment}</p>{review.verifiedPurchase && <small>✓ Đã mua hàng</small>}</div>) : <div className="empty-state"><h3>Chưa có đánh giá được duyệt</h3><p>Chỉ khách hàng đã mua và nhận sản phẩm mới có thể gửi đánh giá xác minh.</p></div>}</div>}</div></div>
  </>;
}
