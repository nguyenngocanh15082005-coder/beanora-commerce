"use client";
import { useState } from "react";
import { formatPrice } from "@/lib/format";
export function RevenueChart({ data }: { data: { date: string; label: string; revenue: number }[] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const points = data.map((d, i) => `${(i / Math.max(1, data.length - 1)) * 100},${100 - (d.revenue / max) * 85}`).join(" ");
  return <div className="revenue-chart"><div className="chart-y"><span>{formatPrice(max)}</span><span>{formatPrice(Math.round(max / 2))}</span><span>0đ</span></div><div className="chart-area"><div className="chart-grid-lines"><i /><i /><i /></div><svg viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a66b3d" stopOpacity=".28"/><stop offset="1" stopColor="#a66b3d" stopOpacity="0"/></linearGradient></defs>{data.some((d) => d.revenue) && <><polygon points={`0,100 ${points} 100,100`} fill="url(#chartFill)"/><polyline points={points} fill="none" stroke="#9a6036" strokeWidth="1.2" vectorEffect="non-scaling-stroke"/></>}</svg><div className="chart-points">{data.map((d, i) => <button key={d.date} style={{ left: `${(i / Math.max(1, data.length - 1)) * 100}%`, bottom: `${(d.revenue / max) * 85}%` }} onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)} aria-label={`${d.label}: ${formatPrice(d.revenue)}`}>{active === i && <span>{formatPrice(d.revenue)}<small>{d.label}</small></span>}</button>)}</div><div className="chart-labels">{data.map((d) => <span key={d.date}>{d.label}</span>)}</div></div></div>;
}
