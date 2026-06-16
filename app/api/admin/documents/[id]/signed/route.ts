import { NextResponse } from "next/server";
import { supabaseAdmin, downloadObject } from "@/lib/supabase";

export const runtime = "nodejs";

// Download the stamped, signed PDF.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from("documents")
    .select("title, signed_storage_path")
    .eq("id", id)
    .single();
  if (error || !data?.signed_storage_path) {
    return NextResponse.json({ error: "No signed copy yet." }, { status: 404 });
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
