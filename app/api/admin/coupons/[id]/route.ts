import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { apiError } from "@/lib/http";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const admin = await requirePermission("settings:write"); const { id } = await params; const { active } = z.object({ active: z.boolean() }).parse(await request.json()); await prisma.coupon.update({ where: { id }, data: { active } }); await prisma.adminAuditLog.create({ data: { actorId: admin.id, action: "COUPON_TOGGLE", entityType: "Coupon", entityId: id, metadata: { active } } }); return NextResponse.json({ ok: true }); } catch (error) { return apiError(error); } }
