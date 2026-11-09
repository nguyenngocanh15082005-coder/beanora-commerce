import { NextResponse } from "next/server";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/http";
export async function POST(request: Request) {
  try {
    const { token, password } = z.object({ token: z.string().min(20), password: z.string().min(8).max(72).regex(/[A-Z]/).regex(/[a-z]/).regex(/\d/) }).parse(await request.json());
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const reset = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!reset || reset.usedAt || reset.expiresAt < new Date()) return NextResponse.json({ error: "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn." }, { status: 400 });
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.$transaction([prisma.user.update({ where: { email: reset.email }, data: { passwordHash } }), prisma.passwordResetToken.update({ where: { id: reset.id }, data: { usedAt: new Date() } }), prisma.session.deleteMany({ where: { user: { email: reset.email } } })]);
    return NextResponse.json({ message: "Mật khẩu đã được cập nhật. Bạn có thể đăng nhập bằng mật khẩu mới." });
  } catch (error) { return apiError(error); }
}
