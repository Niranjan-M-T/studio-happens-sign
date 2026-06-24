"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import RepoFooter from "@/components/RepoFooter";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError("Please enter your agency name.");
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createBrowserSupabase();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: name.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin/settings`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    // If email confirmation is required, there's no session yet.
    if (!data.session) {
      setCheckEmail(true);
      setLoading(false);
      return;
    }
    router.replace("/admin/settings");
    router.refresh();
  }

  if (checkEmail) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink px-6 text-white">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-2xl">
            ✉️
          </div>
          <h1 className="mt-5 font-display text-2xl tracking-tight">Check your email</h1>
          <p className="mt-2 text-sm text-white/60">
            We sent a confirmation link to <strong>{email}</strong>. Click it to
            activate your account, then sign in.
          </p>
          <Link
            href="/admin/login"
            className="mt-6 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white glow-accent"
          >
            Go to sign in
          </Link>
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

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
        >
          <label className="block text-xs font-semibold uppercase tracking-wider text-white/60">
            Agency name
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-white outline-none focus:border-accent"
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
            className="mt-2 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-white outline-none focus:border-accent"
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
            className="mt-2 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-white outline-none focus:border-accent"
            placeholder="At least 6 characters"
          />

          {error && <p className="mt-3 text-sm text-accent-bright">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-lg bg-accent py-2.5 font-semibold text-white transition hover:bg-accent-deep disabled:opacity-50 glow-accent"
          >
            {loading ? "Creating…" : "Create account"}
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
