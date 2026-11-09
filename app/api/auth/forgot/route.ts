import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmailOnce } from "@/lib/email";
import { apiError } from "@/lib/http";
export async function POST(request: Request) {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(await request.json());
    const normalized = email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalized } });
    if (user) {
      const token = randomBytes(32).toString("base64url");
      await prisma.passwordResetToken.create({ data: { email: normalized, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 30 * 60_000) } });
      const url = `${process.env.APP_URL || "http://localhost:3000"}/reset-password?token=${encodeURIComponent(token)}`;
      await sendEmailOnce(`reset:${createHash("sha256").update(token).digest("hex")}`, normalized, "[Beanora] Đặt lại mật khẩu", `<p>Bạn vừa yêu cầu đặt lại mật khẩu Beanora.</p><p><a href="${url}">Nhấn vào đây để đặt mật khẩu mới</a>. Liên kết có hiệu lực trong 30 phút.</p><p>Nếu không phải bạn yêu cầu, hãy bỏ qua email này.</p>`);
    }
    return NextResponse.json({ message: "Nếu email tồn tại, hướng dẫn khôi phục sẽ được xử lý. Vui lòng kiểm tra hộp thư khi dịch vụ email đã được cấu hình." });
  } catch (error) { return apiError(error); }
}
