import { NextResponse } from "next/server";
import { supabaseAdmin, downloadObject } from "@/lib/supabase";

export const runtime = "nodejs";

// Streams the original PDF to the (public) signing page, gated by the token.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const { data, error } = await supabaseAdmin
    .from("documents")
    .select("storage_path")
    .eq("sign_token", token)
    .single();
  if (error || !data) {
    return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  }

  const bytes = await downloadObject(data.storage_path);
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "private, no-store",
    },
  });
}
