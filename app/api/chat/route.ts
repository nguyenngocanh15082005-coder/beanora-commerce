import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { getCoffeeAdvice } from "@/lib/ai";
import { rateLimit } from "@/lib/rate-limit";
import { apiError } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const ip = (await headers()).get("x-forwarded-for") || "local";
    if (!rateLimit(`chat:${ip}`, 20, 60_000).allowed) return NextResponse.json({ error: "Bạn gửi tin nhắn quá nhanh. Vui lòng thử lại sau." }, { status: 429 });
    const { message } = z.object({ message: z.string().trim().min(1).max(1000) }).parse(await request.json());
    const result = await getCoffeeAdvice(message);
    return NextResponse.json(result);
  } catch (error) { return apiError(error); }
}
