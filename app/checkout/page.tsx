import type { Metadata } from "next";
import { getPaymentSettings } from "@/lib/settings";
import { getCurrentUser } from "@/lib/auth";
import { CheckoutClient } from "@/components/checkout-client";

export const metadata: Metadata = { title: "Thanh toán", robots: { index: false, follow: false } };

export default async function CheckoutPage() {
  const [settings, user] = await Promise.all([getPaymentSettings(), getCurrentUser()]);
  return <CheckoutClient settings={{ codEnabled: settings.codEnabled, bankEnabled: settings.bankEnabled, shippingFee: settings.shippingFee, freeShippingFrom: settings.freeShippingFrom }} user={user ? { name: user.name, email: user.email, phone: user.phone || "" } : null} />;
}
