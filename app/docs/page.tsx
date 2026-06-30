import Link from "next/link";
import type { Metadata } from "next";
import DotFieldBg from "@/components/DotFieldBg";

export const metadata: Metadata = {
  title: "Documentation & Setup Guide",
  description:
    "Complete guide for Studio Happens Sign: using the app, connecting your account, self-hosting setup, environment variables, and troubleshooting common errors.",
  alternates: { canonical: "https://sign.studiohappens.tech/docs" },
  openGraph: {
    title: "Documentation & Setup Guide | Studio Happens Sign",
    description:
      "Everything you need to use Studio Happens Sign, set it up for your team, or run your own copy. Covers guest mode, account setup, self-hosting, and troubleshooting.",
    url: "https://sign.studiohappens.tech/docs",
    type: "website",
  },
};

const techArticleSchema = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  "@id": "https://sign.studiohappens.tech/docs#article",
  headline: "Studio Happens Sign: Documentation & Setup Guide",
  description:
    "Complete guide for using Studio Happens Sign, connecting Supabase, self-hosting on Render, and fixing common errors.",
  url: "https://sign.studiohappens.tech/docs",
  author: {
    "@type": "Organization",
    name: "Studio Happens",
    url: "https://studiohappens.tech",
  },
  publisher: { "@id": "https://sign.studiohappens.tech/#organization" },
  isPartOf: { "@id": "https://sign.studiohappens.tech/#website" },
  articleSection: [
    "Using Studio Happens Sign",
    "Account settings",
    "Self-hosting",
    "Troubleshooting",
  ],
};

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "@id": "https://sign.studiohappens.tech/docs#self-hosting",
  name: "How to self-host Studio Happens Sign",
  description:
    "Step-by-step guide for deploying your own copy of Studio Happens Sign on Render using two Supabase projects.",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Fork the GitHub repository",
      text: "Fork https://github.com/Niranjan-M-T/studio-happens-sign and clone it locally.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Set up the control plane Supabase project",
      text: "Create a Supabase project at supabase.com, enable email auth, and run db/control-schema.sql in the SQL editor. This project holds the agencies table.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Set up the data plane Supabase project",
      text: "Create a second Supabase project, run db/schema.sql, and create a private storage bucket named 'documents'. This project holds PDF files and signature data.",
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "Get a Resend API key",
      text: "Create an account at resend.com and generate an API key. The free tier handles 3,000 emails per month.",
    },
    {
      "@type": "HowToStep",
      position: 5,
      name: "Set environment variables",
      text: "Copy .env.example to .env.local and fill in values for both Supabase projects, your Resend key, ENCRYPTION_KEY (32-byte base64), and AUTH_SECRET.",
    },
    {
      "@type": "HowToStep",
      position: 6,
      name: "Deploy to Render",
      text: "Create a new Web Service on Render, connect your GitHub fork, set Node environment, npm run build / npm start, add all env vars, and deploy.",
    },
    {
      "@type": "HowToStep",
      position: 7,
      name: "Create the guest-documents bucket",
      text: "In your control plane Supabase, create a private bucket named guest-documents and set GUEST_STORAGE_BUCKET=guest-documents in Render.",
    },
    {
      "@type": "HowToStep",
      position: 8,
      name: "Set up daily cleanup",
      text: "Set CLEANUP_SECRET in Render, then use cron-job.org to call /api/cleanup?secret=VALUE once per day.",
    },
  ],
};

const troubleshootingSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": "https://sign.studiohappens.tech/docs#troubleshooting",
  mainEntity: [
    {
      "@type": "Question",
      name: "Why does the upload show 'Bucket not found'?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The HOSTED_SUPABASE_URL in your environment variables is either using http:// instead of https://, or the service key does not match the JWT secret of your Supabase instance. Change the URL to https:// and verify the service key in your Supabase project settings under API.",
      },
    },
    {
      "@type": "Question",
      name: "Why does the admin dashboard show 'Connect your database first'?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Your account is in BYO mode and no Supabase connection has been configured. Go to Settings, paste your Supabase project URL and service-role key, and click Save. If you are on Studio Happens hosting, the admin can toggle your account to hosted mode.",
      },
    },
    {
      "@type": "Question",
      name: "Why are email notifications not arriving after a client signs?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Email notifications require a Resend API key. Add it in Settings under Email notifications. If you added the key and still get no emails, check that the From address domain is verified in your Resend dashboard, and that the document has at least one email in the Notify field.",
      },
    },
    {
      "@type": "Question",
      name: "Why does the signing link show a 404 or document not found?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Documents are deleted 30 days after uploading. If the document is within its 30-day window, check that the signing URL has not been truncated when copying. The token at the end of the URL must be complete.",
      },
    },
    {
      "@type": "Question",
      name: "Why does guest mode fail with a storage error?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Guest mode uses a separate bucket in the control plane Supabase. Create a private bucket named guest-documents in that project and set GUEST_STORAGE_BUCKET=guest-documents in your environment variables.",
      },
    },
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://sign.studiohappens.tech",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Documentation",
      item: "https://sign.studiohappens.tech/docs",
    },
  ],
};

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="font-display text-2xl tracking-tight text-white sm:text-3xl">{title}</h2>
      <div className="mt-6 space-y-8">{children}</div>
    </section>
  );
}

function SubSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <div id={id} className="scroll-mt-20">
      <h3 className="font-semibold text-lg text-white">{title}</h3>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-white/70">{children}</div>
    </div>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/40 px-5 py-4 text-xs leading-relaxed text-white/80">
      <code>{children}</code>
    </pre>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs text-accent">
      {children}
    </code>
  );
}

function Callout({ type, children }: { type: "info" | "warn" | "danger"; children: React.ReactNode }) {
  const styles = {
    info: "border-accent/30 bg-accent/5 text-white/80",
    warn: "border-yellow-500/30 bg-yellow-500/5 text-white/80",
    danger: "border-red-500/30 bg-red-500/5 text-white/80",
  };
  const labels = { info: "Note", warn: "Important", danger: "Warning" };
  const labelColors = { info: "text-accent", warn: "text-yellow-400", danger: "text-red-400" };
  return (
    <div className={`rounded-xl border px-5 py-4 text-sm ${styles[type]}`}>
      <span className={`font-semibold ${labelColors[type]}`}>{labels[type]}: </span>
      {children}
    </div>
  );
}

function TroubleshootItem({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-4 backdrop-blur-sm open:bg-white/[0.05]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-white">
        {q}
        <span className="shrink-0 text-white/40 transition group-open:rotate-45">+</span>
      </summary>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-white/70">{children}</div>
    </details>
  );
}

const navItems = [
  { href: "#using-sign", label: "Using the app" },
  { href: "#guest-mode", label: "Guest mode" },
  { href: "#create-account", label: "Create an account" },
  { href: "#upload", label: "Upload a document" },
  { href: "#fields", label: "Signature fields" },
  { href: "#send", label: "Send & sign" },
  { href: "#settings", label: "Settings" },
  { href: "#email-notifications", label: "Email notifications" },
  { href: "#agency-signature", label: "Agency signature" },
  { href: "#byo-supabase", label: "Bring your own Supabase" },
  { href: "#self-hosting", label: "Self-hosting" },
  { href: "#sh-step-1", label: "Step 1: Fork the repo" },
  { href: "#sh-step-2", label: "Step 2: Control plane" },
  { href: "#sh-step-3", label: "Step 3: Data plane" },
  { href: "#sh-step-4", label: "Step 4: Resend" },
  { href: "#sh-step-5", label: "Step 5: Env vars" },
  { href: "#sh-step-6", label: "Step 6: Deploy" },
  { href: "#sh-step-7", label: "Step 7: Guest mode" },
  { href: "#sh-step-8", label: "Step 8: Cleanup cron" },
  { href: "#troubleshooting", label: "Troubleshooting" },
];

