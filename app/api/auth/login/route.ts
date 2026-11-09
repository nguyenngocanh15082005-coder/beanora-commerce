import { NextResponse } from "next/server";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { apiError } from "@/lib/http";

const schema = z.object({ identifier: z.string().trim().min(3).max(160), password: z.string().min(1).max(72), remember: z.boolean().default(true) });

export async function POST(request: Request) {
  try {
    const ip = (await headers()).get("x-forwarded-for") || "local";
    if (!rateLimit(`login:${ip}`, 10, 300_000).allowed) return NextResponse.json({ error: "Đăng nhập tạm thời bị khóa do thử quá nhiều lần." }, { status: 429 });
    const { identifier, password, remember } = schema.parse(await request.json());
    const user = await prisma.user.findFirst({ where: { OR: [{ email: identifier.toLowerCase() }, { phone: identifier }] }, include: { roles: { include: { role: true } } } });
    if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) return NextResponse.json({ error: "Thông tin đăng nhập chưa chính xác." }, { status: 401 });
    if (user.lockedAt) return NextResponse.json({ error: "Tài khoản đang bị khóa. Vui lòng liên hệ hỗ trợ." }, { status: 403 });
    await createSession(user.id, remember);
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, roles: user.roles.map(({ role }) => role.code) } });
  } catch (error) { return apiError(error); }
}
