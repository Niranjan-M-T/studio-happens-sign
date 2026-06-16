import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { generateSignToken } from "@/lib/tokens";

export const runtime = "nodejs";

/** Mint (or reuse) the signing token and return the shareable link. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { data: doc, error } = await supabaseAdmin
    .from("documents")
    .select("sign_token, status")
    .eq("id", id)
    .single();
  if (error || !doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let token = doc.sign_token as string | null;
  if (!token) {
    token = generateSignToken();
    const nextStatus = doc.status === "draft" ? "sent" : doc.status;
    const { error: updErr } = await supabaseAdmin
      .from("documents")
      .update({ sign_token: token, status: nextStatus })
      .eq("id", id);
    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }
  }

  const base = process.env.NEXT_PUBLIC_APP_URL?.trim() || new URL(req.url).origin;
  return NextResponse.json({ token, url: `${base}/sign/${token}` });
}
