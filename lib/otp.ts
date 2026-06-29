import "server-only";
import { controlDb } from "./control";

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_SECS = 60;
const RESEND_API_URL = "https://api.resend.com/emails";

export type OtpPurpose = "signup" | "password_change";

/**
 * Generate a 6-digit OTP, store it (replacing any prior one for this
 * email+purpose), and send it via Resend.
 * Throws if a code was already sent in the last RATE_LIMIT_SECS seconds.
 */
export async function sendOtp(email: string, purpose: OtpPurpose): Promise<void> {
  // Rate-limit: one request per 60 s per email+purpose.
  const { data: recent } = await controlDb
    .from("email_otps")
    .select("created_at")
    .eq("email", email)
    .eq("purpose", purpose)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recent) {
    const age = (Date.now() - new Date(recent.created_at).getTime()) / 1000;
    if (age < RATE_LIMIT_SECS) {
      throw new Error(
        `Wait ${Math.ceil(RATE_LIMIT_SECS - age)} seconds before requesting a new code.`,
      );
    }
  }

  // Replace any stale code.
  await controlDb.from("email_otps").delete().eq("email", email).eq("purpose", purpose);

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  const { error } = await controlDb
    .from("email_otps")
    .insert({ email, code, purpose, expires_at: expiresAt });
  if (error) throw new Error(`Failed to store verification code: ${error.message}`);

  await deliverOtp(email, code, purpose);
}

/**
 * Verify a code. Returns true and deletes the row on success.
 * Returns false if the code is wrong, expired, or already used.
 */
export async function verifyOtp(
  email: string,
  code: string,
  purpose: OtpPurpose,
): Promise<boolean> {
  const { data } = await controlDb
    .from("email_otps")
    .select("id, expires_at")
    .eq("email", email)
    .eq("code", code.trim())
    .eq("purpose", purpose)
    .maybeSingle();

  if (!data) return false;

  if (new Date(data.expires_at) < new Date()) {
    await controlDb.from("email_otps").delete().eq("id", data.id);
    return false;
  }

  await controlDb.from("email_otps").delete().eq("id", data.id);
  return true;
}

async function deliverOtp(email: string, code: string, purpose: OtpPurpose): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set — cannot send verification email.");

  const from =
    process.env.RESEND_FROM ?? "Studio Happens Sign <onboarding@resend.dev>";

  const isSignup = purpose === "signup";
  const subject = isSignup ? "Your verification code" : "Confirm your password change";
  const heading = isSignup ? "Verify your email" : "Password change request";
  const body = isSignup
    ? "Use this code to verify your email and finish creating your account:"
    : "Use this code to confirm you want to change your password:";

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2 style="margin:0 0 8px;font-size:20px">Studio Happens Sign — ${heading}</h2>
      <p style="color:#444;margin:0 0 20px">${body}</p>
      <div style="display:inline-block;background:#f4f4f4;border-radius:8px;padding:16px 32px;
                  font-size:40px;font-weight:700;letter-spacing:0.25em;color:#111">
        ${code}
      </div>
      <p style="color:#888;font-size:13px;margin:20px 0 0">
        This code expires in 5 minutes.
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>`;

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [email], subject, html }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Resend error ${res.status}: ${text}`);
  }
}
