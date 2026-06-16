import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import {
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/session";

export const runtime = "nodejs"; // bcryptjs needs Node

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { password?: string };
  const password = body.password ?? "";

  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) {
    return NextResponse.json(
      { error: "Server is not configured (missing ADMIN_PASSWORD_HASH)." },
      { status: 500 },
    );
  }

  const ok = password.length > 0 && (await bcrypt.compare(password, hash));
  if (!ok) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const token = await createSessionToken();
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, sessionCookieOptions);
  return NextResponse.json({ ok: true });
}
