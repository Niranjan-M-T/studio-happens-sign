import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase-server";
import { sendOtp, verifyOtp } from "@/lib/otp";
import { controlDb } from "@/lib/control";

export const runtime = "nodejs";

/** POST — send an OTP to the logged-in user's email for password-change confirmation. */
export async function POST(_req: NextRequest) {
  const user = await getSessionUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await sendOtp(user.email, "password_change");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/otp] sendOtp failed:", err);
    return NextResponse.json({ error: "Could not send the code. Try again shortly." }, { status: 500 });
  }
}

/** PUT — verify OTP and update the password. */
export async function PUT(req: NextRequest) {
  const user = await getSessionUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({})) as { otp?: string; newPassword?: string };
  const otp = body.otp?.trim() ?? "";
  const newPassword = body.newPassword ?? "";

  if (!otp) {
    return NextResponse.json({ error: "Verification code is required." }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const valid = await verifyOtp(user.email, otp, "password_change");
  if (!valid) {
    return NextResponse.json(
      { error: "Invalid or expired code. Request a new one." },
      { status: 400 },
    );
  }

  const { error } = await controlDb.auth.admin.updateUserById(user.id, { password: newPassword });
  if (error) {
    console.error("[admin/otp] password update failed:", error);
    return NextResponse.json({ error: "Could not update the password." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
