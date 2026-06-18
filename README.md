# Studio Happens — Sign

A lightweight, DocuSign-style e-signature tool. Upload a PDF, place a signature
box on the page, share a link, and your client signs from their phone (types
their name **and** draws a signature). The signed PDF — with name, date, and an
audit line stamped in — is downloadable from a password-protected admin dashboard.

- **Admin dashboard:** `/admin` (password login at `/admin/login`)
- **Client signing link:** `/sign/<token>` (mobile-first, no login)
- **Stack:** Next.js 16 (App Router) · Supabase (Postgres + Storage) · pdf.js · pdf-lib · Tailwind v4
- **Hosting target:** Render at `sign.studiohappens.tech` (deploys via `render.yaml`; CI via GitHub Actions)

---

## 1. Prerequisites

- Node.js 20+ (built with 22)
- A free [Supabase](https://supabase.com) account
- A free [Render](https://render.com) account (for deploy) + access to the
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

**Email on signing (optional, via [Resend](https://resend.com)):**

1. Sign up at resend.com (free tier: 3,000 emails/month) and create an **API Key**.
2. Set `RESEND_API_KEY` to that key. Leave `RESEND_FROM` as the default
   (`Studio Happens Sign <onboarding@resend.dev>`) to start sending immediately
   with no extra setup — or, for a `sign@studiohappens.tech` sender address,
   verify that domain under **Resend → Domains** (adds a couple of DNS records,
   same idea as the Render custom-domain step below) and update `RESEND_FROM`.
3. Leave `RESEND_API_KEY` blank to disable this feature entirely — the app
   works fine without it.

> Why not auto-upload to Google Drive instead? A Google Cloud **service account**
> has zero storage quota outside of a Google Workspace **Shared Drive** — it can't
> own files in a personal Gmail "My Drive" at all, even in a folder shared with it.
> Since Studio Happens uses personal Gmail (no Workspace), email delivery via
> Resend was used instead.

## 4. Run locally

```bash
npm install
npm run dev
# → http://localhost:3000/admin
```

---

## 5. Deploy to `sign.studiohappens.tech` (Render)

This repo includes a `render.yaml` blueprint, so Render can configure the
service automatically from the repo — no manual build/start config needed.

1. Push this repo to GitHub (already done), then sign up at
   [render.com](https://render.com) (free) and connect your GitHub account.
2. **New +** → **Blueprint** → select the `studio-happens-sign` repo. Render
   reads `render.yaml` and proposes a **Web Service** named
   `studio-happens-sign` (free plan, `npm install && npm run build` /
   `npm run start`).
3. Before the first deploy, fill in the env vars the blueprint leaves blank:
   `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   `ADMIN_PASSWORD_HASH`, `AUTH_SECRET` — same values as step 3 above, pasted
   **without** `\$` escaping (Render's dashboard isn't interpolated, same as
   Vercel was).
4. Deploy. Once it's live, **Settings → Custom Domains → Add**
   `sign.studiohappens.tech`. Render shows a CNAME target — add that record
   at your `studiohappens.tech` DNS provider. SSL is issued automatically
   once DNS resolves.
5. Visit `https://sign.studiohappens.tech/admin`.

**Continuous deploys:** Render's GitHub integration redeploys automatically
on every push to `master` — no extra config needed. A separate
[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs `npm run build`
on every push/PR as a fast build-sanity check, independent of the deploy.

> ⚠️ Render's free tier spins the service down after ~15 min of inactivity;
> the first request after that wakes it (cold start, ~30–50s) — similar to
> Supabase's free-tier pausing.

### Keeping it awake (free)

To avoid cold starts, ping the lightweight `GET /api/health` endpoint
(returns `{ ok: true }` instantly, no DB work) every ~10 minutes with a
free uptime monitor:

- **[cron-job.org](https://cron-job.org)** (free, intervals down to 1 min):
  create a cronjob → URL `https://sign.studiohappens.tech/api/health` →
  every 10 minutes. Done.
- **[UptimeRobot](https://uptimerobot.com)** (free, 5-min interval): add an
  **HTTP(s)** monitor for the same URL.

Don't use GitHub Actions cron for this on a **private** repo — Actions bills
per started minute, so a 10-min ping would blow past the 2,000 free
minutes/month. An external pinger doesn't touch your Actions quota.

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
4. (Optional) **Notify by email when signed** → enter one or more comma-separated
   addresses; once the client signs, the stamped PDF is emailed to each one
   automatically (requires `RESEND_API_KEY`, see above).
5. **Generate signing link** → mints a random token and gives you a copyable
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
render.yaml              Render Blueprint (build/start cmd, env var slots)
.github/workflows/ci.yml GitHub Actions: build check on every push/PR
```
