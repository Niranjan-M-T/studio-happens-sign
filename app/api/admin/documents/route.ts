import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin, BUCKET } from "@/lib/supabase";

export const runtime = "nodejs";

/**
 * Create a document row and hand back a short-lived signed upload URL so
 * the browser can PUT the PDF straight to Supabase Storage (keeping large
 * files off the serverless function).
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    title?: string;
    numPages?: number;
  };
  const title = (body.title?.trim() || "Untitled document").slice(0, 200);
  const numPages =
    typeof body.numPages === "number" && Number.isFinite(body.numPages)
      ? Math.max(1, Math.floor(body.numPages))
      : 1;

  const id = randomUUID();
  const path = `originals/${id}.pdf`;

  const { error: insErr } = await supabaseAdmin.from("documents").insert({
    id,
    title,
    storage_path: path,
    num_pages: numPages,
    status: "draft",
  });
  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  const { data, error: urlErr } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUploadUrl(path);
  if (urlErr || !data) {
    return NextResponse.json(
      { error: urlErr?.message ?? "Could not create upload URL." },
      { status: 500 },
    );
  }

  return NextResponse.json({ id, signedUrl: data.signedUrl });
}
