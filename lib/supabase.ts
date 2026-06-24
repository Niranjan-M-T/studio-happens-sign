import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Storage helpers operating on a caller-supplied Supabase client + bucket.
 * In the multi-tenant model there is no global client — every call is scoped
 * to a specific agency's data-plane project (see lib/agency.ts).
 */

/** Download a stored object as raw bytes (ArrayBuffer = valid Response body). */
export async function downloadObject(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
): Promise<ArrayBuffer> {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error || !data) {
    throw new Error(`Failed to download ${path}: ${error?.message ?? "no data"}`);
  }
  return data.arrayBuffer();
}

/** Upload raw bytes (used for the stamped signed PDF). */
export async function uploadObject(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
  bytes: Uint8Array,
  contentType = "application/pdf",
): Promise<void> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, bytes, { contentType, upsert: true });
  if (error) throw new Error(`Failed to upload ${path}: ${error.message}`);
}

/** Remove stored objects (ignores paths that don't exist). */
export async function removeObjects(
  supabase: SupabaseClient,
  bucket: string,
  paths: string[],
): Promise<void> {
  const clean = paths.filter(Boolean);
  if (clean.length === 0) return;
  const { error } = await supabase.storage.from(bucket).remove(clean);
  if (error) throw new Error(`Failed to remove objects: ${error.message}`);
}
