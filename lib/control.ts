import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * The CONTROL-PLANE Supabase client (the platform's own project).
 * Holds only the `agencies` table — accounts + encrypted connection
 * settings + each agency's reusable signature. No client documents
 * live here; those go in each agency's OWN Supabase (the data plane).
 *
 * Reuses the platform env vars (NEXT_PUBLIC_SUPABASE_URL +
 * SUPABASE_SERVICE_ROLE_KEY), which now denote the control DB.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.warn(
    "[control] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set.",
  );
}

export const controlDb = createClient(
  url || "https://placeholder.supabase.co",
  serviceKey || "placeholder-key",
  { auth: { persistSession: false, autoRefreshToken: false } },
);

export interface AgencyRow {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  supabase_url: string | null;
  supabase_key_enc: string | null;
  supabase_bucket: string;
  resend_key_enc: string | null;
  resend_from: string | null;
  always_cc: string | null;
  signature_png: string | null;
  created_at: string;
}

/** True once the agency has pasted a working Supabase URL + key. */
export function isConnected(a: Pick<AgencyRow, "supabase_url" | "supabase_key_enc">): boolean {
  return !!a.supabase_url && !!a.supabase_key_enc;
}
