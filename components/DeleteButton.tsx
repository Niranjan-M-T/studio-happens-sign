"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteButton({
  docId,
  title,
}: {
  docId: string;
  title: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (
      !window.confirm(
        `Delete “${title}”? This permanently removes the document, its signed copy, and all placed fields. This can't be undone.`,
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/documents/${docId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not delete.");
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not delete.");
      setBusy(false);
    }
  }

  return (
    <button
      onClick={remove}
      disabled={busy}
      className="rounded-md border border-red-500/40 px-3 py-1.5 text-sm font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-50"
      aria-label={`Delete ${title}`}
    >
      {busy ? "Deleting…" : "Delete"}
    </button>
  );
}
