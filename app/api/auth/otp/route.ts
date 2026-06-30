import { NextRequest, NextResponse } from "next/server";
import { sendOtp } from "@/lib/otp";
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Send a signup OTP — unauthenticated. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { email?: string };
  const email = body.email?.trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  // Throttle both the sender IP (20/hr) and the target email (5/15min) so the
  // endpoint can't be used to bomb an inbox or burn the Resend quota.
  const ipRl = rateLimit(`otp-ip:${clientIp(req)}`, 20, 60 * 60 * 1000);
  if (!ipRl.ok) return tooManyRequests(ipRl);
  const emailRl = rateLimit(`otp-email:${email}`, 5, 15 * 60 * 1000);
  if (!emailRl.ok) return tooManyRequests(emailRl);

  try {
    await sendOtp(email, "signup");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[auth/otp] sendOtp failed:", err);
    return NextResponse.json({ error: "Could not send the code. Try again shortly." }, { status: 500 });
  }
}
