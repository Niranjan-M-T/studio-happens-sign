import { NextResponse } from "next/server";
import { supabaseAdmin, downloadObject } from "@/lib/supabase";

export const runtime = "nodejs";

// Lets the signer download their own signed copy, gated by the same token.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const { data, error } = await supabaseAdmin
    .from("documents")
    .select("title, signed_storage_path")
    .eq("sign_token", token)
    .single();
  if (error || !data?.signed_storage_path) {
    return NextResponse.json({ error: "Not signed yet." }, { status: 404 });
  }

  const bytes = await downloadObject(data.signed_storage_path);
  const safeName = (data.title || "document").replace(/[^a-z0-9-_ ]/gi, "_");
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName} (signed).pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
