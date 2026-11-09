import "server-only";
import PDFDocument from "pdfkit";
import path from "path";
import type { Prisma } from "@prisma/client";
import { formatDate, formatPrice, paymentMethodLabels, paymentStatusLabels } from "@/lib/format";

type InvoiceWithRelations = Prisma.InvoiceGetPayload<{ include: { items: true; order: true } }>;

export async function createInvoicePdf(invoice: InvoiceWithRelations): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const regular = path.join(process.cwd(), "assets/fonts/DejaVuSans.ttf");
    const bold = path.join(process.cwd(), "assets/fonts/DejaVuSans-Bold.ttf");
    const doc = new PDFDocument({ size: "A4", margin: 48, font: regular, info: { Title: `Hóa đơn ${invoice.invoiceNumber}`, Author: "Beanora Coffee" } });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.font(bold).fontSize(24).fillColor("#3b2117").text("BEANORA", { characterSpacing: 2 });
    doc.font(regular).fontSize(9).fillColor("#765f52").text("More than coffee — It’s a lifestyle");
    doc.moveDown(1.5).font(bold).fontSize(20).fillColor("#3b2117").text("HÓA ĐƠN BÁN HÀNG", { align: "center" });
    doc.moveDown(0.4).font(regular).fontSize(10).fillColor("#765f52").text(invoice.invoiceNumber, { align: "center" });
    doc.moveDown(1.5);
    const business = invoice.businessSnapshot as { storeName?: string; address?: string; phone?: string; email?: string };
    const customer = invoice.customerSnapshot as { name?: string; phone?: string; email?: string; address?: string };
    doc.font(bold).fontSize(10).fillColor("#3b2117").text("THÔNG TIN CỬA HÀNG");
    doc.font(regular).fontSize(9).text(`${business.storeName || "Beanora Coffee"}\n${business.address || ""}\n${business.email || ""} ${business.phone || ""}`);
    doc.moveDown(0.7).font(bold).fontSize(10).text("THÔNG TIN KHÁCH HÀNG");
    doc.font(regular).fontSize(9).text(`${customer.name || invoice.order.customerName}\n${customer.phone || invoice.order.customerPhone} · ${customer.email || invoice.order.customerEmail}\n${customer.address || ""}`);
    doc.moveDown(0.7).fontSize(9).text(`Mã đơn: ${invoice.order.orderCode}    Ngày phát hành: ${formatDate(invoice.issuedAt)}`);
    doc.moveDown(1);
    const startY = doc.y;
    doc.rect(48, startY, 499, 26).fill("#f1e8dd");
    doc.fillColor("#3b2117").font(bold).fontSize(8);
    doc.text("SẢN PHẨM", 56, startY + 8, { width: 220 });
    doc.text("SL", 290, startY + 8, { width: 35, align: "center" });
    doc.text("ĐƠN GIÁ", 335, startY + 8, { width: 85, align: "right" });
    doc.text("THÀNH TIỀN", 435, startY + 8, { width: 100, align: "right" });
    let y = startY + 38;
    for (const item of invoice.items) {
      doc.font(bold).fontSize(9).fillColor("#3b2117").text(item.productName, 56, y, { width: 220 });
      doc.font(regular).fontSize(7).fillColor("#765f52").text(`${item.variantName} · ${item.sku}`, 56, y + 13, { width: 220 });
      doc.font(regular).fontSize(9).fillColor("#3b2117").text(String(item.quantity), 290, y, { width: 35, align: "center" });
      doc.text(formatPrice(item.unitPrice), 335, y, { width: 85, align: "right" });
      doc.text(formatPrice(item.lineTotal), 435, y, { width: 100, align: "right" });
      y += 44;
      doc.moveTo(56, y - 8).lineTo(535, y - 8).strokeColor("#eadfd3").stroke();
      if (y > 680) { doc.addPage(); y = 60; }
    }
    y += 10;
    const totals = [["Tạm tính", invoice.order.subtotal], ["Giảm giá", -invoice.order.discount], ["Phí vận chuyển", invoice.order.shippingFee]] as const;
    doc.font(regular).fontSize(9);
    for (const [label, value] of totals) {
      doc.fillColor("#765f52").text(label, 330, y, { width: 100 });
      doc.fillColor("#3b2117").text(formatPrice(value), 435, y, { width: 100, align: "right" });
      y += 20;
    }
    doc.font(bold).fontSize(12).fillColor("#3b2117").text("TỔNG THANH TOÁN", 300, y + 4, { width: 130 });
    doc.fillColor("#9a5f35").text(formatPrice(invoice.order.total), 435, y + 4, { width: 100, align: "right" });
    y += 40;
    doc.font(regular).fontSize(9).fillColor("#3b2117").text(`Phương thức: ${paymentMethodLabels[invoice.order.paymentMethod]}\nTrạng thái: ${paymentStatusLabels[invoice.order.paymentStatus]}`, 56, y);
    doc.moveDown(3).fontSize(8).fillColor("#765f52").text(invoice.notes || "Hóa đơn bán hàng nội bộ.", { align: "center" });
    doc.moveDown(1).font(bold).fontSize(10).fillColor("#3b2117").text("Cảm ơn bạn đã tin tưởng Beanora!", { align: "center" });
    doc.end();
  });
}
