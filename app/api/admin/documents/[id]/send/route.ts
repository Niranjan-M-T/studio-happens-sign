import { NextRequest, NextResponse } from "next/server";
import { adminAgencyContext } from "@/lib/agency";
import { generateSignToken } from "@/lib/tokens";
import { objectSize } from "@/lib/supabase";
import { STORAGE_LIMIT_BYTES } from "@/lib/limits";

export const runtime = "nodejs";

const SUPER_ADMIN_EMAIL = "studiohappens26@gmail.com";

/** Mint (or reuse) the signing token and return the shareable link. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await adminAgencyContext();
  if (!ctx) {
    return NextResponse.json({ error: "Connect your database first." }, { status: 400 });
  }
  const { id } = await params;

  let sel = ctx.supabase
    .from("documents")
    .select("sign_token, status, storage_path, file_size_bytes")
    .eq("id", id);
  if (ctx.scopeAgencyId) sel = sel.eq("agency_id", ctx.scopeAgencyId);
  const { data: doc, error } = await sel.single();
  if (error || !doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let token = doc.sign_token as string | null;
  if (!token) {
    // First send = the document is finalized. Reconcile the recorded size
    // against the bytes actually uploaded (the create-time value was a
    // client estimate), then enforce the quota authoritatively.
    const trueSize = await objectSize(
      ctx.supabase,
      ctx.bucket,
      doc.storage_path as string,
    );
    if (trueSize !== null && trueSize !== (doc.file_size_bytes as number)) {
      if (ctx.agency.email !== SUPER_ADMIN_EMAIL) {
        let usageQuery = ctx.supabase
          .from("documents")
          .select("file_size_bytes")
          .neq("id", id);
        if (ctx.scopeAgencyId) usageQuery = usageQuery.eq("agency_id", ctx.scopeAgencyId);
        const { data: rows } = await usageQuery;
        const otherBytes = (rows ?? []).reduce(
          (sum: number, r: { file_size_bytes: number }) => sum + (r.file_size_bytes || 0),
          0,
        );
        if (otherBytes + trueSize > STORAGE_LIMIT_BYTES) {
          const usedMB = (otherBytes / 1024 / 1024).toFixed(1);
          return NextResponse.json(
            { error: `Storage limit reached (${usedMB} MB / 250 MB used). Delete old documents to free up space.` },
            { status: 413 },
          );
        }
      }
      await ctx.supabase
        .from("documents")
        .update({ file_size_bytes: trueSize })
        .eq("id", id);
    }

    token = generateSignToken();
    const nextStatus = doc.status === "draft" ? "sent" : doc.status;
    const { error: updErr } = await ctx.supabase
      .from("documents")
      .update({ sign_token: token, status: nextStatus })
      .eq("id", id);
    if (updErr) {
      console.error("[admin/documents/send] update failed:", updErr);
      return NextResponse.json({ error: "Could not generate the link." }, { status: 500 });
    }
  }

  // Signing links are scoped by agency id so the public page can find the
  // right database. The client rebuilds the URL from window.location.origin;
  // this default is just a fallback.
  const base = process.env.NEXT_PUBLIC_APP_URL?.trim() || new URL(req.url).origin;
  return NextResponse.json({
    token,
    agencyId: ctx.agency.id,
    url: `${base}/sign/${ctx.agency.id}/${token}`,
  });
}
