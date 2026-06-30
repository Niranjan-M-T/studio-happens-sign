import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { adminAgencyContext, pathPrefix } from "@/lib/agency";
import { MAX_FILE_BYTES, STORAGE_LIMIT_BYTES } from "@/lib/limits";

export const runtime = "nodejs";

const SUPER_ADMIN_EMAIL = "studiohappens26@gmail.com";

/**
 * Create a document row and hand back a short-lived signed upload URL so
 * the browser can PUT the PDF straight to the agency's Supabase Storage.
 * Enforces a 250 MB storage quota per agency (skipped for super admin).
 */
export async function POST(req: NextRequest) {
  const ctx = await adminAgencyContext();
  if (!ctx) {
    return NextResponse.json({ error: "Connect your database first." }, { status: 400 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    title?: string;
    numPages?: number;
    fileSizeBytes?: number;
  };
  const title = (body.title?.trim() || "Untitled document").slice(0, 200);
  const numPages =
    typeof body.numPages === "number" && Number.isFinite(body.numPages)
      ? Math.max(1, Math.floor(body.numPages))
      : 1;
  // The client reports an estimated size for an early quota check, but it
  // can't be trusted (the PDF is PUT straight to storage via a signed URL).
  // Clamp it to the per-file cap here; the TRUE size is reconciled from
  // storage when the document is sent (see the send route). The bucket's
  // fileSizeLimit is the hard enforcement that a lying client can't bypass.
  const claimedBytes =
    typeof body.fileSizeBytes === "number" && Number.isFinite(body.fileSizeBytes)
      ? Math.max(0, Math.floor(body.fileSizeBytes))
      : 0;
  if (claimedBytes > MAX_FILE_BYTES) {
    const maxMB = Math.round(MAX_FILE_BYTES / 1024 / 1024);
    return NextResponse.json(
      { error: `That file is too large. The limit is ${maxMB} MB per document.` },
      { status: 413 },
    );
  }
  const fileSizeBytes = Math.min(claimedBytes, MAX_FILE_BYTES);

  // Enforce storage quota for non-super-admin agencies.
  if (ctx.agency.email !== SUPER_ADMIN_EMAIL) {
    let usageQuery = ctx.supabase.from("documents").select("file_size_bytes");
    if (ctx.scopeAgencyId) usageQuery = usageQuery.eq("agency_id", ctx.scopeAgencyId);
    const { data: rows } = await usageQuery;
    const usedBytes = (rows ?? []).reduce(
      (sum: number, r: { file_size_bytes: number }) => sum + (r.file_size_bytes || 0),
      0,
    );
    if (usedBytes + fileSizeBytes > STORAGE_LIMIT_BYTES) {
      const usedMB = (usedBytes / 1024 / 1024).toFixed(1);
      return NextResponse.json(
        { error: `Storage limit reached (${usedMB} MB / 250 MB used). Delete old documents to free up space.` },
        { status: 413 },
      );
    }
  }

  const id = randomUUID();
  const path = `${pathPrefix(ctx)}originals/${id}.pdf`;

  const { error: insErr } = await ctx.supabase.from("documents").insert({
    id,
    agency_id: ctx.scopeAgencyId,
    title,
    storage_path: path,
    num_pages: numPages,
    file_size_bytes: fileSizeBytes,
    status: "draft",
  });
  if (insErr) {
    console.error("[admin/documents] insert failed:", insErr);
    return NextResponse.json({ error: "Could not create the document." }, { status: 500 });
  }

  const { data, error: urlErr } = await ctx.supabase.storage
    .from(ctx.bucket)
    .createSignedUploadUrl(path);
  if (urlErr || !data) {
    console.error("[admin/documents] signed URL failed:", urlErr);
    return NextResponse.json(
      { error: "Could not create upload URL." },
      { status: 500 },
    );
  }

  return NextResponse.json({ id, signedUrl: data.signedUrl });
}
