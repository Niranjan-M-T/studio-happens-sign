import { NextRequest, NextResponse } from "next/server";
import { sendOtp } from "@/lib/otp";

export const runtime = "nodejs";

/** Send a signup OTP — unauthenticated. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { email?: string };
  const email = body.email?.trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  try {
    await sendOtp(email, "signup");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send code." },
      { status: 500 },
    );
  }
}
