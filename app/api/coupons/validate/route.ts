import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { calculateDiscount } from "@/lib/pricing";
import { apiError } from "@/lib/http";

const schema = z.object({ code: z.string().trim().min(2).max(40), subtotal: z.number().int().nonnegative() });

export async function POST(request: Request) {
  try {
    const { code, subtotal } = schema.parse(await request.json());
    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() }, include: { usages: { select: { id: true } } } });
    const result = calculateDiscount(subtotal, coupon);
    if (!result.valid) return NextResponse.json({ error: result.message }, { status: 400 });
    return NextResponse.json(result);
  } catch (error) { return apiError(error); }
}
