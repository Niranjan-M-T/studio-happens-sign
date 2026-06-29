"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SignaturePad, { type SignaturePadHandle } from "./SignaturePad";
import { DATA_SCHEMA_SQL } from "@/lib/data-schema";
import { createBrowserSupabase } from "@/lib/supabase-browser";

type PwStep = "idle" | "sending" | "otp" | "verifying";

type Status = { kind: "idle" | "saving" | "ok" | "error"; msg?: string };

function StatusText({ s }: { s: Status }) {
  if (s.kind === "saving") return <span className="text-white/50">Saving…</span>;
  if (s.kind === "ok") return <span className="text-emerald-300">{s.msg ?? "Saved ✓"}</span>;
  if (s.kind === "error") return <span className="text-accent-bright">{s.msg}</span>;
  return null;
}

export default function SettingsForm(props: {
  connected: boolean;
  hostingMode: "byo" | "hosted";
  hostedAvailable: boolean;
  email: string;
  name: string;
  supabaseUrl: string;
  bucket: string;
  hasResendKey: boolean;
  resendFrom: string;
  alwaysCc: string;
  signaturePng: string | null;
}) {
  const router = useRouter();

  // ── Connection ────────────────────────────────────────────
  const [supabaseUrl, setSupabaseUrl] = useState(props.supabaseUrl);
  const [serviceKey, setServiceKey] = useState("");
  const [bucket, setBucket] = useState(props.bucket || "documents");
  const [connStatus, setConnStatus] = useState<Status>({ kind: "idle" });
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<"byo" | "hosted">(props.hostingMode);

  async function connect() {
    setConnStatus({ kind: "saving" });
    try {
      const res = await fetch("/api/admin/connection", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "byo", supabaseUrl, serviceKey, bucket }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not connect.");
      setServiceKey("");
      setConnStatus({ kind: "ok" });
      router.refresh();
    } catch (err) {
      setConnStatus({ kind: "error", msg: err instanceof Error ? err.message : "Failed." });
    }
  }

  async function enableHosted() {
    setConnStatus({ kind: "saving" });
    try {
      const res = await fetch("/api/admin/connection", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "hosted" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not enable hosting.");
      setConnStatus({ kind: "ok" });
      router.refresh();
    } catch (err) {
      setConnStatus({ kind: "error", msg: err instanceof Error ? err.message : "Failed." });
    }
  }

  async function copySql() {
    await navigator.clipboard.writeText(DATA_SCHEMA_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  // ── Generic settings saver (name / email / signature) ─────
  async function saveSettings(patch: Record<string, string>, set: (s: Status) => void) {
    set({ kind: "saving" });
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not save.");
      set({ kind: "ok" });
      router.refresh();
    } catch (err) {
      set({ kind: "error", msg: err instanceof Error ? err.message : "Failed." });
    }
  }

  // ── Profile ───────────────────────────────────────────────
  const [name, setName] = useState(props.name);
  const [nameStatus, setNameStatus] = useState<Status>({ kind: "idle" });

  // ── Signature ─────────────────────────────────────────────
  const padRef = useRef<SignaturePadHandle>(null);
  const [sigStatus, setSigStatus] = useState<Status>({ kind: "idle" });
  const [savedSig, setSavedSig] = useState<string | null>(props.signaturePng);

  function saveSignature() {
    const pad = padRef.current;
    if (!pad || pad.isEmpty()) {
      setSigStatus({ kind: "error", msg: "Draw your signature first." });
      return;
    }
    const png = pad.toPng();
    setSavedSig(png);
    void saveSettings({ signaturePng: png }, setSigStatus);
  }
  function removeSignature() {
    setSavedSig(null);
    padRef.current?.clear();
    void saveSettings({ signaturePng: "" }, setSigStatus);
  }

  // ── Email ─────────────────────────────────────────────────
  const [resendKey, setResendKey] = useState("");
  const [resendFrom, setResendFrom] = useState(props.resendFrom);
  const [alwaysCc, setAlwaysCc] = useState(props.alwaysCc);
  const [emailStatus, setEmailStatus] = useState<Status>({ kind: "idle" });

  function saveEmail() {
    const patch: Record<string, string> = { resendFrom, alwaysCc };
    if (resendKey.trim()) patch.resendKey = resendKey.trim();
    void saveSettings(patch, setEmailStatus);
    setResendKey("");
  }

  // ── Account (Supabase Auth) ───────────────────────────────
  const [newPassword, setNewPassword] = useState("");
  const [pwStatus, setPwStatus] = useState<Status>({ kind: "idle" });
  const [pwStep, setPwStep] = useState<PwStep>("idle");
  const [pwOtp, setPwOtp] = useState("");
  const [newEmail, setNewEmail] = useState(props.email);
  const [emailAcctStatus, setEmailAcctStatus] = useState<Status>({ kind: "idle" });
  const [deleting, setDeleting] = useState(false);

  async function requestPasswordOtp() {
    if (newPassword.length < 6) {
      setPwStatus({ kind: "error", msg: "At least 6 characters." });
      return;
    }
    setPwStep("sending");
    setPwStatus({ kind: "saving" });
    const res = await fetch("/api/admin/otp", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setPwStep("idle");
      return setPwStatus({ kind: "error", msg: data.error ?? "Could not send code." });
    }
    setPwStep("otp");
    setPwStatus({ kind: "ok", msg: "Code sent to your email ✓" });
  }

  async function changePassword() {
    if (pwOtp.trim().length !== 6) {
      setPwStatus({ kind: "error", msg: "Enter the 6-digit code." });
      return;
    }
    setPwStep("verifying");
    setPwStatus({ kind: "saving" });
    const res = await fetch("/api/admin/otp", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otp: pwOtp.trim(), newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setPwStep("otp");
      return setPwStatus({ kind: "error", msg: data.error ?? "Could not update password." });
    }
    setNewPassword("");
    setPwOtp("");
    setPwStep("idle");
    setPwStatus({ kind: "ok", msg: "Password updated ✓" });
  }

  async function changeEmail() {
    if (!newEmail.includes("@")) {
      setEmailAcctStatus({ kind: "error", msg: "Enter a valid email." });
      return;
    }
    setEmailAcctStatus({ kind: "saving" });
    const { error } = await createBrowserSupabase().auth.updateUser({
      email: newEmail,
    });
    if (error) return setEmailAcctStatus({ kind: "error", msg: error.message });
    setEmailAcctStatus({ kind: "ok", msg: "Confirm via the link sent to your new email." });
  }

  async function deleteAccount() {
    if (
      !window.confirm(
        "Delete your account permanently? This removes your saved connection + signature here. Your own Supabase project (your documents) stays under your control. This can't be undone.",
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/account", { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Could not delete account.");
      }
      await createBrowserSupabase().auth.signOut();
      router.replace("/admin/login");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not delete account.");
      setDeleting(false);
    }
  }

  const card = "rounded-2xl border border-white/10 bg-white/[0.02] p-6";
  const label = "block text-xs font-semibold uppercase tracking-wider text-white/60";
  const input =
    "mt-1.5 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-white outline-none focus:border-accent";
  const btn =
    "rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-deep disabled:opacity-50";

  return (
    <div className="space-y-6">
      {!props.connected && (
        <div className="rounded-2xl border border-accent/40 bg-accent/10 p-5 text-sm">
          <p className="font-semibold">Choose where your documents are stored to get started.</p>
          <p className="mt-1 text-white/70">
            {props.hostedAvailable
              ? "Use Studio Happens hosting (easiest), or connect your own Supabase for full control."
              : "Connect your own Supabase project — the platform never holds your files."}
          </p>
        </div>
      )}

      {/* 1 — Database connection */}
      <section className={card}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">1 · Your database (Supabase)</h2>
          {props.connected ? (
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
              Connected ✓
            </span>
          ) : (
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/60">
              Not connected
            </span>
          )}
        </div>

        {props.hostedAvailable && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode("hosted")}
              className={`rounded-xl border p-4 text-left transition ${
                mode === "hosted" ? "border-accent bg-accent/10" : "border-white/15 hover:border-white/30"
              }`}
            >
              <p className="text-sm font-semibold">Use Studio Happens hosting</p>
              <p className="mt-1 text-xs text-white/60">
                Easiest — no setup. We store your documents securely. Recommended.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setMode("byo")}
              className={`rounded-xl border p-4 text-left transition ${
                mode === "byo" ? "border-accent bg-accent/10" : "border-white/15 hover:border-white/30"
              }`}
            >
              <p className="text-sm font-semibold">Connect my own Supabase</p>
              <p className="mt-1 text-xs text-white/60">
                Bring your own database — full control, data stays in your project.
              </p>
            </button>
          </div>
        )}

        {mode === "hosted" ? (
          <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.02] p-4 text-sm">
            <p className="text-white/80">
              Your documents are stored on <strong>Studio Happens hosting</strong> —
              nothing to set up, and your data is isolated to your account.
            </p>
            {props.hostingMode === "hosted" ? (
              <p className="mt-2 text-xs font-semibold text-emerald-300">Active ✓</p>
            ) : (
              <div className="mt-3 flex items-center gap-3">
                <button onClick={enableHosted} disabled={connStatus.kind === "saving"} className={btn}>
                  {connStatus.kind === "saving" ? "Enabling…" : "Use this option"}
                </button>
                <span className="text-sm"><StatusText s={connStatus} /></span>
              </div>
            )}
          </div>
        ) : (
        <>
        <ol className="mt-4 space-y-3 text-sm text-white/80">
          <li>
            <span className="font-semibold">a.</span> Create a free, <strong>dedicated</strong>{" "}
            Supabase project at{" "}
            <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-accent underline">
              supabase.com
            </a>{" "}
            (use a separate project just for signing — the key you paste below has
            full access to whatever project it belongs to).
          </li>
          <li>
            <span className="font-semibold">b.</span> In that project →{" "}
            <strong>SQL Editor → New query</strong>, paste this and run it:
            <div className="relative mt-2">
              <pre className="max-h-48 overflow-auto rounded-lg border border-white/10 bg-black/50 p-3 text-[11px] leading-relaxed text-white/70">
                {DATA_SCHEMA_SQL}
              </pre>
              <button
                onClick={copySql}
                className="absolute right-2 top-2 rounded-md border border-white/20 bg-ink/80 px-2.5 py-1 text-xs font-semibold hover:bg-white/10"
              >
                {copied ? "Copied ✓" : "Copy"}
              </button>
            </div>
          </li>
          <li>
            <span className="font-semibold">c.</span> In{" "}
            <strong>Project Settings → API</strong>, copy the Project URL and the{" "}
            <strong>service_role</strong> key, paste below, and connect.
          </li>
        </ol>

        <div className="mt-5 space-y-4">
          <div>
            <label className={label}>Project URL</label>
            <input
              className={input}
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://xxxx.supabase.co"
            />
          </div>
          <div>
            <label className={label}>
              service_role key {props.connected && "(leave blank to keep current)"}
            </label>
            <input
              className={input}
              type="password"
              value={serviceKey}
              onChange={(e) => setServiceKey(e.target.value)}
              placeholder={props.connected ? "•••••••• stored (encrypted)" : "eyJhbGci…"}
              autoComplete="off"
            />
            <p className="mt-1 text-xs text-white/40">
              Stored encrypted (AES-256-GCM); never shown again or sent to your browser.
            </p>
          </div>
          <div>
            <label className={label}>Storage bucket</label>
            <input
              className={input}
              value={bucket}
              onChange={(e) => setBucket(e.target.value)}
              placeholder="documents"
            />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={connect} disabled={connStatus.kind === "saving"} className={btn}>
              {connStatus.kind === "saving" ? "Connecting…" : props.connected ? "Re-verify / update" : "Connect & verify"}
            </button>
            <span className="text-sm"><StatusText s={connStatus} /></span>
          </div>
        </div>
        </>
        )}
      </section>

      {/* 2 — Agency profile */}
      <section className={card}>
        <h2 className="text-lg font-semibold">2 · Agency name</h2>
        <p className="mt-1 text-sm text-white/60">Shown to your clients on the signing page and emails.</p>
        <div className="mt-4 flex items-end gap-3">
          <div className="flex-1">
            <label className={label}>Name</label>
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <button onClick={() => saveSettings({ name }, setNameStatus)} disabled={nameStatus.kind === "saving"} className={btn}>
            Save
          </button>
        </div>
        <p className="mt-2 text-sm"><StatusText s={nameStatus} /></p>
      </section>

      {/* 3 — Reusable signature */}
      <section className={card}>
        <h2 className="text-lg font-semibold">3 · Your signature (for counter-signing)</h2>
        <p className="mt-1 text-sm text-white/60">
          Draw a reusable signature. When you place an <strong>Agency signature</strong>{" "}
          field on a document, this is stamped in automatically when the client signs.
        </p>

        {savedSig && (
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-white/10 bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={savedSig} alt="Saved agency signature" className="max-h-16 object-contain" />
            <span className="text-xs font-semibold text-emerald-700">Saved</span>
          </div>
        )}

        <div className="mt-4">
          <SignaturePad ref={padRef} className="h-[160px]" />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button onClick={saveSignature} disabled={sigStatus.kind === "saving"} className={btn}>
            Save signature
          </button>
          <button
            onClick={() => padRef.current?.clear()}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/10"
          >
            Clear
          </button>
          {savedSig && (
            <button onClick={removeSignature} className="text-sm font-semibold text-accent-bright hover:underline">
              Remove saved
            </button>
          )}
          <span className="text-sm"><StatusText s={sigStatus} /></span>
        </div>
      </section>

      {/* 4 — Email (optional) */}
      <section className={card}>
        <h2 className="text-lg font-semibold">4 · Email notifications (optional)</h2>
        <p className="mt-1 text-sm text-white/60">
          To email the signed PDF automatically, add a free{" "}
          <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-accent underline">Resend</a>{" "}
          API key. Leave blank to disable.
        </p>
        <div className="mt-4 space-y-4">
          <div>
            <label className={label}>
              Resend API key {props.hasResendKey && "(leave blank to keep current)"}
            </label>
            <input
              className={input}
              type="password"
              value={resendKey}
              onChange={(e) => setResendKey(e.target.value)}
              placeholder={props.hasResendKey ? "•••••••• stored (encrypted)" : "re_…"}
              autoComplete="off"
            />
          </div>
          <div>
            <label className={label}>From address</label>
            <input
              className={input}
              value={resendFrom}
              onChange={(e) => setResendFrom(e.target.value)}
              placeholder="Acme Agency <onboarding@resend.dev>"
            />
          </div>
          <div>
            <label className={label}>Always CC (comma-separated)</label>
            <input
              className={input}
              value={alwaysCc}
              onChange={(e) => setAlwaysCc(e.target.value)}
              placeholder="you@agency.com"
            />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={saveEmail} disabled={emailStatus.kind === "saving"} className={btn}>
              Save email settings
            </button>
            <span className="text-sm"><StatusText s={emailStatus} /></span>
          </div>
        </div>
      </section>

      {/* 5 — Account */}
      <section className={card}>
        <h2 className="text-lg font-semibold">5 · Account</h2>

        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <label className={label}>New password</label>
            <input
              className={input}
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (pwStep === "otp") { setPwStep("idle"); setPwOtp(""); }
              }}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              disabled={pwStep === "otp" || pwStep === "verifying"}
            />

            {pwStep === "otp" || pwStep === "verifying" ? (
              <>
                <label className="mt-3 block text-xs font-semibold uppercase tracking-wider text-white/60">
                  Verification code (sent to your email)
                </label>
                <input
                  className="mt-1.5 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-center text-xl font-bold tracking-[0.3em] text-white outline-none focus:border-accent"
                  value={pwOtp}
                  onChange={(e) => setPwOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  autoComplete="one-time-code"
                  autoFocus
                />
                <div className="mt-2 flex items-center gap-3">
                  <button
                    onClick={changePassword}
                    disabled={pwStep === "verifying" || pwOtp.length !== 6}
                    className={btn}
                  >
                    {pwStep === "verifying" ? "Verifying…" : "Confirm change"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPwStep("idle"); setPwOtp(""); setPwStatus({ kind: "idle" }); }}
                    className="text-sm text-white/50 hover:text-white"
                  >
                    Cancel
                  </button>
                  <span className="text-sm"><StatusText s={pwStatus} /></span>
                </div>
              </>
            ) : (
              <div className="mt-2 flex items-center gap-3">
                <button
                  onClick={requestPasswordOtp}
                  disabled={pwStep === "sending"}
                  className={btn}
                >
                  {pwStep === "sending" ? "Sending code…" : "Change password"}
                </button>
                <span className="text-sm"><StatusText s={pwStatus} /></span>
              </div>
            )}
          </div>

          <div>
            <label className={label}>Email</label>
            <input
              className={input}
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <div className="mt-2 flex items-center gap-3">
              <button onClick={changeEmail} disabled={emailAcctStatus.kind === "saving"} className={btn}>
                Change email
              </button>
              <span className="text-sm"><StatusText s={emailAcctStatus} /></span>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/5 p-4">
          <p className="text-sm font-semibold text-red-300">Danger zone</p>
          <p className="mt-1 text-sm text-white/60">
            Deletes your account and your saved connection + signature here. Your
            own Supabase project (your documents) is not touched.
          </p>
          <button
            onClick={deleteAccount}
            disabled={deleting}
            className="mt-3 rounded-lg border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete my account"}
          </button>
        </div>
      </section>
    </div>
  );
}
