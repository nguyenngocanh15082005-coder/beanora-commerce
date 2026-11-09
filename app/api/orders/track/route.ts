import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/http";

const schema = z.object({ orderCode: z.string().trim().toUpperCase().min(6).max(30), phone: z.string().trim().min(9).max(20) });

export async function POST(request: Request) {
  try {
    const { orderCode, phone } = schema.parse(await request.json());
    const order = await prisma.order.findFirst({ where: { orderCode, customerPhone: phone }, include: {
      items: true, history: { orderBy: { createdAt: "asc" } }, invoice: { select: { invoiceNumber: true } },
    } });
    if (!order) return NextResponse.json({ error: "Không tìm thấy đơn hàng phù hợp với mã đơn và số điện thoại." }, { status: 404 });
    return NextResponse.json({ order });
  } catch (error) { return apiError(error); }
}
