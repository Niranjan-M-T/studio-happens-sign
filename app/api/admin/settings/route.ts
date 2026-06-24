import { NextRequest, NextResponse } from "next/server";
import { controlDb } from "@/lib/control";
import { encryptSecret } from "@/lib/crypto";
import { getSessionAgency } from "@/lib/agency";

export const runtime = "nodejs";

/**
 * Update non-connection settings: agency name, Resend (key encrypted + from),
 * always-CC list, and the reusable agency signature. All fields optional —
 * only provided ones are changed. Secrets are never echoed back.
 */
export async function PUT(req: NextRequest) {
  const agency = await getSessionAgency();
  if (!agency) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    resendKey?: string; // empty string = clear; undefined = leave as-is
    resendFrom?: string;
    alwaysCc?: string;
    signaturePng?: string; // data URL or "" to clear; undefined = leave as-is
  };

  const patch: Record<string, string | null> = {};

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (name.length < 2) {
      return NextResponse.json({ error: "Agency name is too short." }, { status: 400 });
    }
    patch.name = name;
  }

  if (typeof body.resendKey === "string") {
    patch.resend_key_enc = body.resendKey.trim()
      ? encryptSecret(body.resendKey.trim())
      : null;
  }
  if (typeof body.resendFrom === "string") {
    patch.resend_from = body.resendFrom.trim() || null;
  }
  if (typeof body.alwaysCc === "string") {
    patch.always_cc = body.alwaysCc.trim() || null;
  }
  if (typeof body.signaturePng === "string") {
    const v = body.signaturePng.trim();
    if (v && !/^data:image\/png;base64,/.test(v)) {
      return NextResponse.json({ error: "Invalid signature image." }, { status: 400 });
    }
    patch.signature_png = v || null;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: true });
  }

  const { error } = await controlDb
    .from("agencies")
    .update(patch)
    .eq("id", agency.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
