import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "beanora_session";
const SESSION_DAYS = 30;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId: string, remember = true) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + (remember ? SESSION_DAYS : 1) * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { userId, tokenHash: hashToken(token), expiresAt } });
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  jar.set(COOKIE_NAME, "", { httpOnly: true, expires: new Date(0), path: "/" });
}

export const getCurrentUser = cache(async () => {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } } } },
  });
  if (!session || session.expiresAt < new Date() || session.user.lockedAt) return null;
  return session.user;
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export const isAdmin = (user: CurrentUser | null) => Boolean(user?.roles.some(({ role }) =>
  ["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER", "PRODUCT_MANAGER", "SUPPORT", "WAREHOUSE"].includes(role.code),
));

export const isSuperAdmin = (user: CurrentUser | null) => Boolean(user?.roles.some(({ role }) => role.code === "SUPER_ADMIN"));

export const hasPermission = (user: CurrentUser | null, code: string) => Boolean(user && (
  isSuperAdmin(user) || user.roles.some(({ role }) => role.permissions.some(({ permission }) => permission.code === code))
));

export async function requirePermission(code: string) {
  const user = await requireAdmin();
  if (!hasPermission(user, code)) throw new Error("FORBIDDEN");
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) throw new Error("FORBIDDEN");
  return user;
}

export function safeSecretEqual(received: string, expected: string) {
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
