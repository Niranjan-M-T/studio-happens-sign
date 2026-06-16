# Studio Happens — Sign

A lightweight, DocuSign-style e-signature tool. Upload a PDF, place a signature
box on the page, share a link, and your client signs from their phone (types
their name **and** draws a signature). The signed PDF — with name, date, and an
audit line stamped in — is downloadable from a password-protected admin dashboard.

- **Admin dashboard:** `/admin` (password login at `/admin/login`)
- **Client signing link:** `/sign/<token>` (mobile-first, no login)
- **Stack:** Next.js 16 (App Router) · Supabase (Postgres + Storage) · pdf.js · pdf-lib · Tailwind v4
- **Hosting target:** Vercel at `sign.studiohappens.tech`

---

## 1. Prerequisites

- Node.js 20+ (built with 22)
- A free [Supabase](https://supabase.com) account
- A free [Vercel](https://vercel.com) account (for deploy) + access to the
  `studiohappens.tech` DNS

## 2. Supabase setup (the free database)

1. Create a new Supabase project (free tier: 500 MB DB + 1 GB storage).
2. **Database → SQL Editor → New query**, paste the contents of
   [`db/schema.sql`](db/schema.sql), and run it. This creates the `documents`
   and `signature_fields` tables.
3. **Storage → New bucket** → name it **`documents`**, leave **Public = off**
   (private). All access is proxied through the server, so the bucket stays private.
4. **Project Settings → API**, copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **`service_role` secret** → `SUPABASE_SERVICE_ROLE_KEY` (server-only; never exposed to the browser)

## 3. Environment variables

Copy `.env.example` to `.env.local` and fill it in:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...            # service_role secret
SUPABASE_BUCKET=documents

ADMIN_PASSWORD_HASH=...                       # see below
AUTH_SECRET=...                               # random 32+ chars
NEXT_PUBLIC_APP_URL=http://localhost:3000     # prod: https://sign.studiohappens.tech
```

**Generate the admin password hash:**

```bash
npm run hash-password -- "your-strong-password"
```

> ⚠️ **dotenv gotcha:** bcrypt hashes contain `$`, which Next's env loader treats
> as variable interpolation. In `.env` / `.env.local` files, **escape each `$` as
> `\$`** (e.g. `ADMIN_PASSWORD_HASH=\$2b\$12\$...`). On the **Vercel dashboard**,
> paste the hash **as-is** (no escaping — dashboard values aren't interpolated).

**Generate `AUTH_SECRET`:**

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

## 4. Run locally

```bash
npm install
npm run dev
# → http://localhost:3000/admin
```

---

## 5. Deploy to `sign.studiohappens.tech`

1. Push this repo to GitHub and **import it into Vercel**.
2. In Vercel **Project → Settings → Environment Variables**, add all five vars
   from step 3 (hash **without** `\$` escaping here). Set
   `NEXT_PUBLIC_APP_URL=https://sign.studiohappens.tech`.
3. **Settings → Domains → Add** `sign.studiohappens.tech`.
4. In the `studiohappens.tech` DNS provider, add the record Vercel shows —
   typically a **CNAME** `sign → cname.vercel-dns.com`. SSL is issued automatically.
5. Redeploy. Visit `https://sign.studiohappens.tech/admin`.

---

## 6. How it works

**Admin**
1. Log in at `/admin/login`.
2. **Upload document** → the browser counts pages, then PUTs the PDF straight to
   Supabase Storage via a short-lived **signed upload URL** (keeps large files off
   the serverless function).
3. On the document page, click **Signature / Name / Date**, then tap the page to
   drop the field; drag to move, drag the corner to resize, `×` to delete.
   Coordinates are stored **normalized (0–1)** so they're resolution-independent.
4. **Generate signing link** → mints a random token and gives you a copyable
   `/sign/<token>` URL to share however you like.

**Client (phone)**
1. Opens the link, reviews the PDF (fields are highlighted).
2. Types their full name, draws a signature, ticks the consent box, taps
   **Sign & Submit**.
3. The server stamps the drawn signature + typed name + date into the PDF at the
   placed coordinates (`pdf-lib`, Y-axis flipped to PDF's bottom-left origin),
   appends an audit line (name · timestamp · IP · doc id), stores the signed copy,
   and records the signer's name, time, IP, and user-agent.

**Status** flows `draft → sent → viewed → signed`; the signed PDF is downloadable
from the dashboard.

---

## 7. Manual end-to-end test checklist

Once Supabase env vars are set:

1. Log in at `/admin/login` (wrong password is rejected; correct password redirects to `/admin`).
2. Upload a multi-page PDF → it appears in the dashboard and in Supabase Storage.
3. Place signature + name + date fields; **Save**; reload — placement persists.
4. **Generate link**, open `/sign/<token>` on a phone (or browser device-mode).
5. Type a name, draw a signature, consent, submit.
6. Dashboard status shows **Signed**; **Download** opens a PDF with the signature,
   name, and date stamped at the right spots plus the audit line.
7. Re-opening the same link shows "Already signed".

## 8. Notes & limitations

- Consent + timestamp + IP + embedded audit trail make this valid for typical
  agreements under ESIGN/eIDAS. It is **not** a regulated/qualified e-signature
  provider for high-stakes legal documents.
- Supabase free projects pause after ~1 week of inactivity; the first request
  wakes them (brief delay).
- One signer per link by design.

**Possible next steps:** email notification on signing (Resend free tier),
multiple signers per document, reusable templates, link expiry, and a SHA-256
hash of the signed PDF for tamper-evidence.

---

## Project structure

```
app/
  admin/                 dashboard, login, documents/[id] editor
  sign/[token]/          mobile signing page
  api/admin/...          create doc, fields, send link, stream/download PDF
  api/sign/[token]/...   stream PDF, submit signature
components/              PdfPages, DocumentEditor, SignFlow, SignaturePad, ...
lib/                     supabase, session (JWT), pdf-stamp, tokens, types
proxy.ts                 auth gate for /admin + /api/admin (Next 16 "proxy")
db/schema.sql            Postgres tables
scripts/                 hash-password, verify-stamp
```
