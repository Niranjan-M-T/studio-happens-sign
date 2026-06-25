import { NextResponse } from "next/server";
import { getAgencyContext } from "@/lib/agency";
import { downloadObject } from "@/lib/supabase";

export const runtime = "nodejs";

// Streams the original PDF to the (public) signing page, gated by the token.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ agencyId: string; token: string }> },
) {
  const { agencyId, token } = await params;
  const ctx = await getAgencyContext(agencyId);
  if (!ctx) {
    return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  }
  let sel = ctx.supabase.from("documents").select("storage_path").eq("sign_token", token);
  if (ctx.scopeAgencyId) sel = sel.eq("agency_id", ctx.scopeAgencyId);
  const { data, error } = await sel.single();
  if (error || !data) {
    return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  }

  const bytes = await downloadObject(ctx.supabase, ctx.bucket, data.storage_path);
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "private, no-store",
    },
  });
}
