import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { apiError } from "@/lib/http";

export async function POST(request: Request, { params }: { params: Promise<{ orderCode: string }> }) {
  try {
    const { orderCode } = await params;
    const { phone } = z.object({ phone: z.string().min(9).max(20) }).parse(await request.json());
    const user = await getCurrentUser();
    const order = await prisma.order.findUnique({ where: { orderCode } });
    if (!order || (order.customerPhone !== phone && order.userId !== user?.id)) return NextResponse.json({ error: "Không thể xác minh đơn hàng." }, { status: 404 });
    if (order.paymentMethod !== "BANK_TRANSFER") return NextResponse.json({ error: "Đơn hàng không sử dụng chuyển khoản." }, { status: 400 });
    if (order.paymentStatus === "PAID") return NextResponse.json({ status: "PAID", message: "Thanh toán đã được xác nhận." });
    if (!["AWAITING_TRANSFER", "VERIFYING"].includes(order.paymentStatus)) return NextResponse.json({ error: "Trạng thái thanh toán không cho phép gửi yêu cầu." }, { status: 400 });
    if (order.paymentStatus !== "VERIFYING") await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: "VERIFYING", transferReportedAt: new Date() } });
    return NextResponse.json({ status: "VERIFYING", message: "Đã gửi yêu cầu. Beanora sẽ đối chiếu giao dịch thực tế trước khi xác nhận thanh toán." });
  } catch (error) { return apiError(error); }
}
