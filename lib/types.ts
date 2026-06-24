export type DocStatus = "draft" | "sent" | "viewed" | "signed";
export type FieldType = "signature" | "name" | "date" | "agency_sig";

export interface DocumentRow {
  id: string;
  title: string;
  storage_path: string;
  signed_storage_path: string | null;
  num_pages: number;
  status: DocStatus;
  sign_token: string | null;
  signer_name: string | null;
  signed_at: string | null;
  viewed_at: string | null;
  signer_ip: string | null;
  signer_user_agent: string | null;
  notify_emails: string | null;
  created_at: string;
}

/** Coordinates are normalized 0..1 relative to each page's size. */
export interface FieldRow {
  id: string;
  document_id: string;
  page: number;
  type: FieldType;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Shape posted from the admin field-placement UI. */
export interface FieldInput {
  page: number;
  type: FieldType;
  x: number;
  y: number;
  width: number;
  height: number;
}
