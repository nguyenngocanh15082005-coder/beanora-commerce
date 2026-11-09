import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { apiError } from "@/lib/http";
export async function PUT(request: Request) { try { const admin = await requirePermission("settings:write"); const input = z.object({ brand: z.object({ name: z.string().min(2), slogan: z.string().min(2), tagline: z.string(), description: z.string() }), contact: z.object({ address: z.string().min(2), phone: z.string(), email: z.string().email() }), business: z.object({ storeName: z.string().min(2), address: z.string().min(2), phone: z.string(), email: z.string().email() }) }).parse(await request.json()); await prisma.$transaction(async (tx) => { for (const [key, value] of Object.entries(input)) await tx.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } }); await tx.adminAuditLog.create({ data: { actorId: admin.id, action: "SITE_SETTINGS_UPDATE", entityType: "SiteSetting", entityId: "brand-contact-business" } }); }); return NextResponse.json({ ok: true }); } catch (error) { return apiError(error); } }
