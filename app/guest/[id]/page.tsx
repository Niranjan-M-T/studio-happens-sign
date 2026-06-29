import { notFound } from "next/navigation";
import { getGuestContext, GUEST_AGENCY_ID } from "@/lib/agency";
import { getGuestSession } from "@/lib/guest-session";
import type { DocumentRow, FieldRow } from "@/lib/types";
import DocumentEditor from "@/components/DocumentEditor";

export const dynamic = "force-dynamic";

export default async function GuestEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sessionId = await getGuestSession();
  if (!sessionId) notFound();

  const { id } = await params;
  const ctx = getGuestContext();

  const { data: doc } = await ctx.supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .eq("agency_id", GUEST_AGENCY_ID)
    .eq("guest_session_id", sessionId)
    .maybeSingle();

  if (!doc) notFound();
  const document = doc as DocumentRow;

  const { data: fields } = await ctx.supabase
    .from("signature_fields")
    .select("*")
    .eq("document_id", id);

  return (
    <DocumentEditor
      docId={document.id}
      agencyId={GUEST_AGENCY_ID}
      initialFields={(fields ?? []) as FieldRow[]}
      initialToken={document.sign_token}
      initialStatus={document.status}
      initialNotifyEmails={document.notify_emails ?? ""}
      hasAgencySignature={false}
      apiBase="/api/guest/documents"
    />
  );
}
