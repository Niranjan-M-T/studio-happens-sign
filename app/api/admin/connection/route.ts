import { NextRequest, NextResponse } from "next/server";
import { controlDb } from "@/lib/control";
import { clientFor, getSessionAgency, hostedAvailable } from "@/lib/agency";
import { encryptSecret } from "@/lib/crypto";
import { DOCUMENT_BUCKET_OPTIONS } from "@/lib/limits";

export const runtime = "nodejs";

/**
 * Choose the agency's data plane:
 *  - mode 'hosted' → use the platform's shared Supabase (no key needed).
 *  - mode 'byo'    → validate + store the agency's OWN Supabase connection
 *                    (service-role key validated live, bucket auto-created,
 *                    key encrypted at rest, never returned to the browser).
 */
export async function PUT(req: NextRequest) {
  const agency = await getSessionAgency();
  if (!agency) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    mode?: "byo" | "hosted";
    supabaseUrl?: string;
    serviceKey?: string;
    bucket?: string;
  };

  // Platform-hosted: just flip the agency to hosted mode.
  if (body.mode === "hosted") {
    if (!hostedAvailable()) {
      return NextResponse.json(
        { error: "Studio Happens hosting isn't available right now." },
        { status: 400 },
      );
    }
    const { error } = await controlDb
      .from("agencies")
      .update({ hosting_mode: "hosted" })
      .eq("id", agency.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, connected: true, mode: "hosted" });
  }

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

  // 2) Auto-create the private storage bucket (idempotent), capped to PDFs
  //    under the per-file limit so a stolen signed URL can't flood storage.
  const { error: bucketErr } = await supabase.storage.createBucket(
    bucket,
    DOCUMENT_BUCKET_OPTIONS,
  );
  if (bucketErr && !/already exists/i.test(bucketErr.message)) {
    return NextResponse.json(
      { error: `Could not create the '${bucket}' storage bucket: ${bucketErr.message}` },
      { status: 400 },
    );
  }
  // If it already existed, tighten its limits to match (idempotent).
  if (bucketErr) {
    await supabase.storage.updateBucket(bucket, DOCUMENT_BUCKET_OPTIONS).catch(() => {});
  }

  // 3) Persist — encrypt the key at rest, and ensure BYO mode.
  const { error: updErr } = await controlDb
    .from("agencies")
    .update({
      hosting_mode: "byo",
      supabase_url: cleanUrl,
      supabase_key_enc: encryptSecret(serviceKey),
      supabase_bucket: bucket,
    })
    .eq("id", agency.id);
  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, connected: true });
}
