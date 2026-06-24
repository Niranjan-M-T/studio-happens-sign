import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

/**
 * Agency session = a short HS256 JWT in an httpOnly cookie carrying the
 * agency id. Kept free of any Node-only deps (e.g. bcrypt) so it can run in
 * the edge proxy as well as Node route handlers.
 */
export const SESSION_COOKIE = "sh_admin";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(s);
}

export async function createSessionToken(agencyId: string): Promise<string> {
  return new SignJWT({ agencyId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret());
}

/** Edge-safe validity check (used by proxy.ts). */
export async function verifySessionToken(
  token: string | undefined | null,
): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, secret());
    return true;
  } catch {
    return false;
  }
}

/** Node-side: read the cookie and return the logged-in agency id (or null). */
export async function getSessionAgencyId(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const id = payload.agencyId;
    return typeof id === "string" ? id : null;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};
