import { NextRequest, NextResponse } from "next/server";
import { controlDb } from "@/lib/control";
import { clientFor } from "@/lib/agency";
import { encryptSecret } from "@/lib/crypto";
import { getSessionAgencyId } from "@/lib/session";

export const runtime = "nodejs";

/**
 * Save (and validate) the agency's OWN Supabase connection. The service-role
 * key is validated live, the storage bucket is auto-created, and the key is
 * stored ENCRYPTED — never returned to the browser.
 */
export async function PUT(req: NextRequest) {
  const agencyId = await getSessionAgencyId();
  if (!agencyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    supabaseUrl?: string;
    serviceKey?: string;
    bucket?: string;
  };
  const url = body.supabaseUrl?.trim() ?? "";
  const serviceKey = body.serviceKey?.trim() ?? "";
  const bucket = (body.bucket?.trim() || "documents").replace(/[^\w.-]/g, "");

  if (!/^https:\/\/.+\.supabase\.co\/?$/.test(url)) {
    return NextResponse.json(
      { error: "Enter a valid Supabase project URL (https://xxxx.supabase.co)." },
      { status: 400 },
    );
  }
  if (serviceKey.length < 20) {
    return NextResponse.json(
      { error: "Enter your Supabase service-role key." },
      { status: 400 },
    );
  }

  const cleanUrl = url.replace(/\/$/, "");
  const supabase = clientFor(cleanUrl, serviceKey);

  // 1) Verify the data tables exist (they must run schema.sql first).
  const { error: tableErr } = await supabase
    .from("documents")
    .select("id")
    .limit(1);
  if (tableErr) {
    const missing = /relation .* does not exist|Could not find the table/i.test(
      tableErr.message,
    );
    return NextResponse.json(
      {
        error: missing
          ? "Connected, but the 'documents' table is missing. Run the setup SQL in your Supabase SQL Editor first, then try again."
          : `Could not query your database: ${tableErr.message}. Check the URL and that this is the service-role key.`,
      },
      { status: 400 },
    );
  }

  // 2) Auto-create the private storage bucket (idempotent).
  const { error: bucketErr } = await supabase.storage.createBucket(bucket, {
    public: false,
  });
  if (bucketErr && !/already exists/i.test(bucketErr.message)) {
    return NextResponse.json(
      { error: `Could not create the '${bucket}' storage bucket: ${bucketErr.message}` },
      { status: 400 },
    );
  }

  // 3) Persist — encrypt the key at rest.
  const { error: updErr } = await controlDb
    .from("agencies")
    .update({
      supabase_url: cleanUrl,
      supabase_key_enc: encryptSecret(serviceKey),
      supabase_bucket: bucket,
    })
    .eq("id", agencyId);
  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, connected: true });
}
