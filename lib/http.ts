import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function apiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "Dữ liệu chưa hợp lệ.", details: error.flatten() }, { status: 400 });
  }
  const message = error instanceof Error ? error.message : "Có lỗi xảy ra.";
  if (message === "UNAUTHORIZED") return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  if (message === "FORBIDDEN") return NextResponse.json({ error: "Bạn không có quyền thực hiện thao tác này." }, { status: 403 });
  if (message.startsWith("OUT_OF_STOCK")) return NextResponse.json({ error: message.replace("OUT_OF_STOCK:", "") }, { status: 409 });
  console.error(error);
  return NextResponse.json({ error: message || "Không thể xử lý yêu cầu." }, { status: 400 });
}
