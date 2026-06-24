# Studio Happens — Sign

A lightweight, **multi-tenant**, DocuSign-style e-signature tool. Each agency
signs up, connects **their own** free Supabase project, uploads a PDF, places
signature / name / date / agency-signature boxes on the page, shares a link,
and their client signs from a phone. The signed PDF — with the client's drawn
signature, the agency's reusable counter-signature, name, date, and an audit
line stamped in — is downloadable from a per-agency dashboard.

- **Agency sign-up / login:** `/admin/signup`, `/admin/login`
- **Agency dashboard:** `/admin` · **Settings:** `/admin/settings`
- **Client signing link:** `/sign/<agencyId>/<token>` (mobile-first, no login)
- **Stack:** Next.js 16 (App Router) · Supabase (Postgres + Storage) · pdf.js · pdf-lib · Tailwind v4
- **Hosting target:** Render at `sign.studiohappens.tech`

---

## How multi-tenancy works

- **Control plane** — the platform's own Supabase project holds a single
  `agencies` table: accounts (email + bcrypt password) plus each agency's
  **encrypted** connection settings and reusable signature. No client documents
  live here. Schema: [`db/control-schema.sql`](db/control-schema.sql).
- **Data plane** — each agency connects **their own** Supabase project, which
  holds their `documents` + `signature_fields` tables and a private `documents`
  storage bucket. Schema: [`db/schema.sql`](db/schema.sql).
- Signing links embed the agency id (`/sign/<agencyId>/<token>`) so the public
  page can resolve the correct agency's database.

### Security model (agency secrets)

Because an agency connects with their Supabase **service-role key** (which has
full admin over that project), the app treats it carefully:

- Service-role and Resend keys are **encrypted at rest** (AES-256-GCM via
  [`lib/crypto.ts`](lib/crypto.ts), keyed by `ENCRYPTION_KEY`). A database dump
  alone can't reveal them.
- Keys are **write-only** in the UI — entered once, never sent back to the
  browser.
- Agencies are told to use a **dedicated** Supabase project for signing, so the
  key's blast radius is limited to their signing data.
- The code is open source so anyone can verify exactly how their key is handled.

---

## Run the platform (operator)

### 1. Prerequisites
- Node.js 20+ (built with 22)
- A free [Supabase](https://supabase.com) project for the **control plane**
- A free [Render](https://render.com) account (for deploy)

### 2. Control-plane database
In your platform Supabase project → **SQL Editor → New query**, paste
[`db/control-schema.sql`](db/control-schema.sql) and run it (creates `agencies`).

### 3. Environment variables
Copy `.env.example` to `.env.local` and fill it in:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co   # CONTROL project
SUPABASE_SERVICE_ROLE_KEY=eyJ...                     # CONTROL service_role
ENCRYPTION_KEY=...                                   # 32-byte base64 (see below)
AUTH_SECRET=...                                      # random 32+ chars
NEXT_PUBLIC_APP_URL=http://localhost:3000            # prod: https://sign.studiohappens.tech
```

```bash
# ENCRYPTION_KEY:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# AUTH_SECRET:
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

> ⚠️ `ENCRYPTION_KEY` must be the **same** in every environment that reads the
> data (local + Render). If it changes, previously-encrypted agency keys can no
> longer be decrypted and agencies must reconnect.

### 4. Run locally
```bash
npm install
npm run dev          # → http://localhost:3000/admin/signup
```

### 5. Deploy to Render
This repo includes [`render.yaml`](render.yaml). **New + → Blueprint** → pick the
repo → fill in the blanked env vars (`NEXT_PUBLIC_SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, `ENCRYPTION_KEY`, `AUTH_SECRET`) **without** `\$`
escaping. Add the custom domain under **Settings → Custom Domains**.

> Render's free tier sleeps after ~15 min idle. Ping `GET /api/health` every
> ~10 min with a free uptime monitor (cron-job.org / UptimeRobot) to keep it warm.

---

## Use it (an agency)

1. **Sign up** at `/admin/signup` (agency name + email + password).
2. On **Settings**, create a free **dedicated** Supabase project, run the setup
   SQL shown there in its SQL Editor, then paste your **Project URL** +
   **service_role key**. The app verifies the connection and auto-creates the
   private storage bucket. (Optional: add a Resend API key to email signed PDFs,
   and draw a reusable signature for counter-signing.)
3. **Upload document** → place **Signature / Name / Date / Agency signature**
   boxes → **Generate signing link** → share the `/sign/<agencyId>/<token>` URL.
4. The client opens it on their phone, draws a signature, types their name,
   consents, and submits. The PDF is stamped (client signature + your agency
   counter-signature + name + date + audit line), stored, and emailed if
   configured. The client can download their signed copy.

---

## Project structure

```
app/
  admin/(login, signup, settings, page, documents/[id])
  sign/[agencyId]/[token]/   mobile signing page
  api/auth/...               signup, login, logout
  api/admin/...              connection, settings, documents CRUD, send, pdf
  api/sign/[agencyId]/[token]/...  stream PDF, submit signature, download signed
  api/health                 keep-alive ping endpoint
components/                  SettingsForm, DocumentEditor, SignFlow, SignaturePad, ...
lib/                         control (control DB), agency (per-agency client),
                             crypto (AES-256-GCM), supabase (storage helpers),
                             session (JWT), pdf-stamp, email, tokens, types
proxy.ts                     auth gate for /admin + /api/admin (Next 16 "proxy")
db/control-schema.sql        platform `agencies` table
db/schema.sql                per-agency `documents` + `signature_fields`
render.yaml                  Render Blueprint
```

## Notes & limitations
- Consent + timestamp + IP + embedded audit trail make this valid for typical
  agreements under ESIGN/eIDAS. It is **not** a regulated/qualified e-signature
  provider for high-stakes legal documents.
- One signer per link by design.
- Open sign-up has no rate limiting yet — add abuse controls before promoting widely.

## License
[MIT](LICENSE).
