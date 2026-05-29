import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { users } from "./repo";

const COOKIE_NAME = "campusswap_token";
const TOKEN_TTL = 60 * 60 * 24 * 7; // 7 gün

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "JWT_SECRET .env içinde tanımlı olmalı (en az 16 karakter).",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function signToken(payload: {
  sub: string;
  username: string;
}): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_TTL}s`)
    .sign(getSecret());
}

export async function verifyToken(
  token: string,
): Promise<{ sub: string; username: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as { sub: string; username: string };
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_TTL,
  });
}

export async function clearAuthCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload?.sub) return null;
  return users.findDetailed(payload.sub);
}

export async function requireUser() {
  const me = await getCurrentUser();
  if (!me) {
    throw new Response("Yetkisiz", { status: 401 });
  }
  return me;
}

export const COOKIE = COOKIE_NAME;
