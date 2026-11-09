import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { isSuperAdmin, requireAdmin } from "@/lib/auth";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(); if (!isSuperAdmin(admin)) return NextResponse.json({ error: "Không có quyền upload." }, { status: 403 });
    const file = (await request.formData()).get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Không tìm thấy tệp." }, { status: 400 });
    if (!["image/jpeg","image/png","image/webp"].includes(file.type) || file.size > 3 * 1024 * 1024) return NextResponse.json({ error: "Chỉ nhận JPG/PNG/WebP tối đa 3MB." }, { status: 400 });
    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const name = `${Date.now()}-${randomBytes(6).toString("hex")}.${extension}`;
    const directory = path.join(process.cwd(), "public", "uploads"); await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, name), Buffer.from(await file.arrayBuffer()), { flag: "wx" });
    return NextResponse.json({ url: `/uploads/${name}`, storage: "local", note: "Production serverless cần cấu hình Cloudinary/Supabase Storage để lưu bền vững." }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Upload thất bại" }, { status: 400 }); }
}
