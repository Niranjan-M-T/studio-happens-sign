"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Login failed.");
      }
      const next =
        new URLSearchParams(window.location.search).get("next") || "/admin";
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-6 text-white">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="font-display text-3xl tracking-tight">
            STUDIO HAPPENS
          </h1>
          <p className="mt-1 text-sm font-semibold uppercase tracking-[0.3em] text-accent">
            Sign
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
        >
          <label className="block text-xs font-semibold uppercase tracking-wider text-white/60">
            Admin password
          </label>
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-white outline-none focus:border-accent"
            placeholder="••••••••"
          />

          {error && (
            <p className="mt-3 text-sm text-accent-bright">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-lg bg-accent py-2.5 font-semibold text-white transition hover:bg-accent-deep disabled:opacity-50 glow-accent"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
