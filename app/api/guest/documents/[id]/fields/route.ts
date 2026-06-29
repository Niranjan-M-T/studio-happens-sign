import { NextRequest, NextResponse } from "next/server";
import { getGuestContext, GUEST_AGENCY_ID } from "@/lib/agency";
import { getGuestSession } from "@/lib/guest-session";

export const runtime = "nodejs";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionId = await getGuestSession();
  if (!sessionId) return NextResponse.json({ error: "No guest session." }, { status: 401 });

  const { id } = await params;
  const ctx = getGuestContext();

  const { data: doc } = await ctx.supabase
    .from("documents")
    .select("id, status")
    .eq("id", id)
    .eq("agency_id", GUEST_AGENCY_ID)
    .eq("guest_session_id", sessionId)
    .maybeSingle();

  if (!doc) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (doc.status === "signed") return NextResponse.json({ error: "Document is already signed." }, { status: 400 });

  const body = (await req.json().catch(() => ({}))) as {
    fields?: { page: number; type: string; x: number; y: number; width: number; height: number }[];
  };
  const fields = body.fields ?? [];

  await ctx.supabase.from("signature_fields").delete().eq("document_id", id);

  if (fields.length > 0) {
    const { error } = await ctx.supabase.from("signature_fields").insert(
      fields.map((f) => ({ document_id: id, ...f })),
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
