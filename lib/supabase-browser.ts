"use client";
import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client for AUTH only (the control project's anon key).
 * Used by the login/signup/reset pages and the account-management UI to call
 * supabase.auth.*. Data access never happens here — that's server-side with
 * the service-role key, scoped per agency.
 */
export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
