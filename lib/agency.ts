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

/** Build the data-plane context for a CONNECTED agency row. */
export function contextFor(agency: AgencyRow): AgencyContext {
  const key = decryptSecret(agency.supabase_key_enc!);
  return {
    agency,
    supabase: clientFor(agency.supabase_url!, key),
    bucket: agency.supabase_bucket,
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