export default function DocsPage() {
  return (
    <div className="relative min-h-screen bg-ink text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(techArticleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(troubleshootingSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <DotFieldBg />

      <div className="relative z-10">
        {/* Nav */}
        <nav className="border-b border-white/10 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-5 sm:py-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-display text-base tracking-tight sm:text-xl whitespace-nowrap">STUDIO HAPPENS</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent sm:text-xs sm:tracking-[0.25em]">Sign</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/admin/login" className="hidden sm:block text-sm font-semibold text-white/60 hover:text-white">
                Sign in
              </Link>
              <Link
                href="/admin/signup"
                className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white transition hover:bg-accent-deep glow-accent sm:px-4"
              >
                <span className="sm:hidden">Sign up</span>
                <span className="hidden sm:inline">Create free account</span>
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="border-b border-white/10 bg-white/[0.02]">
          <div className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent">Docs</p>
            <h1 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl lg:text-5xl">
              Documentation
            </h1>
            <p className="mt-4 max-w-2xl text-base text-white/60 sm:text-lg">
              Everything you need to use Studio Happens Sign, set it up for your team, or run your own copy.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#using-sign" className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold transition hover:bg-white/10">
                Using the app
              </a>
              <a href="#settings" className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold transition hover:bg-white/10">
                Settings
              </a>
              <a href="#self-hosting" className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold transition hover:bg-white/10">
                Self-hosting
              </a>
              <a href="#troubleshooting" className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold transition hover:bg-white/10">
                Troubleshooting
              </a>
            </div>
          </div>
        </section>

        {/* Body: sidebar + content */}
        <div className="mx-auto max-w-6xl px-5 py-12 lg:flex lg:gap-16">

          {/* Sidebar TOC */}
          <aside className="hidden lg:block">
            <div className="sticky top-8 w-56 shrink-0">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/30">On this page</p>
              <nav className="space-y-0.5">
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`block rounded-lg py-1.5 text-sm transition hover:text-white ${
                      item.href.startsWith("#sh-") || item.href === "#guest-mode" || item.href === "#create-account" || item.href === "#upload" || item.href === "#fields" || item.href === "#send" || item.href === "#email-notifications" || item.href === "#agency-signature" || item.href === "#byo-supabase"
                        ? "pl-5 text-white/40"
                        : "pl-2 font-semibold text-white/60"
                    }`}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="min-w-0 flex-1 space-y-16">

            {/* ── Using the app ── */}
            <Section id="using-sign" title="Using Studio Happens Sign">

              <SubSection id="guest-mode" title="Guest mode (no account needed)">
                <p>
                  You don&apos;t need an account to send a document. Go to the{" "}
                  <Link href="/guest" className="text-accent hover:underline">guest page</Link>,
                  upload a PDF, place signature fields, and share the link. The whole thing takes about 90 seconds.
                </p>
                <p>
                  Guest documents are stored for 30 days. After that, both the original and the signed copy are deleted automatically. Download your copy before the window closes.
                </p>
                <Callout type="info">
                  Guest mode is good for one-off documents. If you send documents regularly, create a free account to get a dashboard with document history, email notifications, and a reusable agency signature.
                </Callout>
              </SubSection>

              <SubSection id="create-account" title="Creating an account">
                <p>
                  Go to{" "}
                  <Link href="/admin/signup" className="text-accent hover:underline">/admin/signup</Link>{" "}
                  and enter your email and a password. You&apos;ll get a 6-digit verification code by email. Enter it to confirm your address and you&apos;re in.
                </p>
                <p>
                  After sign-up, the app asks you to connect storage before you can upload documents. You have two options:
                </p>
                <ul className="ml-4 list-disc space-y-1">
                  <li>Use Studio Happens hosting (if enabled by the platform admin)</li>
                  <li>
                    Connect your own Supabase project — see{" "}
                    <a href="#byo-supabase" className="text-accent hover:underline">Bring your own Supabase</a>
                  </li>
                </ul>
              </SubSection>

              <SubSection id="upload" title="Uploading a document">
                <p>
                  From the dashboard, click "Upload document" and select a PDF. The file uploads to storage and the editor opens automatically.
                </p>
                <p>
                  Flat PDFs (scanned or printed) work best. PDFs with interactive form fields may not render correctly in the signing page.
                </p>
                <Callout type="info">
                  Each account has a 250 MB storage cap across all documents. Documents auto-delete at 30 days, so space clears on its own. You can also delete documents early from the dashboard.
                </Callout>
              </SubSection>

              <SubSection id="fields" title="Placing signature fields">
                <p>
                  In the editor, click anywhere on the PDF page to drop a field. You can place four types:
                </p>
                <ul className="ml-4 list-disc space-y-1.5">
                  <li>
                    <span className="font-medium text-white">Signature</span> — a drawn signature box your client fills in
                  </li>
                  <li>
                    <span className="font-medium text-white">Name</span> — a text field the signer types their name into
                  </li>
                  <li>
                    <span className="font-medium text-white">Date</span> — auto-filled with the date the document is signed
                  </li>
                  <li>
                    <span className="font-medium text-white">Agency signature</span> — your saved agency signature, stamped automatically at signing time (no extra step required)
                  </li>
                </ul>
                <p>Drag fields to reposition them. Click a field and press the delete icon to remove it.</p>
                <p>You can place fields across multiple pages. The editor shows all pages of the PDF.</p>
              </SubSection>

              <SubSection id="send" title="Sending the link and after signing">
                <p>
                  Click "Send" to generate a signing link. Copy the link and send it to your client by email, WhatsApp, or however you prefer. There&apos;s nothing else to set up — the link works immediately.
                </p>
                <p>
                  When the client opens the link, they see the PDF with all fields highlighted. They draw their signature with a mouse or finger, fill any name or date fields, and hit Submit.
                </p>
                <p>
                  After submitting, the signed PDF is available for download on the same page. If you&apos;ve configured email notifications, the signed PDF is also emailed to you automatically.
                </p>
                <p>
                  The document status in your dashboard changes from "sent" to "signed" once the client submits.
                </p>
              </SubSection>
            </Section>

            <div className="border-t border-white/10" />

            {/* ── Settings ── */}
            <Section id="settings" title="Settings">

              <SubSection id="email-notifications" title="Email notifications">
                <p>
                  By default, the app doesn&apos;t send any emails when a client signs. To turn this on, you need a Resend API key.
                </p>
                <ol className="ml-4 list-decimal space-y-1.5">
                  <li>
                    Create a free account at{" "}
                    <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                      resend.com
                    </a>
                  </li>
                  <li>Go to API Keys and create a key with send permissions</li>
                  <li>In the app, go to Settings and paste the key under "Email notifications"</li>
                  <li>Optionally set a custom "From" address (requires a verified domain in Resend)</li>
                  <li>Optionally set an "Always CC" address to copy every signed PDF to a fixed inbox</li>
                </ol>
                <Callout type="info">
                  If you don&apos;t verify a custom domain in Resend, emails come from the Resend sandbox address. This works for testing, but some mail clients may flag it. To send from your own domain, verify it in the Resend dashboard first.
                </Callout>
              </SubSection>

              <SubSection id="agency-signature" title="Agency signature">
                <p>
                  In Settings, you can draw a signature that represents your agency or company. Use the drawing pad to sign, then click Save.
                </p>
                <p>
                  Once saved, add an "Agency signature" field to any document. When the client signs, your agency signature stamps into that field at the same time. You don&apos;t need to sign separately after the client.
                </p>
                <p>
                  The downloaded PDF contains both the client&apos;s signature and your agency signature.
                </p>
              </SubSection>

              <SubSection id="byo-supabase" title="Bring your own Supabase (BYO mode)">
                <p>
                  By default on Studio Happens hosting, documents go into a shared storage instance. If you&apos;d rather keep documents in your own Supabase project, you can connect it from Settings.
                </p>
                <ol className="ml-4 list-decimal space-y-1.5">
                  <li>
                    Create a Supabase project at{" "}
                    <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                      supabase.com
                    </a>{" "}
                    (the free tier is enough)
                  </li>
                  <li>
                    In the Supabase SQL editor, run the contents of{" "}
                    <a
                      href="https://github.com/Niranjan-M-T/studio-happens-sign/blob/master/db/schema.sql"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline"
                    >
                      db/schema.sql
                    </a>
                  </li>
                  <li>
                    In Storage, create a private bucket named <InlineCode>documents</InlineCode>
                  </li>
                  <li>
                    Go to Project Settings &rarr; API and copy the Project URL and service-role key
                  </li>
                  <li>In the app, go to Settings &rarr; Supabase connection and paste both</li>
                </ol>
                <p>
                  Your documents will now go into your own bucket. The service-role key is encrypted with AES-256-GCM before being stored, and is never returned to the browser.
                </p>
                <Callout type="warn">
                  The service-role key grants full admin access to your Supabase project. Use a dedicated project for documents, not the same one that holds your other app data.
                </Callout>
              </SubSection>
            </Section>

            <div className="border-t border-white/10" />

            {/* ── Self-hosting ── */}
            <Section id="self-hosting" title="Self-hosting">
              <p className="text-sm leading-relaxed text-white/70">
                Studio Happens Sign is MIT-licensed. You can run your own copy on any Node.js host. The guide below uses Render, but Vercel, Railway, and Fly.io all work with minor adjustments.
              </p>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-sm text-white/70">
                <p className="font-semibold text-white">What you need</p>
                <ul className="mt-3 ml-4 list-disc space-y-1">
                  <li>A GitHub account (to fork the repo)</li>
                  <li>Two Supabase projects: one for the control plane, one for document storage</li>
                  <li>A Resend account for sending verification and notification emails</li>
                  <li>A hosting platform (Render free tier works)</li>
                </ul>
              </div>

              <SubSection id="sh-step-1" title="Step 1: Fork the repository">
                <p>
                  Fork{" "}
                  <a
                    href="https://github.com/Niranjan-M-T/studio-happens-sign"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    github.com/Niranjan-M-T/studio-happens-sign
                  </a>{" "}
                  and clone it locally. All environment variables are injected at runtime, so you don&apos;t need to touch the source code to deploy.
                </p>
                <CodeBlock>{`git clone https://github.com/<your-username>/studio-happens-sign.git
cd studio-happens-sign
npm install`}</CodeBlock>
              </SubSection>

              <SubSection id="sh-step-2" title="Step 2: Control plane Supabase">
                <p>
                  The control plane holds only agency accounts, encrypted connection settings, and reusable signatures. Documents do not live here.
                </p>
                <ol className="ml-4 list-decimal space-y-1.5">
                  <li>
                    Create a new project at{" "}
                    <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                      supabase.com
                    </a>
                  </li>
                  <li>Go to Authentication &rarr; Providers and make sure Email is enabled</li>
                  <li>
                    In the SQL editor, run the contents of{" "}
                    <a
                      href="https://github.com/Niranjan-M-T/studio-happens-sign/blob/master/db/control-schema.sql"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline"
                    >
                      db/control-schema.sql
                    </a>
                  </li>
                  <li>Go to Project Settings &rarr; API and note down the Project URL, anon key, and service-role key</li>
                </ol>
                <Callout type="info">
                  Supabase Auth handles email verification for sign-up and password resets. The verification emails use your <InlineCode>RESEND_API_KEY</InlineCode> — set that in Step 4 before testing.
                </Callout>
              </SubSection>

              <SubSection id="sh-step-3" title="Step 3: Data plane Supabase">
                <p>
                  The data plane holds <InlineCode>documents</InlineCode> and <InlineCode>signature_fields</InlineCode> rows, plus the PDF files in storage. You can use a second supabase.com project or self-host one on a VPS.
                </p>
                <ol className="ml-4 list-decimal space-y-1.5">
                  <li>Create a second Supabase project</li>
                  <li>
                    In the SQL editor, run{" "}
                    <a
                      href="https://github.com/Niranjan-M-T/studio-happens-sign/blob/master/db/schema.sql"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline"
                    >
                      db/schema.sql
                    </a>
                  </li>
                  <li>
                    In Storage, click "New bucket", name it <InlineCode>documents</InlineCode>, and keep Public off
                  </li>
                  <li>Go to Project Settings &rarr; API and note down the Project URL and service-role key</li>
                </ol>
                <Callout type="warn">
                  If you self-host the data plane on Coolify or another VPS, use the public-facing HTTPS URL for <InlineCode>HOSTED_SUPABASE_URL</InlineCode>, not the internal container URL. POST requests to an <InlineCode>http://</InlineCode> URL that redirects to HTTPS will fail for storage operations because HTTP 301 redirects convert POST to GET.
                </Callout>
              </SubSection>

              <SubSection id="sh-step-4" title="Step 4: Resend API key">
                <p>
                  Resend sends two types of emails: auth OTP codes (sign-up verification, password changes) and signed PDF notifications (when a client signs a document).
                </p>
                <ol className="ml-4 list-decimal space-y-1.5">
                  <li>
                    Create an account at{" "}
                    <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                      resend.com
                    </a>{" "}
                    (free tier: 3,000 emails/month)
                  </li>
                  <li>Go to API Keys and create one with send permissions</li>
                  <li>
                    Optionally verify a custom domain in Resend &rarr; Domains so you can send from your own address
                  </li>
                </ol>
              </SubSection>

              <SubSection id="sh-step-5" title="Step 5: Environment variables">
                <p>
                  Copy <InlineCode>.env.example</InlineCode> to <InlineCode>.env.local</InlineCode> for local development.
                  On Render, add these in the Environment tab of your web service.
                </p>
                <CodeBlock>{`# ── Control plane Supabase ──────────────────────────────────
# Holds only the agencies table. No documents live here.
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# ── Secrets ─────────────────────────────────────────────────
# 32-byte base64 key for encrypting agency Supabase/Resend keys at rest.
# Generate with:
#   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
ENCRYPTION_KEY=

# Random secret for signing session JWTs.
# Generate with:
#   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
AUTH_SECRET=

# ── Hosted data plane (optional) ────────────────────────────
# A shared Supabase instance agencies can use without connecting their own.
# Leave blank to disable the "use Studio Happens hosting" option.
# Must be the HTTPS URL — http:// URLs break storage POST requests.
HOSTED_SUPABASE_URL=https://api.your-domain.com
HOSTED_SUPABASE_SERVICE_KEY=eyJ...
HOSTED_SUPABASE_BUCKET=documents

# ── Resend ──────────────────────────────────────────────────
# Used for OTP emails (sign-up, password change) and signed PDF notifications.
RESEND_API_KEY=re_...
# From address — must match a domain verified in Resend, or leave as default.
RESEND_FROM=Studio Happens Sign <hello@yourdomain.com>

# ── Guest mode ──────────────────────────────────────────────
# Separate bucket in the control plane Supabase for no-login guest documents.
GUEST_STORAGE_BUCKET=guest-documents
# Secret to protect the cleanup endpoint. Set this before going live.
CLEANUP_SECRET=

# ── App ─────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://your-app.onrender.com`}</CodeBlock>
              </SubSection>

              <SubSection id="sh-step-6" title="Step 6: Deploy to Render">
                <ol className="ml-4 list-decimal space-y-1.5">
                  <li>
                    Go to{" "}
                    <a href="https://render.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                      render.com
                    </a>{" "}
                    and click New &rarr; Web Service
                  </li>
                  <li>Connect your GitHub fork</li>
                  <li>
                    Set the following:
                    <ul className="mt-1.5 ml-4 list-disc space-y-1">
                      <li>Runtime: Node</li>
                      <li>Build command: <InlineCode>npm install && npm run build</InlineCode></li>
                      <li>Start command: <InlineCode>npm start</InlineCode></li>
                    </ul>
                  </li>
                  <li>Add all environment variables from Step 5 in the Environment tab</li>
                  <li>Click Create Web Service</li>
                </ol>
                <p>
                  The first deploy takes a few minutes. Once it&apos;s live, go to <InlineCode>/admin/signup</InlineCode> on your new URL and create your account.
                </p>
                <Callout type="info">
                  Render&apos;s free tier spins down after 15 minutes of inactivity. The first request after spin-down takes 30 to 60 seconds. For production use, upgrade to a paid instance or use Vercel, which doesn&apos;t spin down.
                </Callout>
              </SubSection>

              <SubSection id="sh-step-7" title="Step 7: Create the guest-documents bucket">
                <p>
                  Guest mode (the no-login upload flow) uses a separate bucket in your control plane Supabase. Without this bucket, the guest page will error on upload.
                </p>
                <ol className="ml-4 list-decimal space-y-1.5">
                  <li>Open your control plane Supabase and go to Storage</li>
                  <li>
                    Create a private bucket named <InlineCode>guest-documents</InlineCode>
                  </li>
                  <li>
                    In Render, set <InlineCode>GUEST_STORAGE_BUCKET=guest-documents</InlineCode> and redeploy
                  </li>
                </ol>
              </SubSection>

              <SubSection id="sh-step-8" title="Step 8: Set up daily cleanup">
                <p>
                  Documents auto-delete 30 days after upload. The deletion runs when <InlineCode>/api/cleanup</InlineCode> is called. You need an external cron job to call it daily.
                </p>
                <ol className="ml-4 list-decimal space-y-1.5">
                  <li>
                    In Render, set <InlineCode>CLEANUP_SECRET=some-random-string</InlineCode> and redeploy
                  </li>
                  <li>
                    Go to{" "}
                    <a href="https://cron-job.org" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                      cron-job.org
                    </a>{" "}
                    and create a free account
                  </li>
                  <li>
                    Create a cron job with a daily schedule targeting:
                    <CodeBlock>{`https://your-app.onrender.com/api/cleanup?secret=some-random-string`}</CodeBlock>
                  </li>
                </ol>
              </SubSection>
            </Section>

            <div className="border-t border-white/10" />

            {/* ── Troubleshooting ── */}
            <Section id="troubleshooting" title="Troubleshooting">
              <p className="text-sm leading-relaxed text-white/70">
                Common errors and how to fix them. If your issue isn&apos;t listed here,{" "}
                <a href="mailto:studiohappens26@gmail.com" className="text-accent hover:underline">
                  email support
                </a>{" "}
                or{" "}
                <a
                  href="https://github.com/Niranjan-M-T/studio-happens-sign/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  open a GitHub issue
                </a>
                .
              </p>

              <div className="space-y-3">

                <TroubleshootItem q='"Bucket not found" when uploading a document'>
                  <p>
                    This error comes from the storage API when the bucket name doesn&apos;t exist in the Supabase instance the app is connecting to. There are three common causes:
                  </p>
                  <p className="font-medium text-white/90 mt-2">For self-hosters with a hosted data plane:</p>
                  <p>
                    Check that <InlineCode>HOSTED_SUPABASE_URL</InlineCode> uses <InlineCode>https://</InlineCode> and not <InlineCode>http://</InlineCode>. POST requests to an HTTP URL that redirects to HTTPS get downgraded to GET, causing the storage API to return "Bucket not found" instead of the upload URL.
                  </p>
                  <CodeBlock>{`# Wrong
HOSTED_SUPABASE_URL=http://api-sign.your-domain.com

# Correct
HOSTED_SUPABASE_URL=https://api-sign.your-domain.com`}</CodeBlock>
                  <p className="font-medium text-white/90 mt-3">Wrong service key:</p>
                  <p>
                    Supabase storage returns "Bucket not found" (not "Unauthorized") when the JWT is signed with the wrong secret. Go to your Supabase project &rarr; Project Settings &rarr; API and copy the service-role key again. Paste it into <InlineCode>HOSTED_SUPABASE_SERVICE_KEY</InlineCode> in Render and redeploy.
                  </p>
                  <p className="font-medium text-white/90 mt-3">For BYO Supabase users:</p>
                  <p>
                    Open your Supabase project &rarr; Storage and confirm a bucket named <InlineCode>documents</InlineCode> exists and is set to private. If it doesn&apos;t exist, create it. The bucket name must match <InlineCode>agency.supabase_bucket</InlineCode> in your account settings (default: <InlineCode>documents</InlineCode>).
                  </p>
                </TroubleshootItem>

                <TroubleshootItem q='"Connect your database first" on the dashboard'>
                  <p>
                    Your account is in BYO mode with no Supabase connection configured. Go to Settings and either:
                  </p>
                  <ul className="ml-4 list-disc space-y-1 mt-2">
                    <li>Paste a Supabase project URL and service-role key, then click Save</li>
                    <li>Or ask the platform admin to switch your account to hosted mode</li>
                  </ul>
                  <p className="mt-2">
                    After saving, the Settings page runs a test query to confirm the connection works before accepting the key.
                  </p>
                </TroubleshootItem>

                <TroubleshootItem q="Email notifications not arriving after a client signs">
                  <p>Check these in order:</p>
                  <ol className="ml-4 list-decimal space-y-1.5 mt-2">
                    <li>
                      Go to Settings and confirm the Resend API key is saved. The field shows "connected" when a key is set.
                    </li>
                    <li>
                      Check that the document has an email address in the Notify field. Open the document from the dashboard and check the notify addresses.
                    </li>
                    <li>
                      In your Resend dashboard, go to Emails and look for any failed sends. Resend shows the error reason (e.g. invalid From address, domain not verified).
                    </li>
                    <li>
                      If you&apos;re using a custom From address, verify that domain in Resend &rarr; Domains. Unverified domains cause sends to fail silently in some configurations.
                    </li>
                  </ol>
                </TroubleshootItem>

                <TroubleshootItem q='Signing link shows 404 or "document not found"'>
                  <p>Two things to check:</p>
                  <ol className="ml-4 list-decimal space-y-1.5 mt-2">
                    <li>
                      The document may have been deleted (either manually by the sender or by the 30-day auto-cleanup). Documents cannot be recovered after deletion.
                    </li>
                    <li>
                      The URL may have been truncated when copying. The signing token at the end of the URL must be complete. Copy the full URL again from the dashboard.
                    </li>
                  </ol>
                </TroubleshootItem>

                <TroubleshootItem q="Guest mode fails on upload">
                  <p>
                    Guest mode uses a separate bucket in the control plane Supabase. If this bucket doesn&apos;t exist, guest uploads fail with a storage error.
                  </p>
                  <ol className="ml-4 list-decimal space-y-1.5 mt-2">
                    <li>
                      Open your control plane Supabase &rarr; Storage
                    </li>
                    <li>
                      Create a private bucket named <InlineCode>guest-documents</InlineCode>
                    </li>
                    <li>
                      In Render, confirm <InlineCode>GUEST_STORAGE_BUCKET=guest-documents</InlineCode> is set and redeploy
                    </li>
                  </ol>
                </TroubleshootItem>

                <TroubleshootItem q="Storage usage shows 0 MB even after uploading">
                  <p>
                    The storage usage meter reads from the <InlineCode>file_size_bytes</InlineCode> column on the <InlineCode>documents</InlineCode> table. If this column is missing, usage shows as zero.
                  </p>
                  <p className="mt-2">
                    Run this migration in your Supabase SQL editor (both control plane and data plane if using hosted mode):
                  </p>
                  <CodeBlock>{`alter table documents
  add column if not exists file_size_bytes bigint not null default 0;`}</CodeBlock>
                  <p className="mt-2">
                    The migration is a no-op on fresh installs that already include this column.
                  </p>
                </TroubleshootItem>

                <TroubleshootItem q="Upload returns a 500 error with no message">
                  <p>Open the browser dev tools &rarr; Network tab and click the failed request to see the full response body. Common causes:</p>
                  <ul className="ml-4 list-disc space-y-1.5 mt-2">
                    <li>
                      <InlineCode>HOSTED_SUPABASE_URL</InlineCode> or <InlineCode>HOSTED_SUPABASE_SERVICE_KEY</InlineCode> is not set in Render
                    </li>
                    <li>
                      <InlineCode>ENCRYPTION_KEY</InlineCode> is missing, causing the BYO key decryption to fail
                    </li>
                    <li>
                      The <InlineCode>file_size_bytes</InlineCode> column is missing from the documents table (run the migration above)
                    </li>
                    <li>
                      The Supabase project is paused (free tier projects pause after a week of inactivity on supabase.com)
                    </li>
                  </ul>
                </TroubleshootItem>

                <TroubleshootItem q="Supabase free tier project is paused">
                  <p>
                    Supabase pauses free tier projects after one week without a database request. When paused, all API calls return errors.
                  </p>
                  <p className="mt-2">
                    To unpause: go to your Supabase project dashboard and click "Restore project." It takes a minute or two to come back online.
                  </p>
                  <p className="mt-2">
                    To avoid this, make at least one database request per week (even a simple health check), or upgrade to a paid Supabase plan.
                  </p>
                </TroubleshootItem>

                <TroubleshootItem q="Password reset email not arriving">
                  <p>
                    Password reset emails go through Supabase Auth, which uses your <InlineCode>RESEND_API_KEY</InlineCode>.
                  </p>
                  <ol className="ml-4 list-decimal space-y-1.5 mt-2">
                    <li>
                      Confirm <InlineCode>RESEND_API_KEY</InlineCode> is set in Render (not the per-agency key in Settings, but the platform-level key in your env vars)
                    </li>
                    <li>
                      In Supabase &rarr; Authentication &rarr; SMTP settings, confirm Resend is configured as the email provider
                    </li>
                    <li>Check your spam folder</li>
                    <li>
                      Check Resend &rarr; Emails for any failed sends with error details
                    </li>
                  </ol>
                </TroubleshootItem>

                <TroubleshootItem q='Build fails with "Cannot find module" or TypeScript error'>
                  <p>
                    Run the TypeScript check locally first:
                  </p>
                  <CodeBlock>{`npx tsc --noEmit`}</CodeBlock>
                  <p className="mt-2">
                    If the error mentions a missing environment variable type, make sure your <InlineCode>.env.local</InlineCode> has all variables from <InlineCode>.env.example</InlineCode> filled in. The build reads from env vars at compile time for certain features.
                  </p>
                </TroubleshootItem>

              </div>
            </Section>

            {/* Still need help */}
            <div className="rounded-2xl border border-accent/30 bg-accent/5 p-8 text-center">
              <h2 className="font-display text-2xl tracking-tight">Still stuck?</h2>
              <p className="mt-3 text-white/60">
                Open a GitHub issue with the exact error message and the steps you took. That makes it much faster to track down.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                <a
                  href="mailto:studiohappens26@gmail.com"
                  className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-deep glow-accent"
                >
                  Email support
                </a>
                <a
                  href="https://github.com/Niranjan-M-T/studio-happens-sign/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold transition hover:bg-white/10"
                >
                  Open a GitHub issue
                </a>
              </div>
            </div>

          </main>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl px-5 py-8">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div>
                <span className="font-display text-sm tracking-tight">STUDIO HAPPENS SIGN</span>
                <p className="mt-0.5 text-xs text-white/40">Free document signing. Open source.</p>
              </div>
              <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-white/50 sm:justify-end">
                <Link href="/" className="hover:text-white">Home</Link>
                <Link href="/faq" className="hover:text-white">FAQ</Link>
                <Link href="/contact" className="hover:text-white">Contact</Link>
                <Link href="/guest" className="hover:text-white">Sign a document</Link>
                <Link href="/admin/signup" className="hover:text-white">Create account</Link>
                <a
                  href="https://github.com/Niranjan-M-T/studio-happens-sign"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  GitHub
                </a>
              </div>
            </div>
            <p className="mt-6 text-center text-xs text-white/30">
              Designed and built by{" "}
              <a
                href="https://studiohappens.tech"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white/60"
              >
                Studio Happens
              </a>
              , a creative and marketing agency.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
