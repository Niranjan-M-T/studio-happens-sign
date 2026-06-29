"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import RepoFooter from "@/components/RepoFooter";

type Step = "form" | "otp";

export default function SignupPage() {
  const router = useRouter();

  // Step 1 fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2 fields
  const [otp, setOtp] = useState("");
  const otpRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /** Step 1 — validate + send OTP */
  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) { setError("Enter your agency name (at least 2 characters)."); return; }
    if (!email.includes("@")) { setError("Enter a valid email."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

    setLoading(true);
    const res = await fetch("/api/auth/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Could not send code."); return; }

    setStep("otp");
    setTimeout(() => otpRef.current?.focus(), 50);
  }

  /** Step 2 — verify OTP + create account + sign in */
  async function createAccount(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (otp.trim().length !== 6) { setError("Enter the 6-digit code."); return; }

    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password, otp: otp.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLoading(false);
      setError(data.error ?? "Could not create account.");
      return;
    }

    // Account created — sign in now.
    const supabase = createBrowserSupabase();
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInErr) { setError(signInErr.message); return; }
    router.replace("/admin/settings");
    router.refresh();
  }

  async function resendCode() {
    setError(null);
    setOtp("");
    setLoading(true);
    const res = await fetch("/api/auth/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) setError(data.error ?? "Could not resend code.");
  }

  const inputCls =
    "mt-1.5 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-white outline-none focus:border-accent";

  if (step === "otp") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink px-6 text-white">
        <div className="w-full max-w-sm">
          <div className="mb-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-2xl">
              ✉️
            </div>
            <h1 className="mt-5 font-display text-2xl tracking-tight">Check your email</h1>
            <p className="mt-2 text-sm text-white/60">
              We sent a 6-digit code to <strong>{email}</strong>. Enter it below to verify your account.
            </p>
          </div>

          <form onSubmit={createAccount} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/60">
              Verification code
            </label>
            <input
              ref={otpRef}
              className="mt-1.5 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-3 text-center text-2xl font-bold tracking-[0.4em] text-white outline-none focus:border-accent"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              autoComplete="one-time-code"
            />

            {error && <p className="mt-3 text-sm text-accent-bright">{error}</p>}

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="mt-5 w-full rounded-lg bg-accent py-2.5 font-semibold text-white transition hover:bg-accent-deep disabled:opacity-50 glow-accent"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>

            <div className="mt-4 flex justify-between text-sm text-white/50">
              <button
                type="button"
                onClick={() => { setStep("form"); setError(null); setOtp(""); }}
                className="hover:text-white"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={resendCode}
                disabled={loading}
                className="hover:text-white disabled:opacity-40"
              >
                Resend code
              </button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-6 text-white">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="font-display text-3xl tracking-tight">STUDIO HAPPENS</h1>
          <p className="mt-1 text-sm font-semibold uppercase tracking-[0.3em] text-accent">
            Sign · Create account
          </p>
        </div>

        <form onSubmit={sendCode} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-white/60">
            Agency name
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
            placeholder="Acme Agency"
          />

          <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-white/60">
            Email
          </label>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
            placeholder="you@agency.com"
          />

          <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-white/60">
            Password
          </label>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
            placeholder="At least 6 characters"
          />

          {error && <p className="mt-3 text-sm text-accent-bright">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-lg bg-accent py-2.5 font-semibold text-white transition hover:bg-accent-deep disabled:opacity-50 glow-accent"
          >
            {loading ? "Sending code…" : "Send verification code"}
          </button>

          <p className="mt-4 text-center text-sm text-white/50">
            Already have an account?{" "}
            <Link href="/admin/login" className="font-semibold text-accent hover:underline">
              Sign in
            </Link>
          </p>
        </form>

        <RepoFooter />
      </div>
    </main>
  );
}
