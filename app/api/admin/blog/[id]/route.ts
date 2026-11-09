import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { apiError } from "@/lib/http";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const admin = await requirePermission("products:write"); const { id } = await params; const { published } = z.object({ published: z.boolean() }).parse(await request.json()); await prisma.blogPost.update({ where: { id }, data: { published, publishedAt: published ? new Date() : null } }); await prisma.adminAuditLog.create({ data: { actorId: admin.id, action: "BLOG_TOGGLE", entityType: "BlogPost", entityId: id, metadata: { published } } }); return NextResponse.json({ ok: true }); } catch (error) { return apiError(error); } }
