import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin, requireAdmin } from "@/lib/auth";
import { buildVietQrPayload } from "@/lib/vietqr";
import { apiError } from "@/lib/http";

const schema = z.object({
  codEnabled: z.boolean(), bankEnabled: z.boolean(), bankName: z.string().trim().max(100),
  bankCode: z.string().trim().max(30), bankBin: z.string().trim().max(6), accountNumber: z.string().trim().max(19),
  accountName: z.string().trim().max(100), branch: z.string().trim().max(150).nullable().optional(),
  qrImageUrl: z.string().trim().max(500).nullable().optional(), instructions: z.string().trim().max(1000).nullable().optional(),
  paymentTimeoutMinutes: z.number().int().min(15).max(10080), shippingFee: z.number().int().min(0), freeShippingFrom: z.number().int().min(0),
});

export async function PUT(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!isSuperAdmin(admin)) return NextResponse.json({ error: "Chỉ Super Admin được thay đổi cài đặt nhận tiền." }, { status: 403 });
    const input = schema.parse(await request.json());
    if (input.bankEnabled) {
      buildVietQrPayload({ bankBin: input.bankBin, accountNumber: input.accountNumber, amount: 1000, description: "KIEM TRA CAU HINH" });
      if (!input.bankName || !input.accountName) return NextResponse.json({ error: "Vui lòng nhập đủ tên ngân hàng và chủ tài khoản." }, { status: 400 });
    }
    const settings = await prisma.$transaction(async (tx) => {
      const saved = await tx.paymentSetting.update({ where: { id: "default" }, data: { ...input, updatedBy: admin.id } });
      await tx.adminAuditLog.create({ data: { actorId: admin.id, action: "PAYMENT_SETTINGS_UPDATE", entityType: "PaymentSetting", entityId: "default", metadata: { ...input, accountNumber: input.accountNumber ? `***${input.accountNumber.slice(-4)}` : "" } } });
      return saved;
    });
    return NextResponse.json({ settings });
  } catch (error) { return apiError(error); }
}
