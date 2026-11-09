import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { verifyPaymentManually } from "@/lib/orders";
import { apiError } from "@/lib/http";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requirePermission("payments:verify");
    const { id } = await params;
    const { approved, note } = z.object({ approved: z.boolean(), note: z.string().max(500).optional() }).parse(await request.json());
    await verifyPaymentManually(id, admin.id, approved, note);
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
