"use client";

import { useRef, useState } from "react";
import PdfPages from "./PdfPages";
import SignaturePad, { type SignaturePadHandle } from "./SignaturePad";
import type { FieldRow } from "@/lib/types";

export default function SignFlow({
  agencyId,
  token,
  title,
  agencyName,
  fields,
}: {
  agencyId: string;
  token: string;
  title: string;
  agencyName: string;
  fields: FieldRow[];
}) {
  const padRef = useRef<SignaturePadHandle>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [showSigModal, setShowSigModal] = useState(false);
  const [capturedSig, setCapturedSig] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSigDone() {
    // Store the PNG before the modal unmounts the canvas
    if (padRef.current && !padRef.current.isEmpty()) {
      setCapturedSig(padRef.current.toPng());
    }
    setShowSigModal(false);
    // Synchronous focus in click handler → mobile keyboard appears on iOS/Android
    nameInputRef.current?.focus();
  }

  async function submit() {
    setError(null);
    if (!capturedSig) {
      setError("Please draw your signature.");
      return;
    }
    if (name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (!consent) {
      setError("Please tick the consent box to continue.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/sign/${agencyId}/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          consent,
          signature: capturedSig,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not submit. Please try again.");
      }
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center text-ink">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
          ✓
        </div>
        <h1 className="mt-5 font-display text-2xl tracking-tight">All done</h1>
        <p className="mt-2 max-w-sm text-sm text-ink/60">
          Thanks, {name.trim()}. Your signature has been recorded for{" "}
          <span className="font-semibold">{title}</span>.
        </p>
        <a
          href={`/api/sign/${agencyId}/${token}/signed`}
          download
          className="mt-6 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white glow-accent"
        >
          Download signed PDF
        </a>
        <p className="mt-3 text-sm text-ink/40">You can close this page.</p>
        <p className="mt-8 text-xs uppercase tracking-[0.3em] text-accent">
          {agencyName}
        </p>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-paper text-ink">
        {/* Header */}
        <header className="border-b border-black/10 bg-white px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-accent">
            {agencyName}
          </p>
          <h1 className="mt-1 text-lg font-semibold">{title}</h1>
          <p className="text-sm text-ink/60">
            Please review the document, then sign below.
          </p>
        </header>

        {/* Document */}
        <section className="bg-zinc-100 px-3 py-5">
          <PdfPages
            url={`/api/sign/${agencyId}/${token}/pdf`}
            maxWidth={680}
            renderOverlay={(pageIndex) => (
              <>
                {fields
                  .filter((f) => f.page === pageIndex)
                  .map((f) => (
                    <div
                      key={f.id}
                      className="absolute rounded-sm border-2 border-dashed border-accent/70 bg-accent/5"
                      style={{
                        left: `${f.x * 100}%`,
                        top: `${f.y * 100}%`,
                        width: `${f.width * 100}%`,
                        height: `${f.height * 100}%`,
                      }}
                    />
                  ))}
              </>
            )}
          />
        </section>

        {/* Sign panel */}
        <section className="mx-auto max-w-md px-4 py-6">
          {/* Step 1 — Signature (opens modal) */}
          <label className="block text-sm font-semibold">
            Draw your signature
          </label>
          <button
            type="button"
            onClick={() => setShowSigModal(true)}
            className="mt-1.5 flex min-h-[88px] w-full items-center justify-center rounded-lg border-2 border-dashed border-black/20 bg-white transition hover:border-accent/50 active:bg-zinc-50"
          >
            {capturedSig ? (
              <img
                src={capturedSig}
                alt="Your signature preview"
                className="max-h-16 object-contain"
              />
            ) : (
              <span className="text-sm text-ink/40">
                Tap to draw your signature
              </span>
            )}
          </button>
          {capturedSig && (
            <button
              type="button"
              onClick={() => setShowSigModal(true)}
              className="mt-1 text-xs font-semibold text-accent"
            >
              Redraw
            </button>
          )}

          {/* Step 2 — Full name (auto-focused after modal Done) */}
          <div className="mt-5">
            <label className="block text-sm font-semibold">Your full name</label>
            <input
              ref={nameInputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jane Smith"
              autoComplete="name"
              className="mt-1.5 w-full rounded-lg border border-black/15 px-3 py-2.5 outline-none focus:border-accent"
            />
          </div>

          {/* Consent */}
          <label className="mt-4 flex items-start gap-2.5 text-sm text-ink/80">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#fc2265]"
            />
            <span>
              I agree that this is my electronic signature and is legally
              binding.
            </span>
          </label>

          {error && (
            <p className="mt-3 text-sm font-medium text-accent">{error}</p>
          )}

          <button
            onClick={submit}
            disabled={submitting}
            className="mt-5 w-full rounded-lg bg-accent py-3 font-semibold text-white transition hover:bg-accent-deep disabled:opacity-50 glow-accent"
          >
            {submitting ? "Submitting…" : "Sign & Submit"}
          </button>
        </section>
      </main>

      {/* Full-screen signature modal — renders on top of everything */}
      {showSigModal && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-white"
          style={{
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          {/* Modal header */}
          <div className="flex items-center justify-between border-b border-black/10 px-4 py-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-accent">
                Signature
              </p>
              <p className="text-base font-semibold text-ink">
                Draw with your finger
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => padRef.current?.clear()}
                className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold text-ink"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setShowSigModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/15 text-ink/50"
                aria-label="Cancel"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Canvas fills all remaining space — min-h-0 prevents flex overflow */}
          <div className="flex min-h-0 flex-1 flex-col p-4">
            <SignaturePad ref={padRef} className="flex-1 min-h-0" />
          </div>

          {/* Done button */}
          <div className="border-t border-black/10 px-4 py-4">
            <button
              type="button"
              onClick={handleSigDone}
              className="w-full rounded-lg bg-accent py-3.5 font-semibold text-white glow-accent"
            >
              Done — use this signature
            </button>
          </div>
        </div>
      )}
    </>
  );
}
