"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import RepoFooter from "@/components/RepoFooter";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    const next =
      new URLSearchParams(window.location.search).get("next") || "/admin";
    router.replace(next);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-6 text-white">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="font-display text-3xl tracking-tight">STUDIO HAPPENS</h1>
          <p className="mt-1 text-sm font-semibold uppercase tracking-[0.3em] text-accent">
            Sign
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
        >
          <label className="block text-xs font-semibold uppercase tracking-wider text-white/60">
            Email
          </label>
          <input
            type="email"
            autoFocus
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-white outline-none focus:border-accent"
            placeholder="you@agency.com"
          />

          <div className="mt-4 flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/60">
              Password
            </label>
            <Link href="/admin/forgot" className="text-xs text-accent hover:underline">
              Forgot?
            </Link>
          </div>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-white outline-none focus:border-accent"
            placeholder="••••••••"
          />

          {error && <p className="mt-3 text-sm text-accent-bright">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-lg bg-accent py-2.5 font-semibold text-white transition hover:bg-accent-deep disabled:opacity-50 glow-accent"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <p className="mt-4 text-center text-sm text-white/50">
            New agency?{" "}
            <Link href="/admin/signup" className="font-semibold text-accent hover:underline">
              Create an account
            </Link>
          </p>
        </form>

        <RepoFooter />
      </div>
    </main>
  );
}
