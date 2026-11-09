"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Check, Eye, Heart, Minus, Plus, ShoppingBag, Star, X } from "lucide-react";
import type { StoreProduct } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/components/cart-provider";

export function ProductGrid({ products, modal = true }: { products: StoreProduct[]; modal?: boolean }) {
  const [selected, setSelected] = useState<StoreProduct | null>(null);
  return <>
    <div className="product-grid">{products.map((product, index) => <ProductCard key={product.id} product={product} onQuickView={modal ? () => setSelected(product) : undefined} priority={index < 5} />)}</div>
    <AnimatePresence>{selected && <ProductModal product={selected} onClose={() => setSelected(null)} />}</AnimatePresence>
  </>;
}

export function ProductCard({ product, onQuickView, priority = false }: { product: StoreProduct; onQuickView?: () => void; priority?: boolean }) {
  const { addItem } = useCart();
  const [saved, setSaved] = useState(false);
  const defaultVariant = product.variants.find((v) => v.weight === "500g" && v.grind === "Xay phin") || product.variants[0];
  const discount = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;
  const toggleSaved = async () => {
    setSaved(!saved);
    try { localStorage.setItem(`beanora_wishlist_${product.id}`, String(!saved)); } catch { /* local storage unavailable */ }
    try { await fetch("/api/wishlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: product.id }) }); } catch { /* guest wishlist remains local */ }
  };
  return <motion.article className="product-card" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: .45, delay: Math.min(priority ? 0 : 0.05, .1) }}>
    <div className="product-image-wrap">
      <Link href={`/product/${product.slug}`} className="product-image-link"><Image src={product.image} alt={product.name} fill sizes="(max-width: 600px) 50vw, (max-width: 1100px) 33vw, 20vw" priority={priority} /></Link>
      <div className="product-badges">{product.badge && <span className={discount ? "sale-badge" : "new-badge"}>{discount ? `-${discount}%` : product.badge}</span>}</div>
      <button className={`wishlist-button ${saved ? "saved" : ""}`} onClick={toggleSaved} aria-label={saved ? "Bỏ yêu thích" : "Thêm vào yêu thích"}><Heart size={17} fill={saved ? "currentColor" : "none"} /></button>
      {onQuickView && <button className="quick-view" onClick={onQuickView}><Eye size={16} /> Xem nhanh</button>}
    </div>
    <div className="product-card-body">
      <div className="product-meta"><span>{product.categories[0]?.name || "Beanora Coffee"}</span>{product.reviewCount > 0 && <span className="rating"><Star size={12} fill="currentColor" /> {product.rating.toFixed(1)}</span>}</div>
      <Link href={`/product/${product.slug}`} className="product-name">{product.name}</Link>
      <p className="product-flavor">{product.flavor}</p>
      <div className="product-price"><strong>{formatPrice(product.price)}</strong>{product.originalPrice && <del>{formatPrice(product.originalPrice)}</del>}</div>
      <div className="product-stock"><span className={product.inStock ? "stock-dot" : "stock-dot out"} />{product.inStock ? "Còn hàng" : "Tạm hết hàng"}<small>{defaultVariant?.weight || ""}</small></div>
      <button className="product-add" disabled={!defaultVariant || defaultVariant.stock === 0} onClick={() => defaultVariant && addItem(product, defaultVariant)}><ShoppingBag size={16} /><span>Thêm vào giỏ</span></button>
    </div>
  </motion.article>;
}

