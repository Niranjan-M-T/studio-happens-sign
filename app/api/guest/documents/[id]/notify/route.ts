import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Guest mode doesn't support notify-email configuration (no Resend key).
// DocumentEditor calls this endpoint; we accept it silently.
export async function PUT() {
  return NextResponse.json({ ok: true });
}
