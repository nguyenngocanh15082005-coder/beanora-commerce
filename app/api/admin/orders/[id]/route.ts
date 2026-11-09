import { NextResponse } from "next/server";
import { z } from "zod";
import { OrderStatus } from "@prisma/client";
import { requirePermission } from "@/lib/auth";
import { updateOrderStatus } from "@/lib/orders";
import { apiError } from "@/lib/http";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requirePermission("orders:write");
    const { id } = await params;
    const { status, note } = z.object({ status: z.nativeEnum(OrderStatus), note: z.string().max(500).optional() }).parse(await request.json());
    await updateOrderStatus(id, status, admin.id, note);
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
