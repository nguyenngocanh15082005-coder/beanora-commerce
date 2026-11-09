import { NextResponse } from "next/server";
import { z } from "zod";
import { isSuperAdmin, requireAdmin } from "@/lib/auth";
import { generateVietQrDataUrl } from "@/lib/vietqr";
import { apiError } from "@/lib/http";
export async function POST(request: Request) { try { const admin = await requireAdmin(); if (!isSuperAdmin(admin)) return NextResponse.json({ error: "Chỉ Super Admin được tạo QR cấu hình." }, { status: 403 }); const input = z.object({ bankBin: z.string(), accountNumber: z.string() }).parse(await request.json()); const qr = await generateVietQrDataUrl({ ...input, amount: 1000, description: "BEANORA KIEM TRA QR" }); return NextResponse.json({ qr }); } catch (error) { return apiError(error); } }
