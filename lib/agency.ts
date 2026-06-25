import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import { controlDb, isConnected, type AgencyRow } from "./control";
import { decryptSecret } from "./crypto";
import { getSessionUser } from "./supabase-server";

/** Load a full agency row from the control DB by its primary key. */
export async function getAgencyById(id: string): Promise<AgencyRow | null> {
  const { data } = await controlDb
    .from("agencies")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as AgencyRow | null) ?? null;
}

/**
 * Return the agency row for a Supabase Auth user, creating it on first login.
 * Identity lives in Supabase Auth; this row holds the agency's profile +
 * (encrypted) connection settings, linked by user_id.
 */
export async function ensureAgencyForUser(user: User): Promise<AgencyRow> {
  const { data: existing } = await controlDb
    .from("agencies")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) return existing as AgencyRow;

  const name =
    (typeof user.user_metadata?.name === "string" && user.user_metadata.name.trim()) ||
    user.email ||
    "My agency";
  // Ignore a concurrent insert race, then read the row back.
  await controlDb
    .from("agencies")
    .insert({ user_id: user.id, email: user.email ?? "", name })
    .select("id")
    .maybeSingle();
  const { data } = await controlDb
    .from("agencies")
    .select("*")
    .eq("user_id", user.id)
    .single();
  return data as AgencyRow;
}

/** The logged-in user's agency row (or null if not signed in). */
export async function getSessionAgency(): Promise<AgencyRow | null> {
  const user = await getSessionUser();
  if (!user) return null;
  return ensureAgencyForUser(user);
}

/** Whether the platform-hosted data plane is configured + offerable. */
export function hostedAvailable(): boolean {
  return (
    !!process.env.HOSTED_SUPABASE_URL && !!process.env.HOSTED_SUPABASE_SERVICE_KEY
  );
}

/** Build a Supabase client for a data-plane URL + service-role key. */
export function clientFor(url: string, serviceKey: string): SupabaseClient {
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface AgencyContext {
  agency: AgencyRow;
  supabase: SupabaseClient;
  bucket: string;
  /**
   * When set (hosted mode), all document rows must be tagged with and filtered
   * by this id, and storage paths prefixed with it — because the data plane is
   * a SHARED instance. Null in BYO mode (the database belongs to one agency).
   */
  scopeAgencyId: string | null;
}

/** Storage path prefix for a context ("" for BYO, "<agencyId>/" for hosted). */
export function pathPrefix(ctx: AgencyContext): string {
  return ctx.scopeAgencyId ? `${ctx.scopeAgencyId}/` : "";
}

/** Build the data-plane context for a CONNECTED agency row. */
export function contextFor(agency: AgencyRow): AgencyContext {
  if (agency.hosting_mode === "hosted") {
    const url = process.env.HOSTED_SUPABASE_URL;
    const key = process.env.HOSTED_SUPABASE_SERVICE_KEY;
    if (!url || !key) {
      throw new Error("Hosted mode is not configured (HOSTED_SUPABASE_* env).");
    }
    return {
      agency,
      supabase: clientFor(url, key),
      bucket: process.env.HOSTED_SUPABASE_BUCKET || "documents",
      scopeAgencyId: agency.id,
    };
  }
  // BYO: the agency's own Supabase, key decrypted from the control row.
  const key = decryptSecret(agency.supabase_key_enc!);
  return {
    agency,
    supabase: clientFor(agency.supabase_url!, key),
    bucket: agency.supabase_bucket,
    scopeAgencyId: null,
  };
}

/**
 * Resolve the data-plane context (the agency's OWN Supabase) for an agency id.
 * Used by the PUBLIC signing pages, which carry the agency id in the URL.
 * Returns null when the agency hasn't connected a database yet.
 */
export async function getAgencyContext(
  agencyId: string,
): Promise<AgencyContext | null> {
  const agency = await getAgencyById(agencyId);
  if (!agency || !isConnected(agency)) return null;
  return contextFor(agency);
}

/**
 * Admin routes: resolve the logged-in agency's data-plane context. Null when
 * there's no session or the agency hasn't connected a database yet.
 */
export async function adminAgencyContext(): Promise<AgencyContext | null> {
  const agency = await getSessionAgency();
  if (!agency || !isConnected(agency)) return null;
  return contextFor(agency);
}
