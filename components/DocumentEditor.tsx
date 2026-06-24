"use client";

import { useState } from "react";
import PdfPages, { type PageSize } from "./PdfPages";
import type { DocStatus, FieldRow, FieldType } from "@/lib/types";

interface EditorField {
  key: string;
  page: number;
  type: FieldType;
  x: number;
  y: number;
  width: number;
  height: number;
}

const DEFAULT_SIZE: Record<FieldType, { width: number; height: number }> = {
  signature: { width: 0.3, height: 0.1 },
  name: { width: 0.3, height: 0.05 },
  date: { width: 0.2, height: 0.04 },
  agency_sig: { width: 0.3, height: 0.1 },
};

const TYPE_LABEL: Record<FieldType, string> = {
  signature: "Signature",
  name: "Name",
  date: "Date",
  agency_sig: "Agency signature",
};

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

export default function DocumentEditor({
  docId,
  agencyId,
  initialFields,
  initialToken,
  initialStatus,
  initialNotifyEmails,
  hasAgencySignature,
}: {
  docId: string;
  agencyId: string;
  initialFields: FieldRow[];
  initialToken: string | null;
  initialStatus: DocStatus;
  initialNotifyEmails: string;
  hasAgencySignature: boolean;
}) {
  const locked = initialStatus === "signed";
  const [fields, setFields] = useState<EditorField[]>(
    initialFields.map((f) => ({
      key: f.id,
      page: f.page,
      type: f.type,
      x: f.x,
      y: f.y,
      width: f.width,
      height: f.height,
    })),
  );
  const [armed, setArmed] = useState<FieldType | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [token, setToken] = useState<string | null>(initialToken);
  const [shareUrl, setShareUrl] = useState<string | null>(
    initialToken ? `${origin()}/sign/${agencyId}/${initialToken}` : null,
  );
  const [linkBusy, setLinkBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifyEmails, setNotifyEmails] = useState(initialNotifyEmails);
  const [notifySaving, setNotifySaving] = useState(false);
  const [notifySaved, setNotifySaved] = useState(true);

  function origin() {
    return typeof window !== "undefined" ? window.location.origin : "";
  }

  function addField(pageIndex: number, nx: number, ny: number) {
    if (!armed || locked) return;
    const size = DEFAULT_SIZE[armed];
    const x = clamp(nx - size.width / 2, 0, 1 - size.width);
    const y = clamp(ny - size.height / 2, 0, 1 - size.height);
    setFields((prev) => [
      ...prev,
      { key: crypto.randomUUID(), page: pageIndex, type: armed, x, y, ...size },
    ]);
    setArmed(null);
    setSaved(false);
  }

  function updateField(key: string, patch: Partial<EditorField>) {
    setFields((prev) =>
      prev.map((f) => (f.key === key ? { ...f, ...patch } : f)),
    );
    setSaved(false);
  }

  function removeField(key: string) {
    setFields((prev) => prev.filter((f) => f.key !== key));
    setSaved(false);
  }

  async function saveFields(): Promise<boolean> {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/documents/${docId}/fields`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: fields.map(({ page, type, x, y, width, height }) => ({
            page,
            type,
            x,
            y,
            width,
            height,
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not save.");
      }
      setSaved(true);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveNotifyEmails(): Promise<boolean> {
    setNotifySaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/documents/${docId}/notify`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: notifyEmails }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not save notify emails.");
      }
      setNotifySaved(true);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save notify emails.");
      return false;
    } finally {
      setNotifySaving(false);
    }
  }

  async function generateLink() {
    setLinkBusy(true);
    setError(null);
    try {
      const ok = await saveFields();
      if (!ok) return;
      const okNotify = await saveNotifyEmails();
      if (!okNotify) return;
      const res = await fetch(`/api/admin/documents/${docId}/send`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not generate link.");
      }
      const data = (await res.json()) as { token: string; url: string };
      setToken(data.token);
      // Build from the live browser origin, not the server's returned URL —
      // that fallback can resolve to Render's internal host (localhost:10000)
      // when NEXT_PUBLIC_APP_URL isn't inlined at build time.
      setShareUrl(`${origin()}/sign/${agencyId}/${data.token}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate link.");
    } finally {
      setLinkBusy(false);
    }
  }

  async function copyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-900 text-white">
      {/* Toolbar */}
      <div className="sticky top-0 z-20 border-b border-white/10 bg-ink/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3">
          <a
            href="/admin"
            className="text-sm font-semibold text-white/60 hover:text-white"
          >
            ← Dashboard
          </a>

          {!locked && (
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-white/40">
                Add field:
              </span>
              {(["signature", "name", "date", "agency_sig"] as FieldType[]).map((t) => {
                const disabled = t === "agency_sig" && !hasAgencySignature;
                return (
                  <button
                    key={t}
                    onClick={() => setArmed((cur) => (cur === t ? null : t))}
                    disabled={disabled}
                    title={
                      disabled
                        ? "Save a reusable signature in Settings first"
                        : undefined
                    }
                    className={`rounded-md px-3 py-1.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                      armed === t
                        ? "bg-accent text-white"
                        : "bg-white/10 text-white/80 hover:bg-white/20"
                    }`}
                  >
                    {TYPE_LABEL[t]}
                  </button>
                );
              })}
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
            {!locked && (
              <button
                onClick={saveFields}
                disabled={saving}
                className="rounded-md border border-white/20 px-3 py-1.5 text-sm font-semibold hover:bg-white/10 disabled:opacity-50"
              >
                {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
              </button>
            )}
            {!token ? (
              <button
                onClick={generateLink}
                disabled={linkBusy || locked}
                className="rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent-deep disabled:opacity-50"
              >
                {linkBusy ? "Generating…" : "Generate signing link"}
              </button>
            ) : (
              <button
                onClick={copyLink}
                className="rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent-deep"
              >
                {copied ? "Copied ✓" : "Copy link"}
              </button>
            )}
          </div>
        </div>

        {!locked && (
          <div className="mx-auto max-w-5xl px-4 pb-3">
            <label className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wider text-white/40">
              Notify by email when signed
              {notifySaving && <span>· Saving…</span>}
              {!notifySaving && notifySaved && <span className="text-emerald-300">· Saved ✓</span>}
            </label>
            <input
              value={notifyEmails}
              onChange={(e) => {
                setNotifyEmails(e.target.value);
                setNotifySaved(false);
              }}
              onBlur={saveNotifyEmails}
              placeholder="you@studiohappens.tech, partner@studiohappens.tech"
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/30"
            />
          </div>
        )}

        {shareUrl && (
          <div className="mx-auto max-w-5xl px-4 pb-3">
            <input
              readOnly
              value={shareUrl}
              onFocus={(e) => e.currentTarget.select()}
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-white/80"
            />
          </div>
        )}
        {error && (
          <div className="mx-auto max-w-5xl px-4 pb-3 text-sm text-accent-bright">
            {error}
          </div>
        )}
        {armed && (
          <div className="mx-auto max-w-5xl px-4 pb-3 text-xs text-white/60">
            Tap anywhere on the page to drop the {TYPE_LABEL[armed]} field.
          </div>
        )}
        {locked && (
          <div className="mx-auto max-w-5xl px-4 pb-3 text-xs text-emerald-300">
            This document has been signed — fields are locked.
          </div>
        )}
      </div>

      {/* Document */}
      <div className="flex-1 overflow-auto px-4 py-6">
        <div className="mx-auto max-w-3xl">
          <PdfPages
            url={`/api/admin/documents/${docId}/pdf`}
            maxWidth={760}
            renderOverlay={(pageIndex, size) => (
              <Overlay
                pageIndex={pageIndex}
                size={size}
                armed={!!armed && !locked}
                fields={fields.filter((f) => f.page === pageIndex)}
                onAdd={addField}
                onChange={updateField}
                onRemove={removeField}
                locked={locked}
              />
            )}
          />
        </div>
      </div>
    </div>
  );
}

function Overlay({
  pageIndex,
  size,
  armed,
  fields,
  onAdd,
  onChange,
  onRemove,
  locked,
}: {
  pageIndex: number;
  size: PageSize;
  armed: boolean;
  fields: EditorField[];
  onAdd: (pageIndex: number, nx: number, ny: number) => void;
  onChange: (key: string, patch: Partial<EditorField>) => void;
  onRemove: (key: string) => void;
  locked: boolean;
}) {
  return (
    <div
      className="absolute inset-0"
      style={{ cursor: armed ? "crosshair" : "default" }}
      onPointerDown={(e) => {
        if (!armed || e.target !== e.currentTarget) return;
        const rect = e.currentTarget.getBoundingClientRect();
        onAdd(
          pageIndex,
          (e.clientX - rect.left) / rect.width,
          (e.clientY - rect.top) / rect.height,
        );
      }}
    >
      {fields.map((f) => (
        <FieldBox
          key={f.key}
          field={f}
          pageWidth={size.width}
          pageHeight={size.height}
          locked={locked}
          onChange={(patch) => onChange(f.key, patch)}
          onRemove={() => onRemove(f.key)}
        />
      ))}
    </div>
  );
}

function FieldBox({
  field,
  pageWidth,
  pageHeight,
  locked,
  onChange,
  onRemove,
}: {
  field: EditorField;
  pageWidth: number;
  pageHeight: number;
  locked: boolean;
  onChange: (patch: Partial<EditorField>) => void;
  onRemove: () => void;
}) {
  function startDrag(e: React.PointerEvent, mode: "move" | "resize") {
    if (locked) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const startX = e.clientX;
    const startY = e.clientY;
    const { x, y, width, height } = field;

    function onMove(ev: PointerEvent) {
      const dx = (ev.clientX - startX) / pageWidth;
      const dy = (ev.clientY - startY) / pageHeight;
      if (mode === "move") {
        onChange({
          x: clamp(x + dx, 0, 1 - width),
          y: clamp(y + dy, 0, 1 - height),
        });
      } else {
        onChange({
          width: clamp(width + dx, 0.05, 1 - x),
          height: clamp(height + dy, 0.02, 1 - y),
        });
      }
    }
    function onUp(ev: PointerEvent) {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      void ev;
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  return (
    <div
      className="absolute flex items-center justify-center rounded-sm border-2 border-dashed border-accent bg-accent/10 text-[10px] font-semibold uppercase tracking-wider text-accent-deep"
      style={{
        left: `${field.x * 100}%`,
        top: `${field.y * 100}%`,
        width: `${field.width * 100}%`,
        height: `${field.height * 100}%`,
        cursor: locked ? "default" : "move",
        touchAction: "none",
      }}
      onPointerDown={(e) => startDrag(e, "move")}
    >
      {TYPE_LABEL[field.type]}

      {!locked && (
        <>
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onRemove();
            }}
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs text-white shadow"
            aria-label="Remove field"
          >
            ×
          </button>
          <div
            onPointerDown={(e) => startDrag(e, "resize")}
            className="absolute -bottom-1.5 -right-1.5 h-3.5 w-3.5 cursor-se-resize rounded-sm bg-accent"
          />
        </>
      )}
    </div>
  );
}
