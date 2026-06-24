import { notFound, redirect } from "next/navigation";
import { getSessionAgencyId } from "@/lib/session";
import { getAgencyContext } from "@/lib/agency";
import type { DocumentRow, FieldRow } from "@/lib/types";
import DocumentEditor from "@/components/DocumentEditor";

export const dynamic = "force-dynamic";

export default async function DocumentEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const agencyId = await getSessionAgencyId();
  if (!agencyId) redirect("/admin/login");
  const ctx = await getAgencyContext(agencyId);
  if (!ctx) redirect("/admin/settings");

  const { id } = await params;

  const { data: doc } = await ctx.supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .single();
  if (!doc) notFound();
  const document = doc as DocumentRow;

  const { data: fields } = await ctx.supabase
    .from("signature_fields")
    .select("*")
    .eq("document_id", id);

  return (
    <DocumentEditor
      docId={document.id}
      agencyId={agencyId}
      initialFields={(fields ?? []) as FieldRow[]}
      initialToken={document.sign_token}
      initialStatus={document.status}
      initialNotifyEmails={document.notify_emails ?? ""}
      hasAgencySignature={!!ctx.agency.signature_png}
    />
  );
}
