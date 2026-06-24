import { NextRequest, NextResponse } from "next/server";
import { adminAgencyContext } from "@/lib/agency";
import { generateSignToken } from "@/lib/tokens";

export const runtime = "nodejs";

/** Mint (or reuse) the signing token and return the shareable link. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await adminAgencyContext();
  if (!ctx) {
    return NextResponse.json({ error: "Connect your database first." }, { status: 400 });
  }
  const { id } = await params;

  const { data: doc, error } = await ctx.supabase
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
    const { error: updErr } = await ctx.supabase
      .from("documents")
      .update({ sign_token: token, status: nextStatus })
      .eq("id", id);
    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }
  }

  // Signing links are scoped by agency id so the public page can find the
  // right database. The client rebuilds the URL from window.location.origin;
  // this default is just a fallback.
  const base = process.env.NEXT_PUBLIC_APP_URL?.trim() || new URL(req.url).origin;
  return NextResponse.json({
    token,
    agencyId: ctx.agency.id,
    url: `${base}/sign/${ctx.agency.id}/${token}`,
  });
}
