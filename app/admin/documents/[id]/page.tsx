import { notFound, redirect } from "next/navigation";
import { getSessionAgency, contextFor } from "@/lib/agency";
import { isConnected } from "@/lib/control";
import type { DocumentRow, FieldRow } from "@/lib/types";
import DocumentEditor from "@/components/DocumentEditor";

export const dynamic = "force-dynamic";

export default async function DocumentEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const agency = await getSessionAgency();
  if (!agency) redirect("/admin/login");
  if (!isConnected(agency)) redirect("/admin/settings");
  const ctx = contextFor(agency);

  const { id } = await params;

  let docQuery = ctx.supabase.from("documents").select("*").eq("id", id);
  if (ctx.scopeAgencyId) docQuery = docQuery.eq("agency_id", ctx.scopeAgencyId);
  const { data: doc } = await docQuery.single();
  if (!doc) notFound();
  const document = doc as DocumentRow;

  const { data: fields } = await ctx.supabase
    .from("signature_fields")
    .select("*")
    .eq("document_id", id);

  return (
    <DocumentEditor
      docId={document.id}
      agencyId={agency.id}
      initialFields={(fields ?? []) as FieldRow[]}
      initialToken={document.sign_token}
      initialStatus={document.status}
      initialNotifyEmails={document.notify_emails ?? ""}
      hasAgencySignature={!!ctx.agency.signature_png}
    />
  );
}
