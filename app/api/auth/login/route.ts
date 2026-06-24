import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { controlDb } from "@/lib/control";
import {
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/session";

export const runtime = "nodejs"; // bcryptjs needs Node

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";

  const { data: agency } = await controlDb
    .from("agencies")
    .select("id, password_hash")
    .eq("email", email)
    .maybeSingle();

  // Always run a compare to avoid leaking which emails exist via timing.
  const hash = (agency?.password_hash as string | undefined) ?? "";
  const ok =
    !!agency && password.length > 0 && (await bcrypt.compare(password, hash));
  if (!ok) {
    return NextResponse.json(
      { error: "Incorrect email or password." },
      { status: 401 },
    );
  }

  const token = await createSessionToken(agency!.id as string);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, sessionCookieOptions);
  return NextResponse.json({ ok: true });
}
