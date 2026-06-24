/**
 * The SQL an agency runs in THEIR OWN Supabase project (SQL Editor) to create
 * the data-plane tables. Mirrors db/schema.sql. The storage bucket is created
 * automatically by the app when they connect, so it's not in here.
 */
export const DATA_SCHEMA_SQL = `create extension if not exists "pgcrypto";

create table if not exists documents (
  id                  uuid primary key default gen_random_uuid(),
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
  x           numeric not null,
  y           numeric not null,
  width       numeric not null,
  height      numeric not null,
  created_at  timestamptz not null default now()
);

create index if not exists signature_fields_document_id_idx
  on signature_fields (document_id);
create index if not exists documents_sign_token_idx
  on documents (sign_token);`;
