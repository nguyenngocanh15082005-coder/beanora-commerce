import { NextRequest, NextResponse } from "next/server";

/** Chặn mutation cross-site cho API trình duyệt; webhook có HMAC riêng. */
export function middleware(request: NextRequest) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method) || request.nextUrl.pathname === "/api/payments/webhook") return NextResponse.next();
  if (request.headers.get("sec-fetch-site") === "cross-site") return NextResponse.json({ error: "Yêu cầu cross-site bị từ chối." }, { status: 403 });
  const origin = request.headers.get("origin");
  if (origin) {
    const allowed = new Set<string>([request.nextUrl.origin]);
    const forwardedHost = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "").split(",")[0].trim();
    const forwardedProto = (request.headers.get("x-forwarded-proto") || "").split(",")[0].trim();
    if (forwardedHost && forwardedProto) allowed.add(`${forwardedProto}://${forwardedHost}`);
    if (process.env.APP_URL) allowed.add(new URL(process.env.APP_URL).origin);
    if (!allowed.has(origin)) return NextResponse.json({ error: "Origin không hợp lệ." }, { status: 403 });
  }
  return NextResponse.next();
}

export const config = { matcher: ["/api/:path*"] };
