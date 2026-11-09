import "server-only";
import { prisma } from "@/lib/prisma";

export async function getPaymentSettings() {
  return prisma.paymentSetting.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });
}

export async function getSiteSetting<T>(key: string, fallback: T): Promise<T> {
  const setting = await prisma.siteSetting.findUnique({ where: { key } });
  return (setting?.value as T) ?? fallback;
}