export function ProductModal({ product, onClose }: { product: StoreProduct; onClose: () => void }) {
  const { addItem } = useCart();
  const initial = product.variants.find((v) => v.weight === "500g" && v.grind === "Xay phin") || product.variants[0];
  const [weight, setWeight] = useState(initial?.weight || "");
  const [grind, setGrind] = useState(initial?.grind || "");
  const [roast, setRoast] = useState(initial?.roast || "");
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState<"info" | "story" | "reviews">("info");
  const variant = product.variants.find((v) => v.weight === weight && v.grind === grind && v.roast === roast) || product.variants.find((v) => v.weight === weight && v.grind === grind) || initial;
  const weights = [...new Set(product.variants.map((v) => v.weight))];
  const grinds = [...new Set(product.variants.filter((v) => v.weight === weight).map((v) => v.grind))];
  const roasts = [...new Set(product.variants.filter((v) => v.weight === weight && v.grind === grind).map((v) => v.roast))];
  return <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <motion.div className="product-modal" role="dialog" aria-modal="true" aria-label={product.name} initial={{ opacity: 0, y: 30, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: .98 }} transition={{ type: "spring", damping: 28, stiffness: 300 }}>
      <button className="modal-close" onClick={onClose} aria-label="Đóng"><X size={20} /></button>
      <div className="modal-product-layout">
        <div className="modal-product-image"><Image src={product.image} alt={product.name} fill sizes="(max-width: 800px) 100vw, 45vw" /><span>BEANORA · SMALL BATCH</span></div>
        <div className="modal-product-info">
          <span className="eyebrow">{product.categories[0]?.name || "Cà phê Beanora"}</span>
          <h2>{product.name}</h2>
          {product.reviewCount > 0 && <div className="modal-rating"><span>★★★★★</span> {product.rating.toFixed(1)} · {product.reviewCount} đánh giá</div>}
          <div className="modal-price"><strong>{formatPrice(variant?.salePrice ?? variant?.price ?? 0)}</strong>{variant?.salePrice && <del>{formatPrice(variant.price)}</del>}</div>
          <p className="modal-description">{product.shortDescription}</p>
          <div className="variant-field"><label>Khối lượng</label><div className="variant-options">{weights.map((value) => <button className={weight === value ? "selected" : ""} key={value} onClick={() => { setWeight(value); const next = product.variants.find((v) => v.weight === value); if (next) { setGrind(next.grind); setRoast(next.roast); } }}>{value}</button>)}</div></div>
          <div className="variant-field"><label>Mức rang</label><div className="variant-options">{roasts.map((value) => <button className={roast === value ? "selected" : ""} key={value} onClick={() => setRoast(value)}>{value}</button>)}</div></div>
          <div className="variant-field"><label>Chọn hạt / xay</label><div className="variant-options">{grinds.map((value) => <button className={grind === value ? "selected" : ""} key={value} onClick={() => setGrind(value)}>{value}</button>)}</div></div>
          <div className="modal-purchase-row"><div className="quantity-control"><button onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={15} /></button><span>{quantity}</span><button onClick={() => setQuantity(Math.min(variant?.stock || 1, quantity + 1))}><Plus size={15} /></button></div><span className="modal-stock"><Check size={14} />{variant?.stock ? `Còn ${variant.stock} sản phẩm` : "Tạm hết hàng"}</span></div>
          <div className="modal-actions"><button className="button button-outline" disabled={!variant?.stock} onClick={() => variant && addItem(product, variant, quantity)}><ShoppingBag size={17} />Thêm vào giỏ</button><Link className="button button-copper" href="/checkout" onClick={() => { if (variant) addItem(product, variant, quantity, false); }}>Mua ngay <ArrowUpRight size={17} /></Link></div>
          <Link href={`/product/${product.slug}`} className="text-link">Xem trang sản phẩm đầy đủ <span>→</span></Link>
        </div>
      </div>
      <div className="product-tabs"><div className="tab-buttons"><button className={tab === "info" ? "active" : ""} onClick={() => setTab("info")}>Thông tin sản phẩm</button><button className={tab === "story" ? "active" : ""} onClick={() => setTab("story")}>Câu chuyện hạt cà phê</button><button className={tab === "reviews" ? "active" : ""} onClick={() => setTab("reviews")}>Đánh giá ({product.reviewCount})</button></div>
        <div className="tab-content">{tab === "info" && <div className="product-spec-grid"><Spec label="Xuất xứ" value={product.origin} /><Spec label="Vùng trồng" value={product.region || "Đang cập nhật"} /><Spec label="Độ cao" value={product.altitude || "Không có dữ liệu"} /><Spec label="Hương vị" value={product.flavor} /><Spec label="Sơ chế" value={product.process || "Đang cập nhật"} /><Spec label="Phù hợp pha" value={product.brewMethods} /><Spec label="Bảo quản" value={product.storage} /><Spec label="Mã SKU" value={variant?.sku || product.sku} /></div>}{tab === "story" && <p>{product.story}</p>}{tab === "reviews" && (product.reviews.length ? product.reviews.map((review) => <div className="review" key={review.id}><strong>{review.author}</strong><span>{"★".repeat(review.rating)}</span><p>{review.comment}</p>{review.verifiedPurchase && <small>✓ Đã mua hàng</small>}</div>) : <div className="empty-inline">Chưa có đánh giá được duyệt cho sản phẩm này.</div>)}</div>
      </div>
    </motion.div>
  </motion.div>;
}

function Spec({ label, value }: { label: string; value: string }) { return <div><small>{label}</small><p>{value}</p></div>; }
