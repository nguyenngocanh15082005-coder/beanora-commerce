import "server-only";
import { getPublicProductsForAI } from "@/lib/catalog";

export async function getCoffeeAdvice(message: string) {
  const products = await getPublicProductsForAI();
  const normalized = message.toLowerCase();
  const matched = products.filter((p) => normalized.includes(p.name.toLowerCase()) || normalized.includes(p.slug));
  if (process.env.OPENAI_API_KEY) {
    const context = JSON.stringify(products);
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          { role: "system", content: `Bạn là nhân viên tư vấn Beanora. Trả lời tiếng Việt ngắn gọn, thân thiện. Chỉ dùng dữ liệu sản phẩm JSON sau, tuyệt đối không bịa giá/tồn kho/nguồn gốc/trạng thái đơn. Nếu thiếu dữ liệu hãy nói rõ và đề nghị nhân viên hỗ trợ. Không xác nhận thanh toán. Dữ liệu: ${context}` },
          { role: "user", content: message },
        ],
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error("Dịch vụ AI chưa sẵn sàng. Vui lòng thử lại sau.");
    return { mode: "AI", content: result.choices[0].message.content as string, products: matched.slice(0, 2) };
  }

  let candidates = products;
  let content = "Tôi có thể giúp bạn chọn cà phê theo khẩu vị, cách pha hoặc ngân sách. Bạn thích vị thanh nhẹ hay đậm đà?";
  if (/arabica|robusta|khác nhau|khac nhau/.test(normalized)) {
    content = "Arabica thường có chua thanh và hương nhiều lớp; Robusta có thân vị dày, đắng rõ và caffeine cao hơn. Nếu bạn mới bắt đầu, Blend Signature là lựa chọn cân bằng.";
    candidates = products.filter((p) => /Blend|Arabica|Robusta/.test(p.name)).slice(0, 2);
  } else if (/phin|sữa|sua|đậm|dam|mạnh|manh/.test(normalized)) {
    content = "Với phin hoặc cà phê sữa, bạn nên ưu tiên Robusta Buôn Ma Thuột hoặc Pha Phin Truyền Thống. Cả hai có thân vị đậm; hãy bắt đầu với tỷ lệ 20 g cà phê cho 120 ml nước.";
    candidates = products.filter((p) => /Robusta|Phin/.test(p.name)).slice(0, 2);
  } else if (/pour|arabica|thanh|nhẹ|nhe|chua|hoa quả|hoa qua/.test(normalized)) {
    content = "Nếu bạn thích vị thanh, chua dịu và hương trái cây, Arabica Đắk Lắk dễ thưởng thức; Specialty Cầu Đất có nhiều lớp hương hơn cho pour-over.";
    candidates = products.filter((p) => /Arabica|Specialty/.test(p.name)).slice(0, 2);
  } else if (/combo|quà|qua|tặng|tang/.test(normalized)) {
    content = "Combo Khám Phá phù hợp để thử ba phong vị. Nếu bạn cần tư vấn quà tặng theo ngân sách, nhân viên Beanora có thể hỗ trợ thêm.";
    candidates = products.filter((p) => /Combo|Quà/.test(p.name)).slice(0, 2);
  } else if (/giá|gia|ngân sách|ngan sach|dưới|duoi/.test(normalized)) {
    const numbers = normalized.match(/\d+/g)?.map(Number) || [];
    const budget = numbers.length ? Math.max(...numbers) * (Math.max(...numbers) < 1000 ? 1000 : 1) : 200000;
    candidates = products.filter((p) => p.price <= budget).sort((a, b) => a.price - b.price).slice(0, 2);
    content = candidates.length ? `Trong ngân sách khoảng ${budget.toLocaleString("vi-VN")}đ, bạn có thể tham khảo các lựa chọn dưới đây. Giá hiển thị là giá biến thể mặc định hiện tại.` : "Tôi chưa tìm thấy sản phẩm phù hợp ngân sách này. Bạn có thể cho tôi biết khoảng giá và cách pha mong muốn.";
  } else if (/đơn|don|thanh toán|thanh toan|chuyển khoản|chuyen khoan/.test(normalized)) {
    content = "Bạn có thể theo dõi đơn tại mục Tra cứu đơn hàng bằng mã đơn và số điện thoại. Với chuyển khoản, trạng thái chỉ chuyển thành Đã thanh toán sau khi cửa hàng đối chiếu giao dịch thực tế.";
    candidates = [];
  } else {
    candidates = products.filter((p) => p.inStock).slice(0, 2);
  }
  return { mode: "CATALOG", content, products: candidates };
}
