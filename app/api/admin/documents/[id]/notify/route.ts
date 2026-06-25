import { NextRequest, NextResponse } from "next/server";
import { adminAgencyContext } from "@/lib/agency";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseEmails(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
    ),
  ).filter((e) => EMAIL_RE.test(e));
}

/** Save the comma-separated list of addresses to notify once this document is signed. */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await adminAgencyContext();
  if (!ctx) {
    return NextResponse.json({ error: "Connect your database first." }, { status: 400 });
  }
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { emails?: string };
  const raw = body.emails ?? "";
  const emails = parseEmails(raw);
  if (raw.trim().length > 0 && emails.length === 0) {
    return NextResponse.json({ error: "No valid email addresses found." }, { status: 400 });
  }

  let upd = ctx.supabase
    .from("documents")
    .update({ notify_emails: emails.length ? emails.join(",") : null })
    .eq("id", id);
  if (ctx.scopeAgencyId) upd = upd.eq("agency_id", ctx.scopeAgencyId);
  const { error } = await upd;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ emails });
}
