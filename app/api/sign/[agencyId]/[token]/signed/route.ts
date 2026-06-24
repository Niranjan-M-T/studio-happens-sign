import { NextResponse } from "next/server";
import { getAgencyContext } from "@/lib/agency";
import { downloadObject } from "@/lib/supabase";

export const runtime = "nodejs";

// Lets the signer download their own signed copy, gated by the same token.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ agencyId: string; token: string }> },
) {
  const { agencyId, token } = await params;
  const ctx = await getAgencyContext(agencyId);
  if (!ctx) {
    return NextResponse.json({ error: "Not signed yet." }, { status: 404 });
  }
  const { data, error } = await ctx.supabase
    .from("documents")
    .select("title, signed_storage_path")
    .eq("sign_token", token)
    .single();
  if (error || !data?.signed_storage_path) {
    return NextResponse.json({ error: "Not signed yet." }, { status: 404 });
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
