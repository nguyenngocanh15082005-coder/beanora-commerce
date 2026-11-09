import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { apiError } from "@/lib/http";
export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const input = z.object({ name: z.string().trim().min(2).max(80), phone: z.string().regex(/^(0|\+84)\d{9,10}$/) }).parse(await request.json());
    const updated = await prisma.user.update({ where: { id: user.id }, data: input });
    return NextResponse.json({ user: { name: updated.name, phone: updated.phone } });
  } catch (error) { return apiError(error); }
}
