import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getGuestContext, GUEST_AGENCY_ID, pathPrefix } from "@/lib/agency";
import { getOrCreateGuestSession } from "@/lib/guest-session";
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Create a guest document and return a signed upload URL. */
export async function POST(req: NextRequest) {
  // Guest mode is unauthenticated, so cap document creation per IP (20/hr) to
  // stop someone scripting it to flood the shared guest storage bucket.
  const rl = rateLimit(`guest-doc:${clientIp(req)}`, 20, 60 * 60 * 1000);
  if (!rl.ok) return tooManyRequests(rl);

  const sessionId = await getOrCreateGuestSession();
  const ctx = getGuestContext();

  const body = (await req.json().catch(() => ({}))) as {
    title?: string;
    numPages?: number;
  };
  const title = (body.title?.trim() || "Untitled document").slice(0, 200);
  const numPages =
    typeof body.numPages === "number" && Number.isFinite(body.numPages)
      ? Math.max(1, Math.floor(body.numPages))
      : 1;

  const id = randomUUID();
  const path = `${pathPrefix(ctx)}originals/${id}.pdf`;

  const { error: insErr } = await ctx.supabase.from("documents").insert({
    id,
    agency_id: GUEST_AGENCY_ID,
    guest_session_id: sessionId,
    title,
    storage_path: path,
    num_pages: numPages,
    status: "draft",
  });

  if (insErr) {
    if (/column .guest_session_id. of relation/i.test(insErr.message)) {
      return NextResponse.json(
        {
          error:
            "Guest mode is not set up yet. Run db/schema.sql on the control project and create the 'guest-documents' bucket.",
        },
        { status: 503 },
      );
    }
    console.error("[guest/documents] insert failed:", insErr);
    return NextResponse.json({ error: "Could not create the document." }, { status: 500 });
  }

  const { data, error: urlErr } = await ctx.supabase.storage
    .from(ctx.bucket)
    .createSignedUploadUrl(path);

  if (urlErr || !data) {
    await ctx.supabase.from("documents").delete().eq("id", id);
    console.error("[guest/documents] signed URL failed:", urlErr);
    return NextResponse.json({ error: "Could not create upload URL." }, { status: 500 });
  }

  return NextResponse.json({ id, signedUrl: data.signedUrl });
}
