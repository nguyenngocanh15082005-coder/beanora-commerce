"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUp, Bot, Coffee, Headphones, MessageCircle, Sparkles, X } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { apiFetch } from "@/lib/client";

type ProductSuggestion = { name: string; slug: string; price: number; description: string };
type Message = { role: "user" | "assistant"; content: string; products?: ProductSuggestion[]; mode?: string };

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: "Xin chào! Mình là trợ lý Beanora. Bạn đang tìm một tách cà phê như thế nào?" }]);
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    setMessages((current) => [...current, { role: "user", content: text }]);
    setInput(""); setLoading(true);
    try {
      const result = await apiFetch<{ content: string; products: ProductSuggestion[]; mode: string }>("/api/chat", { method: "POST", body: JSON.stringify({ message: text }) });
      setMessages((current) => [...current, { role: "assistant", content: result.content, products: result.products, mode: result.mode }]);
    } catch (error) {
      setMessages((current) => [...current, { role: "assistant", content: error instanceof Error ? error.message : "Xin lỗi, mình chưa thể phản hồi. Bạn vui lòng thử lại." }]);
    } finally { setLoading(false); }
  };
  return <>
    <button className={`chat-launcher ${open ? "is-open" : ""}`} onClick={() => setOpen(!open)} aria-label={open ? "Đóng tư vấn" : "Mở tư vấn cà phê"}>{open ? <X size={22} /> : <MessageCircle size={23} />}{!open && <span>Tư vấn cà phê</span>}<i /></button>
    <section className={`chat-panel ${open ? "is-open" : ""}`} aria-hidden={!open}>
      <div className="chat-head"><div className="chat-avatar"><Bot size={22} /></div><div><strong>Beanora AI</strong><span><i /> Trợ lý tư vấn cà phê</span></div><button onClick={() => setOpen(false)} aria-label="Đóng"><X size={18} /></button></div>
      <div className="chat-context"><Sparkles size={13} />Dữ liệu sản phẩm trực tiếp từ cửa hàng</div>
      <div className="chat-messages">
        {messages.map((message, index) => <div className={`chat-message ${message.role}`} key={index}>{message.role === "assistant" && <div className="message-avatar"><Coffee size={14} /></div>}<div className="message-content"><p>{message.content}</p>{message.products && message.products.length > 0 && <div className="chat-products">{message.products.map((product) => <Link href={`/product/${product.slug}`} onClick={() => setOpen(false)} key={product.slug}><div><strong>{product.name}</strong><span>{formatPrice(product.price)}</span></div><b>→</b></Link>)}</div>}{message.mode && <small className="response-mode">{message.mode === "AI" ? "Phản hồi AI từ dữ liệu danh mục" : "Chế độ tra cứu danh mục · chưa cấu hình AI"}</small>}</div></div>)}
        {messages.length === 1 && <div className="chat-suggestions">{["Tư vấn cà phê pha phin", "Arabica khác Robusta thế nào?", "Gợi ý dưới 200 nghìn"].map((text) => <button key={text} onClick={() => send(text)}>{text}</button>)}</div>}
        {loading && <div className="chat-message assistant"><div className="message-avatar"><Coffee size={14} /></div><div className="typing"><i /><i /><i /></div></div>}
        <div ref={bottomRef} />
      </div>
      <div className="chat-human"><Headphones size={14} /><Link href="/contact">Cần hỗ trợ thêm? Chuyển tới nhân viên</Link></div>
      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(input); }}><input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Nhập câu hỏi của bạn..." maxLength={1000} /><button disabled={!input.trim() || loading} aria-label="Gửi"><ArrowUp size={18} /></button></form>
    </section>
  </>;
}
