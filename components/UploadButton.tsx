"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Please choose a PDF file.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      // Count pages client-side (file stays intact for upload).
      const buf = await file.arrayBuffer();
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      const doc = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
      const numPages = doc.numPages;

      const title = file.name.replace(/\.pdf$/i, "");
      const res = await fetch("/api/admin/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, numPages, fileSizeBytes: file.size }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not create document.");
      }
      const { id, signedUrl } = (await res.json()) as {
        id: string;
        signedUrl: string;
      };

      // Upload the file straight to Supabase Storage via the signed URL.
      const up = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/pdf" },
        body: file,
      });
      if (!up.ok) throw new Error("Upload failed.");

      router.push(`/admin/documents/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={onFile}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-deep disabled:opacity-50"
      >
        {busy ? "Uploading…" : "Upload document"}
      </button>
      {error && <p className="text-xs text-accent-bright">{error}</p>}
    </div>
  );
}
