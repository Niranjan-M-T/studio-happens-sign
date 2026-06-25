import { NextResponse } from "next/server";
import { adminAgencyContext } from "@/lib/agency";
import { removeObjects } from "@/lib/supabase";

export const runtime = "nodejs";

/** Delete a document: its stored PDFs, fields (cascade), and the row. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await adminAgencyContext();
  if (!ctx) {
    return NextResponse.json({ error: "Connect your database first." }, { status: 400 });
  }
  const { id } = await params;

  let sel = ctx.supabase
    .from("documents")
    .select("storage_path, signed_storage_path")
    .eq("id", id);
  if (ctx.scopeAgencyId) sel = sel.eq("agency_id", ctx.scopeAgencyId);
  const { data: doc, error } = await sel.single();
  if (error || !doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Best-effort storage cleanup; don't block the row delete if it fails.
  try {
    await removeObjects(
      ctx.supabase,
      ctx.bucket,
      [doc.storage_path, doc.signed_storage_path].filter(
        (p): p is string => typeof p === "string" && p.length > 0,
      ),
    );
  } catch (err) {
    console.error("[delete] storage cleanup failed:", err);
  }

  // signature_fields rows are removed by the ON DELETE CASCADE foreign key.
  let del = ctx.supabase.from("documents").delete().eq("id", id);
  if (ctx.scopeAgencyId) del = del.eq("agency_id", ctx.scopeAgencyId);
  const { error: delErr } = await del;
  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
