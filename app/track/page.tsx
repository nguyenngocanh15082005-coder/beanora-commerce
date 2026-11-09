import type { Metadata } from "next";
import { OrderTracker } from "@/components/order-tracker";
export const metadata: Metadata = { title: "Theo dõi đơn hàng" };
export default function TrackPage() { return <div className="track-page"><div className="container"><OrderTracker /></div></div>; }
