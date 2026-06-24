-- Studio Happens — Sign : CONTROL-PLANE schema
-- Run this in the PLATFORM Supabase project (the one whose URL/service key
-- are in the app's NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env).
--
-- This DB holds ONLY agency accounts + their (encrypted) connection settings
-- and reusable signature. No client documents live here — each agency's
-- documents live in their OWN Supabase project (see db/schema.sql).

create extension if not exists "pgcrypto";

create table if not exists agencies (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  email             text not null unique,
  password_hash     text not null,

  -- Data-plane connection (the agency's own Supabase). The service-role key
  -- is stored ENCRYPTED (AES-256-GCM via lib/crypto.ts), never in plaintext.
  supabase_url      text,
  supabase_key_enc  text,
  supabase_bucket   text not null default 'documents',

  -- Optional per-agency email sending (Resend). Key stored encrypted.
  resend_key_enc    text,
  resend_from       text,
  always_cc         text,        -- comma-separated addresses always copied

  -- Reusable agency signature/stamp (base64 PNG) for counter-signing.
  signature_png     text,

  created_at        timestamptz not null default now()
);

create index if not exists agencies_email_idx on agencies (lower(email));

-- All access is via the service-role key in server routes; RLS stays off.
