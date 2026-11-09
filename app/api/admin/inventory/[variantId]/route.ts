import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { apiError } from "@/lib/http";

export async function POST(request: Request, { params }: { params: Promise<{ variantId: string }> }) {
  try {
    const admin = await requirePermission("inventory:write");
    const { variantId } = await params;
    const { type, quantity, note } = z.object({ type: z.enum(["IMPORT", "ADJUSTMENT"]), quantity: z.number().int().min(1).max(100000), note: z.string().min(3).max(300) }).parse(await request.json());
    const result = await prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findUniqueOrThrow({ where: { variantId } });
      const delta = type === "IMPORT" ? quantity : quantity - inventory.quantity;
      if (type === "ADJUSTMENT" && quantity < inventory.reserved) throw new Error("Tồn mới không được nhỏ hơn số lượng đang giữ.");
      const balanceAfter = type === "IMPORT" ? inventory.quantity + quantity : quantity;
      const updated = await tx.inventory.update({ where: { id: inventory.id }, data: { quantity: balanceAfter } });
      await tx.inventoryTransaction.create({ data: { variantId, type, quantity: delta, balanceAfter, note, actorId: admin.id } });
      await tx.adminAuditLog.create({ data: { actorId: admin.id, action: "INVENTORY_UPDATE", entityType: "ProductVariant", entityId: variantId, metadata: { type, quantity, note } } });
      return updated;
    });
    return NextResponse.json({ inventory: result });
  } catch (error) { return apiError(error); }
}
