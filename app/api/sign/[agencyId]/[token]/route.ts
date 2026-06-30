import { NextRequest, NextResponse } from "next/server";
import { getAgencyContext, pathPrefix } from "@/lib/agency";
import { downloadObject, uploadObject } from "@/lib/supabase";
import { stampPdf } from "@/lib/pdf-stamp";
import { sendSignedPdfEmail } from "@/lib/email";
import { decryptSecret } from "@/lib/crypto";
import { rateLimit, clientIp as ipFromReq, tooManyRequests } from "@/lib/rate-limit";
import type { FieldRow } from "@/lib/types";

export const runtime = "nodejs";

function clientIp(req: NextRequest): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}

/** Decode a "data:image/png;base64,…" data URL to raw bytes (or null). */
function pngFromDataUrl(dataUrl: string | null | undefined): Uint8Array | null {
  const m = /^data:image\/png;base64,(.+)$/.exec(dataUrl ?? "");
  return m ? new Uint8Array(Buffer.from(m[1], "base64")) : null;
}

const splitEmails = (raw: string | null | undefined) =>
  (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

// Client submits typed name + drawn signature → we stamp & store the signed PDF.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ agencyId: string; token: string }> },
) {
  const { agencyId, token } = await params;

  // Throttle submissions per IP (30/hr) so the public endpoint can't be
  // hammered to brute-force tokens or spam stamping/email work.
  const rl = rateLimit(`sign:${ipFromReq(req)}`, 30, 60 * 60 * 1000);
  if (!rl.ok) return tooManyRequests(rl);

  const ctx = await getAgencyContext(agencyId);
  if (!ctx) {
    return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    signature?: string;
    consent?: boolean;
  };

  const name = body.name?.trim() ?? "";
  if (name.length < 2) {
    return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
  }
  if (body.consent !== true) {
    return NextResponse.json({ error: "Consent is required to sign." }, { status: 400 });
  }
  const signaturePng = pngFromDataUrl(body.signature);
  if (!signaturePng) {
    return NextResponse.json({ error: "Please draw your signature." }, { status: 400 });
  }

  // Look up the document by token (scoped to this agency in shared instances).
  let sel = ctx.supabase
    .from("documents")
    .select("id, title, storage_path, status, notify_emails")
    .eq("sign_token", token);
  if (ctx.scopeAgencyId) sel = sel.eq("agency_id", ctx.scopeAgencyId);
  const { data: doc, error } = await sel.single();
  if (error || !doc) {
    return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  }
  if (doc.status === "signed") {
    return NextResponse.json({ error: "This document is already signed." }, { status: 409 });
  }

  const { data: fields } = await ctx.supabase
    .from("signature_fields")
    .select("page, type, x, y, width, height")
    .eq("document_id", doc.id);

  const signedAtISO = new Date().toISOString();
  const ip = clientIp(req);

  // Stamp — both the client signature and (where placed) the agency's
  // reusable counter-signature.
  const original = await downloadObject(ctx.supabase, ctx.bucket, doc.storage_path);
  const signedBytes = await stampPdf({
    pdfBytes: original,
    fields: (fields ?? []) as Pick<FieldRow, "page" | "type" | "x" | "y" | "width" | "height">[],
    signaturePng,
    agencySignaturePng: pngFromDataUrl(ctx.agency.signature_png),
    signerName: name,
    signedAtISO,
    ip,
    docId: doc.id,
  });

  const signedPath = `${pathPrefix(ctx)}signed/${doc.id}.pdf`;
  await uploadObject(ctx.supabase, ctx.bucket, signedPath, signedBytes);

  const { error: updErr } = await ctx.supabase
    .from("documents")
    .update({
      status: "signed",
      signed_storage_path: signedPath,
      signer_name: name,
      signed_at: signedAtISO,
      signer_ip: ip,
      signer_user_agent: req.headers.get("user-agent"),
    })
    .eq("id", doc.id);
  if (updErr) {
    console.error("[sign] status update failed:", updErr);
    return NextResponse.json({ error: "Could not save your signature. Please try again." }, { status: 500 });
  }

  // Per-agency email: the document's notify list + the agency's always-CC,
  // sent through the agency's own Resend key. No-ops if the agency has no key.
  const recipients = Array.from(
    new Set(
      [...splitEmails(ctx.agency.always_cc), ...splitEmails(doc.notify_emails as string | null)].map(
        (e) => e.toLowerCase(),
      ),
    ),
  );
  const resendKey = ctx.agency.resend_key_enc
    ? decryptSecret(ctx.agency.resend_key_enc)
    : "";
  if (resendKey && recipients.length > 0) {
    try {
      await sendSignedPdfEmail({
        apiKey: resendKey,
        from: ctx.agency.resend_from || `${ctx.agency.name} <onboarding@resend.dev>`,
        to: recipients,
        documentTitle: doc.title as string,
        signerName: name,
        pdfBytes: signedBytes,
      });
    } catch (err) {
      console.error("[sign] failed to email signed PDF:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
