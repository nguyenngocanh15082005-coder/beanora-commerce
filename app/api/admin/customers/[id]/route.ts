import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin, requirePermission } from "@/lib/auth";
import { apiError } from "@/lib/http";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requirePermission("customers:write");
    if (!isSuperAdmin(admin)) return NextResponse.json({ error: "Chỉ Super Admin được khóa/mở khóa tài khoản." }, { status: 403 });
    const { id } = await params;
    const { locked } = z.object({ locked: z.boolean() }).parse(await request.json());
    if (id === admin.id) return NextResponse.json({ error: "Không thể tự khóa tài khoản của bạn." }, { status: 400 });
    await prisma.user.update({ where: { id }, data: { lockedAt: locked ? new Date() : null } });
    if (locked) await prisma.session.deleteMany({ where: { userId: id } });
    await prisma.adminAuditLog.create({ data: { actorId: admin.id, action: locked ? "CUSTOMER_LOCK" : "CUSTOMER_UNLOCK", entityType: "User", entityId: id } });
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
