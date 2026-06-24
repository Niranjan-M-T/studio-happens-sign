import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { controlDb, isConnected, type AgencyRow } from "./control";
import { decryptSecret } from "./crypto";
import { getSessionAgencyId } from "./session";

/** Load a full agency row from the control DB. */
export async function getAgencyById(id: string): Promise<AgencyRow | null> {
  const { data } = await controlDb
    .from("agencies")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as AgencyRow | null) ?? null;
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
}

/**
 * Resolve the data-plane context (the agency's OWN Supabase) for an agency id.
 * Returns null when the agency hasn't connected a database yet. The decrypted
 * service-role key never leaves this server boundary.
 */
export async function getAgencyContext(
  agencyId: string,
): Promise<AgencyContext | null> {
  const agency = await getAgencyById(agencyId);
  if (!agency || !isConnected(agency)) return null;
  const key = decryptSecret(agency.supabase_key_enc!);
  return {
    agency,
    supabase: clientFor(agency.supabase_url!, key),
    bucket: agency.supabase_bucket,
  };
}

/**
 * Admin routes: resolve the logged-in agency's data-plane context. Returns
 * null when there's no session or the agency hasn't connected a database yet.
 * (The proxy already 401s unauthenticated requests, so null here generally
 * means "not connected.")
 */
export async function adminAgencyContext(): Promise<AgencyContext | null> {
  const agencyId = await getSessionAgencyId();
  if (!agencyId) return null;
  return getAgencyContext(agencyId);
}
