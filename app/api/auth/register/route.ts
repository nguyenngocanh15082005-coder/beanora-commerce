import { NextResponse } from "next/server";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { apiError } from "@/lib/http";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().regex(/^(0|\+84)\d{9,10}$/, "Số điện thoại không hợp lệ"),
  password: z.string().min(8).max(72).regex(/[A-Z]/, "Cần ít nhất một chữ hoa").regex(/[a-z]/, "Cần ít nhất một chữ thường").regex(/\d/, "Cần ít nhất một số"),
  terms: z.literal(true),
});

export async function POST(request: Request) {
  try {
    const ip = (await headers()).get("x-forwarded-for") || "local";
    if (!rateLimit(`register:${ip}`, 5, 300_000).allowed) return NextResponse.json({ error: "Bạn đã thử quá nhiều lần. Vui lòng thử lại sau." }, { status: 429 });
    const input = schema.parse(await request.json());
    const email = input.email.toLowerCase();
    const exists = await prisma.user.findFirst({ where: { OR: [{ email }, { phone: input.phone }] } });
    if (exists) return NextResponse.json({ error: "Email hoặc số điện thoại đã được đăng ký." }, { status: 409 });
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({ data: { name: input.name, email, phone: input.phone, passwordHash } });
    await createSession(user.id);
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } }, { status: 201 });
  } catch (error) { return apiError(error); }
}
