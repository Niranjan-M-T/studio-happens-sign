import { NextRequest, NextResponse } from "next/server";
import { controlDb } from "@/lib/control";
import { verifyOtp } from "@/lib/otp";

export const runtime = "nodejs";

/**
 * Create a new agency account after OTP verification.
 * The caller should then sign in with supabase.auth.signInWithPassword().
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as {
    name?: string;
    email?: string;
    password?: string;
    otp?: string;
  };

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const otp = body.otp?.trim() ?? "";

  if (name.length < 2) {
    return NextResponse.json({ error: "Agency name must be at least 2 characters." }, { status: 400 });
  }
  if (!email.includes("@")) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }
  if (!otp) {
    return NextResponse.json({ error: "Verification code is required." }, { status: 400 });
  }

  const valid = await verifyOtp(email, otp, "signup");
  if (!valid) {
    return NextResponse.json(
      { error: "Invalid or expired code. Request a new one." },
      { status: 400 },
    );
  }

  // Create Supabase Auth user with email pre-confirmed (OTP already verified it).
  const { data, error } = await controlDb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (error) {
    const duplicate = /already registered|already exists/i.test(error.message);
    return NextResponse.json(
      { error: duplicate ? "An account with this email already exists." : error.message },
      { status: duplicate ? 409 : 400 },
    );
  }

  // Agency row is provisioned on first authenticated request via ensureAgencyForUser.
  // Pre-seed it here so the name is captured from sign-up metadata.
  await controlDb.from("agencies").upsert(
    { user_id: data.user.id, name, email },
    { onConflict: "user_id", ignoreDuplicates: false },
  );

  return NextResponse.json({ ok: true });
}
