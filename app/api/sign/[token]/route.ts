import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, BUCKET, downloadObject, uploadObject } from "@/lib/supabase";
import { stampPdf } from "@/lib/pdf-stamp";
import type { FieldRow } from "@/lib/types";

export const runtime = "nodejs";

function clientIp(req: NextRequest): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}

// Client submits typed name + drawn signature → we stamp & store the signed PDF.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
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
  const match = /^data:image\/png;base64,(.+)$/.exec(body.signature ?? "");
  if (!match) {
    return NextResponse.json({ error: "Please draw your signature." }, { status: 400 });
  }
  const signaturePng = new Uint8Array(Buffer.from(match[1], "base64"));

  // Look up the document by token.
  const { data: doc, error } = await supabaseAdmin
    .from("documents")
    .select("id, storage_path, status")
    .eq("sign_token", token)
    .single();
  if (error || !doc) {
    return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  }
  if (doc.status === "signed") {
    return NextResponse.json({ error: "This document is already signed." }, { status: 409 });
  }

  const { data: fields } = await supabaseAdmin
    .from("signature_fields")
    .select("page, type, x, y, width, height")
    .eq("document_id", doc.id);

  const signedAtISO = new Date().toISOString();
  const ip = clientIp(req);

  // Stamp.
  const original = await downloadObject(doc.storage_path);
  const signedBytes = await stampPdf({
    pdfBytes: original,
    fields: (fields ?? []) as Pick<FieldRow, "page" | "type" | "x" | "y" | "width" | "height">[],
    signaturePng,
    signerName: name,
    signedAtISO,
    ip,
    docId: doc.id,
  });

  const signedPath = `signed/${doc.id}.pdf`;
  await uploadObject(signedPath, signedBytes);

  const { error: updErr } = await supabaseAdmin
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
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
