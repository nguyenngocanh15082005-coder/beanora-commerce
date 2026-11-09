import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const form = await request.formData();
  const parsed = z.string().email().safeParse(form.get("email"));
  if (!parsed.success) return NextResponse.redirect(new URL("/?newsletter=invalid", request.url), 303);
  await prisma.newsletterSubscriber.upsert({ where: { email: parsed.data.toLowerCase() }, update: { active: true }, create: { email: parsed.data.toLowerCase() } });
  return NextResponse.redirect(new URL("/?newsletter=success", request.url), 303);
}
