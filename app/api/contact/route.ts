import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/http";
export async function POST(request: Request) { try { const input = z.object({ name: z.string().trim().min(2).max(100), email: z.string().email(), phone: z.string().max(20).optional(), subject: z.string().min(2).max(150), message: z.string().trim().min(10).max(3000) }).parse(await request.json()); await prisma.contactMessage.create({ data: input }); return NextResponse.json({ message: "Beanora đã nhận lời nhắn và lưu vào hệ thống. Chúng tôi sẽ phản hồi qua email bạn cung cấp." }, { status: 201 }); } catch (error) { return apiError(error); } }
