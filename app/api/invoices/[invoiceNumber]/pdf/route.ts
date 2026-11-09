import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { createInvoicePdf } from "@/lib/invoice-pdf";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ invoiceNumber: string }> }) {
  const { invoiceNumber } = await params;
  const invoice = await prisma.invoice.findUnique({ where: { invoiceNumber }, include: { items: true, order: true } });
  if (!invoice) return NextResponse.json({ error: "Không tìm thấy hóa đơn." }, { status: 404 });
  const user = await getCurrentUser();
  const phone = new URL(request.url).searchParams.get("phone");
  if (!isAdmin(user) && invoice.order.userId !== user?.id && invoice.order.customerPhone !== phone) return NextResponse.json({ error: "Bạn không có quyền xem hóa đơn này." }, { status: 403 });
  const pdf = await createInvoicePdf(invoice);
  return new Response(new Uint8Array(pdf), { headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
    "Content-Length": String(pdf.length),
    "Cache-Control": "private, no-store",
  } });
}
