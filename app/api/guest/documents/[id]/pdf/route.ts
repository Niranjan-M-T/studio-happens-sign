import { NextRequest, NextResponse } from "next/server";
import { getGuestContext, GUEST_AGENCY_ID } from "@/lib/agency";
import { getGuestSession } from "@/lib/guest-session";
import { downloadObject } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionId = await getGuestSession();
  if (!sessionId) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const ctx = getGuestContext();

  const { data: doc } = await ctx.supabase
    .from("documents")
    .select("storage_path")
    .eq("id", id)
    .eq("agency_id", GUEST_AGENCY_ID)
    .eq("guest_session_id", sessionId)
    .maybeSingle();

  if (!doc) return new NextResponse("Not found", { status: 404 });

  const bytes = await downloadObject(ctx.supabase, ctx.bucket, doc.storage_path);
  return new NextResponse(bytes, {
    headers: { "Content-Type": "application/pdf" },
  });
}
