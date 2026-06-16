import { supabaseAdmin } from "@/lib/supabase";
import type { DocumentRow, FieldRow } from "@/lib/types";
import SignFlow from "@/components/SignFlow";

export const dynamic = "force-dynamic";

function Notice({
  title,
  body,
  downloadToken,
}: {
  title: string;
  body: string;
  downloadToken?: string;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center text-ink">
      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-accent">
        Studio Happens
      </p>
      <h1 className="mt-3 font-display text-2xl tracking-tight">{title}</h1>
      <p className="mt-2 max-w-sm text-sm text-ink/60">{body}</p>
      {downloadToken && (
        <a
          href={`/api/sign/${downloadToken}/signed`}
          download
          className="mt-6 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white glow-accent"
        >
          Download signed PDF
        </a>
      )}
    </main>
  );
}

export default async function SignPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const { data: doc } = await supabaseAdmin
    .from("documents")
    .select("*")
    .eq("sign_token", token)
    .single();

  if (!doc) {
    return (
      <Notice
        title="Link not found"
        body="This signing link is invalid or has expired. Please ask for a new link."
      />
    );
  }
  const document = doc as DocumentRow;

  if (document.status === "signed") {
    return (
      <Notice
        title="Already signed"
        body={`“${document.title}” has already been signed. Thank you!`}
        downloadToken={token}
      />
    );
  }

  // First open → mark as viewed.
  if (document.status === "sent") {
    await supabaseAdmin
      .from("documents")
      .update({ status: "viewed", viewed_at: new Date().toISOString() })
      .eq("id", document.id);
  }

  const { data: fields } = await supabaseAdmin
    .from("signature_fields")
    .select("*")
    .eq("document_id", document.id);

  return (
    <SignFlow
      token={token}
      title={document.title}
      fields={(fields ?? []) as FieldRow[]}
    />
  );
}
