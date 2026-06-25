import { NextResponse } from "next/server";
import { adminAgencyContext } from "@/lib/agency";
import { downloadObject } from "@/lib/supabase";

export const runtime = "nodejs";

// Download the stamped, signed PDF.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await adminAgencyContext();
  if (!ctx) {
    return NextResponse.json({ error: "Connect your database first." }, { status: 400 });
  }
  const { id } = await params;
  let sel = ctx.supabase.from("documents").select("title, signed_storage_path").eq("id", id);
  if (ctx.scopeAgencyId) sel = sel.eq("agency_id", ctx.scopeAgencyId);
  const { data, error } = await sel.single();
  if (error || !data?.signed_storage_path) {
    return NextResponse.json({ error: "No signed copy yet." }, { status: 404 });
  }

  const bytes = await downloadObject(ctx.supabase, ctx.bucket, data.signed_storage_path);
  const safeName = (data.title || "document").replace(/[^a-z0-9-_ ]/gi, "_");
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName} (signed).pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
