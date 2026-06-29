import { NextRequest, NextResponse } from "next/server";
import { getGuestContext, GUEST_AGENCY_ID } from "@/lib/agency";
import { getGuestSession } from "@/lib/guest-session";
import { generateSignToken } from "@/lib/tokens";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionId = await getGuestSession();
  if (!sessionId) return NextResponse.json({ error: "No guest session." }, { status: 401 });

  const { id } = await params;
  const ctx = getGuestContext();

  const { data: doc } = await ctx.supabase
    .from("documents")
    .select("sign_token, status")
    .eq("id", id)
    .eq("agency_id", GUEST_AGENCY_ID)
    .eq("guest_session_id", sessionId)
    .maybeSingle();

  if (!doc) return NextResponse.json({ error: "Not found." }, { status: 404 });

  let token = doc.sign_token as string | null;
  if (!token) {
    token = generateSignToken();
    const { error } = await ctx.supabase
      .from("documents")
      .update({ sign_token: token, status: "sent" })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const base = process.env.NEXT_PUBLIC_APP_URL?.trim() || new URL(req.url).origin;
  return NextResponse.json({
    token,
    agencyId: GUEST_AGENCY_ID,
    url: `${base}/sign/${GUEST_AGENCY_ID}/${token}`,
  });
}
