import "server-only";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";

const COOKIE = "guest_session";
const MAX_AGE = 30 * 24 * 60 * 60; // 30 days

/** Get or create a guest session id from the request cookies. */
export async function getOrCreateGuestSession(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  if (existing) return existing;
  const id = randomUUID();
  jar.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
  return id;
}

/** Read the current guest session id (or null if none). */
export async function getGuestSession(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COOKIE)?.value ?? null;
}
