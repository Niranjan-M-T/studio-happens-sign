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

/**
 * Read the true byte size of a stored object (or null if not found).
 * Used to reconcile a document's recorded size against what was actually
 * uploaded, so the storage quota can't be bypassed by a client lying about
 * the file size.
 */
export async function objectSize(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
): Promise<number | null> {
  const idx = path.lastIndexOf("/");
  const folder = idx >= 0 ? path.slice(0, idx) : "";
  const name = idx >= 0 ? path.slice(idx + 1) : path;
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(folder, { search: name, limit: 100 });
  if (error || !data) return null;
  const match = data.find((o) => o.name === name);
  const size = (match?.metadata as { size?: number } | undefined)?.size;
  return typeof size === "number" ? size : null;
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
