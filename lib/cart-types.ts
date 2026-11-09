export type CartLine = {
  variantId: string;
  productId: string;
  productName: string;
  slug: string;
  image: string;
  variantName: string;
  sku: string;
  price: number;
  originalPrice: number | null;
  quantity: number;
  stock: number;
};

export type CheckoutResponse = { orderCode: string; total: number; paymentMethod: "COD" | "BANK_TRANSFER" };
