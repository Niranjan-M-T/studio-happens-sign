import { NextRequest, NextResponse } from "next/server";
import { controlDb } from "@/lib/control";
import { clientFor, GUEST_AGENCY_ID } from "@/lib/agency";
import { removeObjects } from "@/lib/supabase";
import { decryptSecret } from "@/lib/crypto";

export const runtime = "nodejs";

const THIRTY_DAYS_AGO = () =>
  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

/**
 * Deletes documents older than 30 days from:
 *  - Guest mode (stored in the control project under GUEST_AGENCY_ID)
 *  - Hosted mode (stored in the hosted Supabase, excludes super-admin agency)
 *
 * Protect with CLEANUP_SECRET env or Render cron IP allowlist.
 * Call daily from cron-job.org: GET /api/cleanup?secret=YOUR_SECRET
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CLEANUP_SECRET;
  if (secret) {
    const provided = req.nextUrl.searchParams.get("secret");
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const cutoff = THIRTY_DAYS_AGO();
  const results: Record<string, number> = { guest: 0, hosted: 0, byo: 0 };

  // ── Guest documents (in the control project) ─────────────────────────────
  try {
    const { data: guestDocs } = await controlDb
      .from("documents")
      .select("id, storage_path, sign_token")
      .eq("agency_id", GUEST_AGENCY_ID)
      .lt("created_at", cutoff);

    if (guestDocs?.length) {
      const paths = guestDocs.flatMap((d) => {
        const paths = [];
        if (d.storage_path) paths.push(d.storage_path);
        if (d.sign_token) paths.push(`${GUEST_AGENCY_ID}/signed/${d.id}.pdf`);
        return paths;
      });

      const guestBucket = process.env.GUEST_STORAGE_BUCKET || "guest-documents";
      await removeObjects(controlDb, guestBucket, paths).catch(() => {});

      const ids = guestDocs.map((d) => d.id);
      await controlDb.from("documents").delete().in("id", ids);
      results.guest = ids.length;
    }
  } catch {
    // Guest mode may not be set up yet; continue.
  }

  // ── Hosted-mode documents (in the shared hosted Supabase) ─────────────────
  const hostedUrl = process.env.HOSTED_SUPABASE_URL;
  const hostedKey = process.env.HOSTED_SUPABASE_SERVICE_KEY;
  const hostedBucket = process.env.HOSTED_SUPABASE_BUCKET || "documents";

  if (hostedUrl && hostedKey) {
    try {
      const hostedDb = clientFor(hostedUrl, hostedKey);

      // Find the super-admin's agency id to exclude their documents.
      const { data: superAgency } = await controlDb
        .from("agencies")
        .select("id")
        .eq("email", "studiohappens26@gmail.com")
        .maybeSingle();

      let query = hostedDb
        .from("documents")
        .select("id, storage_path, agency_id")
        .lt("created_at", cutoff);

      if (superAgency?.id) {
        query = query.neq("agency_id", superAgency.id);
      }

      const { data: hostedDocs } = await query;

      if (hostedDocs?.length) {
        const paths = hostedDocs.flatMap((d) => {
          const prefix = d.agency_id ? `${d.agency_id}/` : "";
          const p = [];
          if (d.storage_path) p.push(d.storage_path);
          p.push(`${prefix}signed/${d.id}.pdf`);
          return p;
        });

        await removeObjects(hostedDb, hostedBucket, paths).catch(() => {});
        const ids = hostedDocs.map((d) => d.id);
        await hostedDb.from("documents").delete().in("id", ids);
        results.hosted = ids.length;
      }
    } catch {
      // Hosted DB not connected or schema not run yet.
    }
  }

  // ── BYO-mode agency documents ─────────────────────────────────────────────
  // For each connected BYO agency (excluding super admin), purge docs > 30 days.
  try {
    const { data: byoAgencies } = await controlDb
      .from("agencies")
      .select("id, supabase_url, supabase_key_enc, supabase_bucket")
      .eq("hosting_mode", "byo")
      .not("supabase_url", "is", null)
      .not("supabase_key_enc", "is", null)
      .neq("email", "studiohappens26@gmail.com");

    for (const byo of byoAgencies ?? []) {
      try {
        const key = decryptSecret(byo.supabase_key_enc!);
        const byoDb = clientFor(byo.supabase_url!, key);
        const bucket = byo.supabase_bucket || "documents";

        const { data: byoDocs } = await byoDb
          .from("documents")
          .select("id, storage_path")
          .lt("created_at", cutoff);

        if (byoDocs?.length) {
          const paths = byoDocs.flatMap((d) => {
            const p: string[] = [];
            if (d.storage_path) p.push(d.storage_path);
            p.push(`signed/${d.id}.pdf`);
            return p;
          });
          await removeObjects(byoDb, bucket, paths).catch(() => {});
          const ids = byoDocs.map((d) => d.id);
          await byoDb.from("documents").delete().in("id", ids);
          results.byo += ids.length;
        }
      } catch {
        // Individual agency DB failure — skip and continue with others.
      }
    }
  } catch {
    // Control DB query failed.
  }

  return NextResponse.json({
    ok: true,
    deleted: results,
    cutoff,
    ran_at: new Date().toISOString(),
  });
}
