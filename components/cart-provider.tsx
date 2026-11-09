"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import type { CartLine } from "@/lib/cart-types";
import { formatPrice } from "@/lib/format";

type AddProduct = { id: string; name: string; slug: string; image: string };
type AddVariant = { id: string; name: string; sku: string; price: number; salePrice: number | null; stock: number };
type CartContextValue = {
  items: CartLine[];
  count: number;
  subtotal: number;
  hydrated: boolean;
  addItem: (product: AddProduct, variant: AddVariant, quantity?: number, open?: boolean) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
};
const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}

export function CartProvider({ children, userId }: { children: React.ReactNode; userId?: string }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState("");
  const syncReady = useRef(false);
  const firstLocalWrite = useRef(true);

  useEffect(() => {
    let active = true;
    const local = (() => {
      try { return JSON.parse(localStorage.getItem("beanora_cart_v1") || "[]") as CartLine[]; } catch { return []; }
    })();
    setItems(local);
    if (!userId) { setHydrated(true); return; }
    fetch("/api/cart").then((r) => r.ok ? r.json() : { items: [] }).then(async (data) => {
      if (!active) return;
      const merged = new Map<string, CartLine>();
      for (const item of [...(data.items as CartLine[]), ...local]) {
        const previous = merged.get(item.variantId);
        merged.set(item.variantId, previous ? { ...item, quantity: Math.min(item.stock, previous.quantity + item.quantity) } : item);
      }
      const mergedItems = [...merged.values()].filter((item) => item.quantity > 0);
      setItems(mergedItems);
      await fetch("/api/cart", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: mergedItems.map(({ variantId, quantity }) => ({ variantId, quantity })) }) });
      if (active) { syncReady.current = true; setHydrated(true); }
    }).catch(() => { if (active) setHydrated(true); });
    return () => { active = false; };
  }, [userId]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("beanora_cart_v1", JSON.stringify(items));
    if (firstLocalWrite.current) { firstLocalWrite.current = false; return; }
    if (userId && syncReady.current) {
      const timer = setTimeout(() => fetch("/api/cart", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: items.map(({ variantId, quantity }) => ({ variantId, quantity })) }),
      }).catch(() => undefined), 450);
      return () => clearTimeout(timer);
    }
  }, [items, hydrated, userId]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const addItem = useCallback((product: AddProduct, variant: AddVariant, quantity = 1, open = true) => {
    setItems((current) => {
      const existing = current.find((item) => item.variantId === variant.id);
      if (existing) return current.map((item) => item.variantId === variant.id ? { ...item, quantity: Math.min(variant.stock, item.quantity + quantity), stock: variant.stock } : item);
      return [...current, { variantId: variant.id, productId: product.id, productName: product.name, slug: product.slug, image: product.image, variantName: variant.name, sku: variant.sku, price: variant.salePrice ?? variant.price, originalPrice: variant.salePrice ? variant.price : null, quantity: Math.min(quantity, variant.stock), stock: variant.stock }];
    });
    setToast(`Đã thêm ${product.name} vào giỏ hàng`);
    if (open) setDrawerOpen(true);
  }, []);

  const value = useMemo<CartContextValue>(() => ({
    items, hydrated,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    addItem,
    updateQuantity: (variantId, quantity) => setItems((current) => current.map((item) => item.variantId === variantId ? { ...item, quantity: Math.max(1, Math.min(item.stock || 20, quantity)) } : item)),
    removeItem: (variantId) => setItems((current) => current.filter((item) => item.variantId !== variantId)),
    clearCart: () => setItems([]),
    openCart: () => setDrawerOpen(true), closeCart: () => setDrawerOpen(false),
  }), [items, hydrated, addItem]);

  return <CartContext.Provider value={value}>
    {children}
    <div className={`drawer-backdrop ${drawerOpen ? "is-open" : ""}`} onClick={() => setDrawerOpen(false)} />
    <aside className={`cart-drawer ${drawerOpen ? "is-open" : ""}`} aria-hidden={!drawerOpen} aria-label="Giỏ hàng">
      <div className="drawer-head"><div><span className="eyebrow">Beanora shopping bag</span><h2>Giỏ hàng <small>{value.count} sản phẩm</small></h2></div><button className="icon-button" onClick={() => setDrawerOpen(false)} aria-label="Đóng giỏ hàng"><X size={20} /></button></div>
      <div className="drawer-content">
        {!items.length ? <div className="empty-state"><span className="empty-icon"><ShoppingBag size={28} /></span><h3>Giỏ hàng đang trống</h3><p>Hãy chọn một hương vị cà phê cho buổi sáng của bạn.</p><Link href="/shop" className="button button-dark" onClick={() => setDrawerOpen(false)}>Khám phá sản phẩm</Link></div> : items.map((item) => <div className="cart-line" key={item.variantId}>
          <Link href={`/product/${item.slug}`} onClick={() => setDrawerOpen(false)} className="cart-line-image"><Image src={item.image} alt={item.productName} fill sizes="90px" /></Link>
          <div className="cart-line-info"><div className="cart-line-top"><div><Link href={`/product/${item.slug}`} onClick={() => setDrawerOpen(false)}>{item.productName}</Link><small>{item.variantName}</small></div><button className="plain-icon" onClick={() => value.removeItem(item.variantId)} aria-label="Xóa sản phẩm"><Trash2 size={16} /></button></div>
            <div className="cart-line-bottom"><div className="quantity-control small"><button onClick={() => value.updateQuantity(item.variantId, item.quantity - 1)} disabled={item.quantity <= 1}><Minus size={13} /></button><span>{item.quantity}</span><button onClick={() => value.updateQuantity(item.variantId, item.quantity + 1)} disabled={item.quantity >= item.stock}><Plus size={13} /></button></div><strong>{formatPrice(item.price * item.quantity)}</strong></div>
          </div>
        </div>)}
      </div>
      {items.length > 0 && <div className="drawer-footer"><div className="subtotal-row"><span>Tạm tính</span><strong>{formatPrice(value.subtotal)}</strong></div><p>Phí vận chuyển và giảm giá được tính tại bước thanh toán.</p><Link href="/checkout" className="button button-copper button-full" onClick={() => setDrawerOpen(false)}>Tiến hành thanh toán <span>→</span></Link><Link href="/cart" className="text-link centered" onClick={() => setDrawerOpen(false)}>Xem giỏ hàng chi tiết</Link></div>}
    </aside>
    {toast && <div className="toast" role="status"><span>✓</span>{toast}<button onClick={() => setDrawerOpen(true)}>Xem giỏ</button></div>}
  </CartContext.Provider>;
}
