import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import type { DocumentRow, FieldRow } from "@/lib/types";
import DocumentEditor from "@/components/DocumentEditor";

export const dynamic = "force-dynamic";

export default async function DocumentEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: doc } = await supabaseAdmin
    .from("documents")
    .select("*")
    .eq("id", id)
    .single();
  if (!doc) notFound();
  const document = doc as DocumentRow;

  const { data: fields } = await supabaseAdmin
    .from("signature_fields")
    .select("*")
    .eq("document_id", id);

  return (
    <DocumentEditor
      docId={document.id}
      initialFields={(fields ?? []) as FieldRow[]}
      initialToken={document.sign_token}
      initialStatus={document.status}
    />
  );
}
