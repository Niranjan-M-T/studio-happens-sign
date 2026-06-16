import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service-role key.
 * Access is gated by our own auth (admin cookie / signing token),
 * so the storage bucket stays private and the anon key is never
 * shipped to the browser.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  // Fail loudly at import time in dev rather than with cryptic runtime errors.
  console.warn(
    "[supabase] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set.",
  );
}

// Placeholders keep createClient from throwing during build when env vars
// aren't present; real values are required at runtime for any DB/storage call.
export const supabaseAdmin = createClient(
  url || "https://placeholder.supabase.co",
  serviceKey || "placeholder-key",
  { auth: { persistSession: false, autoRefreshToken: false } },
);

export const BUCKET = process.env.SUPABASE_BUCKET ?? "documents";

/** Download a stored object as raw bytes (ArrayBuffer = valid Response body). */
export async function downloadObject(path: string): Promise<ArrayBuffer> {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(path);
  if (error || !data) {
    throw new Error(`Failed to download ${path}: ${error?.message ?? "no data"}`);
  }
  return data.arrayBuffer();
}

/** Upload raw bytes (used for the stamped signed PDF). */
export async function uploadObject(
  path: string,
  bytes: Uint8Array,
  contentType = "application/pdf",
): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType, upsert: true });
  if (error) throw new Error(`Failed to upload ${path}: ${error.message}`);
}
