import { NextResponse } from "next/server";
import { supabaseAdmin, downloadObject } from "@/lib/supabase";

export const runtime = "nodejs";

// Streams the original PDF to the admin editor (cookie-gated by middleware).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from("documents")
    .select("storage_path")
    .eq("id", id)
    .single();
  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const bytes = await downloadObject(data.storage_path);
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "private, no-store",
    },
  });
}
