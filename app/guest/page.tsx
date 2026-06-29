"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function GuestUploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (!file.type.includes("pdf")) {
      setError("Please pick a PDF file.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      // 1. Create the document record + get upload URL
      const createRes = await fetch("/api/guest/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: file.name.replace(/\.pdf$/i, ""), numPages: 1 }),
      });
      const create = await createRes.json();
      if (!createRes.ok) throw new Error(create.error ?? "Could not start upload.");

      // 2. Upload the PDF directly to storage
      const uploadRes = await fetch(create.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/pdf" },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("Upload failed. Try again.");

      // 3. Redirect to the field-placement editor
      router.push(`/guest/${create.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <main className="flex min-h-screen flex-col bg-ink text-white">
      <nav className="border-b border-white/10">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link href="/" className="font-display text-lg tracking-tight hover:opacity-80">
            STUDIO HAPPENS <span className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Sign</span>
          </Link>
          <Link
            href="/admin/signup"
            className="text-sm font-semibold text-white/60 hover:text-white"
          >
            Create free account
          </Link>
        </div>
      </nav>

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-5 py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent">
          No account needed
        </p>
        <h1 className="mt-3 font-display text-3xl tracking-tight">
          Upload your PDF
        </h1>
        <p className="mt-2 text-white/60">
          Drag it in or click to pick a file. You'll place signature fields on
          the next screen, then share the link with whoever needs to sign.
        </p>

        <div
          className={`mt-8 w-full cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition ${
            dragging
              ? "border-accent bg-accent/10"
              : "border-white/20 hover:border-white/40 hover:bg-white/[0.03]"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          {uploading ? (
            <p className="text-white/60">Uploading...</p>
          ) : (
            <>
              <p className="font-semibold">Drop your PDF here</p>
              <p className="mt-1 text-sm text-white/50">or click to browse</p>
            </>
          )}
        </div>

        {error && (
          <p className="mt-4 text-sm text-accent-bright">{error}</p>
        )}

        <p className="mt-6 text-xs text-white/30">
          Documents are stored for 30 days then auto-deleted. No account needed.
        </p>
      </div>
    </main>
  );
}
