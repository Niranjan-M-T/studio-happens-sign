import { NextResponse } from "next/server";
import { adminAgencyContext } from "@/lib/agency";
import { downloadObject } from "@/lib/supabase";

export const runtime = "nodejs";

// Streams the original PDF to the admin editor (cookie-gated by the proxy).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await adminAgencyContext();
  if (!ctx) {
    return NextResponse.json({ error: "Connect your database first." }, { status: 400 });
  }
  const { id } = await params;
  const { data, error } = await ctx.supabase
    .from("documents")
    .select("storage_path")
    .eq("id", id)
    .single();
  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const bytes = await downloadObject(ctx.supabase, ctx.bucket, data.storage_path);
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "private, no-store",
    },
  });
}
