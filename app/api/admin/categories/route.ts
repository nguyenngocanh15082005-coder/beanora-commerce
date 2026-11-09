import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { apiError } from "@/lib/http";
export async function POST(request: Request) { try { const admin = await requirePermission("products:write"); const input = z.object({ name: z.string().trim().min(2), slug: z.string().regex(/^[a-z0-9-]+$/), description: z.string().max(1000).optional(), position: z.number().int().nonnegative() }).parse(await request.json()); const category = await prisma.category.create({ data: input }); await prisma.adminAuditLog.create({ data: { actorId: admin.id, action: "CATEGORY_CREATE", entityType: "Category", entityId: category.id } }); return NextResponse.json({ category }, { status: 201 }); } catch (error) { return apiError(error); } }
