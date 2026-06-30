/**
 * Shared size/quota limits. Used both for client-side hints and for the
 * server-side bucket configuration that actually enforces them.
 */

/** Per-file upload cap. Enforced at the storage layer via bucket fileSizeLimit. */
export const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

/** Per-agency total storage quota. */
export const STORAGE_LIMIT_BYTES = 250 * 1024 * 1024; // 250 MB

/** Only PDFs are accepted. Enforced via bucket allowedMimeTypes. */
export const ALLOWED_MIME_TYPES = ["application/pdf"];

/** Options passed to supabase.storage.createBucket for document buckets. */
export const DOCUMENT_BUCKET_OPTIONS = {
  public: false,
  fileSizeLimit: MAX_FILE_BYTES,
  allowedMimeTypes: ALLOWED_MIME_TYPES,
};
