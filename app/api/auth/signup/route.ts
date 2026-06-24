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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    email?: string;
    password?: string;
  };
  const name = body.name?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";

  if (name.length < 2) {
    return NextResponse.json({ error: "Please enter your agency name." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  // Reject duplicate email up front (also guarded by the unique index).
  const { data: existing } = await controlDb
    .from("agencies")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 409 },
    );
  }

  const password_hash = await bcrypt.hash(password, 12);
  const { data: agency, error } = await controlDb
    .from("agencies")
    .insert({ name, email, password_hash })
    .select("id")
    .single();
  if (error || !agency) {
    // 23505 = unique violation (race on email)
    const dup = (error as { code?: string } | null)?.code === "23505";
    return NextResponse.json(
      { error: dup ? "An account with that email already exists." : (error?.message ?? "Could not create account.") },
      { status: dup ? 409 : 500 },
    );
  }

  const token = await createSessionToken(agency.id as string);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, sessionCookieOptions);
  return NextResponse.json({ ok: true });
}
