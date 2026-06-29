-- Studio Happens — Sign : database schema
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query).

create extension if not exists "pgcrypto";

create table if not exists documents (
  id                  uuid primary key default gen_random_uuid(),
  -- Null for a single-tenant (bring-your-own) database; set to the agency id
  -- in the platform's SHARED hosted instance so rows are isolated per agency.
  agency_id           uuid,
  title               text not null,
  storage_path        text not null,
  signed_storage_path text,
  num_pages           integer not null default 1,
  status              text not null default 'draft'
                        check (status in ('draft','sent','viewed','signed')),
  sign_token          text unique,
  signer_name         text,
  signed_at           timestamptz,
  viewed_at           timestamptz,
  signer_ip           text,
  signer_user_agent   text,
  notify_emails       text,
  created_at          timestamptz not null default now()
);

create table if not exists signature_fields (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  page        integer not null default 0,
  type        text not null
                check (type in ('signature','name','date','agency_sig')),
  -- normalized 0..1 relative to the page size (top-left origin)
  x           numeric not null,
  y           numeric not null,
  width       numeric not null,
  height      numeric not null,
  created_at  timestamptz not null default now()
);

create index if not exists signature_fields_document_id_idx
  on signature_fields (document_id);
create index if not exists documents_sign_token_idx
  on documents (sign_token);

-- All access goes through the service-role key in server routes, so RLS
-- is left disabled (the anon key is never exposed to the browser).

-- Storage: create a PRIVATE bucket named "documents"
-- (Dashboard → Storage → New bucket → name "documents", Public = off).

-- Migration: run these if your tables existed before newer features.
alter table documents add column if not exists notify_emails text;
alter table documents add column if not exists agency_id uuid;
alter table documents add column if not exists guest_session_id text;
create index if not exists documents_agency_id_idx on documents (agency_id);
create index if not exists documents_guest_session_idx on documents (guest_session_id);
alter table signature_fields drop constraint if exists signature_fields_type_check;
alter table signature_fields add constraint signature_fields_type_check
  check (type in ('signature','name','date','agency_sig'));
