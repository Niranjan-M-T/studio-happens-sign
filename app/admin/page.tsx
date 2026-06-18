import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import type { DocumentRow } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import UploadButton from "@/components/UploadButton";
import LogoutButton from "@/components/LogoutButton";
import DeleteButton from "@/components/DeleteButton";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const { data, error } = await supabaseAdmin
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });
  const docs = (data ?? []) as DocumentRow[];

  return (
    <main className="min-h-screen bg-ink text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
          <div>
            <h1 className="font-display text-xl tracking-tight">
              STUDIO HAPPENS
            </h1>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-accent">
              Sign · Admin
            </p>
          </div>
          <div className="flex items-center gap-5">
            <UploadButton />
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-8">
        {error && (
          <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            Couldn’t load documents: {error.message}. Check your Supabase
            environment variables and that the schema has been created.
          </p>
        )}

        {docs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-12 text-center">
            <p className="text-white/70">No documents yet.</p>
            <p className="mt-1 text-sm text-white/40">
              Upload a PDF to place a signature field and share a signing link.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10">
            {docs.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center gap-4 bg-white/[0.02] px-5 py-4"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/documents/${doc.id}`}
                    className="truncate font-semibold hover:text-accent-bright"
                  >
                    {doc.title}
                  </Link>
                  <p className="text-xs text-white/40">
                    {new Date(doc.created_at).toLocaleString()}
                    {doc.signer_name ? ` · signed by ${doc.signer_name}` : ""}
                  </p>
                </div>
                <StatusBadge status={doc.status} />
                <Link
                  href={`/admin/documents/${doc.id}`}
                  className="rounded-md border border-white/20 px-3 py-1.5 text-sm font-semibold hover:bg-white/10"
                >
                  Open
                </Link>
                {doc.status === "signed" && (
                  <a
                    href={`/api/admin/documents/${doc.id}/signed`}
                    className="rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent-deep"
                  >
                    Download
                  </a>
                )}
                <DeleteButton docId={doc.id} title={doc.title} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
