"use client";

import { useState } from "react";
import { Check, Copy, Loader2, Send } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { apiFetch } from "@/lib/client";

export function PaymentActions({ orderCode, phone, accountNumber, amount, content, initialStatus }: { orderCode: string; phone: string; accountNumber: string; amount: number; content: string; initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus);
  const [copied, setCopied] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const copy = async (key: string, value: string) => {
    await navigator.clipboard.writeText(value); setCopied(key); setTimeout(() => setCopied(""), 1800);
  };
  const report = async () => {
    setLoading(true); setMessage("");
    try {
      const result = await apiFetch<{ status: string; message: string }>(`/api/orders/${orderCode}/report-transfer`, { method: "POST", body: JSON.stringify({ phone }) });
      setStatus(result.status); setMessage(result.message);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Không thể gửi yêu cầu."); }
    finally { setLoading(false); }
  };
  return <div className="payment-actions"><div className="copy-actions"><button onClick={() => copy("account", accountNumber)}>{copied === "account" ? <Check size={14} /> : <Copy size={14} />}Sao chép số tài khoản</button><button onClick={() => copy("amount", String(amount))}>{copied === "amount" ? <Check size={14} /> : <Copy size={14} />}Sao chép {formatPrice(amount)}</button><button onClick={() => copy("content", content)}>{copied === "content" ? <Check size={14} /> : <Copy size={14} />}Sao chép nội dung</button></div>{status !== "VERIFYING" && <button className="button button-dark button-full" onClick={report} disabled={loading}>{loading ? <Loader2 className="spin" size={16} /> : <Send size={16} />}Tôi đã chuyển khoản</button>}{status === "VERIFYING" && <div className="verifying-note"><Loader2 className="spin" size={15} />Yêu cầu đã gửi — đang chờ Beanora đối chiếu giao dịch thực tế.</div>}{message && <p className="action-message">{message}</p>}</div>;
}
