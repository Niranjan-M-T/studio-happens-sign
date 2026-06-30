import Link from "next/link";
import type { Metadata } from "next";
import DotFieldBg from "@/components/DotFieldBg";

export const metadata: Metadata = {
  title: "Studio Happens Sign — Free Document Signing, No Account Needed",
  description:
    "Sign PDF documents online for free. No account required. Upload a PDF, place signature fields, share a link. Your client signs from any phone in seconds.",
  alternates: { canonical: "https://sign.studiohappens.tech" },
};

const appSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": "https://sign.studiohappens.tech/#app",
  name: "Studio Happens Sign",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Document Signing",
  operatingSystem: "Any (web browser)",
  url: "https://sign.studiohappens.tech",
  description:
    "Upload a PDF, place signature fields, and share a signing link. Recipients sign from any browser with no account required. Documents are deleted after 30 days.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "PDF document signing",
    "No account required for signers",
    "Mobile-friendly signing page",
    "Reusable agency counter-signature",
    "Email notifications via Resend",
    "Bring your own Supabase database",
    "30-day auto-deletion",
    "Open source, MIT licensed",
    "250 MB storage per account",
  ],
  publisher: { "@id": "https://sign.studiohappens.tech/#organization" },
  creator: {
    "@type": "Organization",
    name: "Studio Happens",
    url: "https://studiohappens.tech",
    description: "Creative and marketing agency",
  },
  license: "https://opensource.org/licenses/MIT",
  codeRepository: "https://github.com/Niranjan-M-T/open-sign",
  isPartOf: { "@id": "https://sign.studiohappens.tech/#website" },
};

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-ink text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }}
      />
      <DotFieldBg />
      <div className="relative z-10">

      {/* Nav */}
      <nav className="border-b border-white/10 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex items-center gap-2">
            <span className="font-display text-base tracking-tight sm:text-xl whitespace-nowrap">STUDIO HAPPENS</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent sm:text-xs sm:tracking-[0.25em]">Sign</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/login"
              className="hidden sm:block text-sm font-semibold text-white/60 hover:text-white"
            >
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
      <section className="mx-auto max-w-5xl px-5 py-12 text-center sm:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent sm:text-sm">
          Free document signing
        </p>
        <h1 className="mt-4 font-display text-4xl tracking-tight sm:text-5xl lg:text-6xl">
          Sign documents.<br />No account needed.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-white/70 sm:mt-6 sm:text-lg">
          Upload a PDF, drop in signature fields, share the link. Your client
          opens it on their phone and signs. You both get the signed copy.
          No credit card, no subscription, no friction.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:mt-10 sm:flex-row sm:justify-center sm:gap-4">
          <Link
            href="/guest"
            className="w-full rounded-xl bg-accent px-8 py-3.5 text-base font-semibold text-white transition hover:bg-accent-deep glow-accent sm:w-auto"
          >
            Sign a document now
          </Link>
          <Link
            href="/admin/signup"
            className="w-full rounded-xl border border-white/20 px-8 py-3.5 text-base font-semibold transition hover:bg-white/10 sm:w-auto"
          >
            Create free account
          </Link>
        </div>
        <p className="mt-5 text-xs text-white/40 sm:text-sm">
          No signup required to send. Documents auto-deleted after 30 days.
        </p>
      </section>

      {/* How it works */}
      <section className="border-t border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
          <h2 className="text-center font-display text-2xl tracking-tight sm:text-3xl">
            How it works
          </h2>
          <p className="mt-2 text-center text-sm text-white/60 sm:text-base">
            From upload to signed in under two minutes.
          </p>
          <div className="mt-10 grid gap-6 sm:mt-12 sm:grid-cols-3 sm:gap-8">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-xl font-bold text-accent">
                1
              </div>
              <h3 className="mt-4 font-semibold">Upload your PDF</h3>
              <p className="mt-2 text-sm text-white/60">
                Drag in any PDF. Contracts, NDAs, invoices, whatever needs a
                signature.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-xl font-bold text-accent">
                2
              </div>
              <h3 className="mt-4 font-semibold">Place signature fields</h3>
              <p className="mt-2 text-sm text-white/60">
                Click to drop a signature box, name field, or date onto the
                right spot on the page.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-xl font-bold text-accent">
                3
              </div>
              <h3 className="mt-4 font-semibold">Share the link</h3>
              <p className="mt-2 text-sm text-white/60">
                Send it by email, WhatsApp, anything. Your client opens it and
                signs. You both download the signed PDF.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
        <h2 className="font-display text-2xl tracking-tight sm:text-3xl">
          Everything you need. Nothing you don't.
        </h2>
        <p className="mt-2 text-white/60">
          Built for agencies and freelancers who need a fast, free way to get
          documents signed.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Free, no tricks",
              body: "No monthly fee, no per-document charge, no watermark. Free means free.",
            },
            {
              title: "Works on any phone",
              body: "The signing page is built for mobile. Clients draw their signature with a finger. No app to install.",
            },
            {
              title: "No account to send",
              body: "Upload a document and share a signing link without creating an account. Takes about 90 seconds.",
            },
            {
              title: "Signed PDF by email",
              body: "When your client signs, the stamped PDF goes straight to your inbox. Add your Resend key in settings to enable.",
            },
            {
              title: "Agency signature",
              body: "Save a reusable signature for your agency. It gets stamped onto the document automatically when the client signs.",
            },
            {
              title: "Auto-deleted after 30 days",
              body: "Documents are stored for 30 days from the date sent. Download your copy any time before then.",
            },
            {
              title: "Bring your own database",
              body: "Connect your own Supabase project and your documents never touch our servers.",
            },
            {
              title: "Open source",
              body: "All the code is on GitHub. MIT license. Host it yourself if you want full control.",
            },
            {
              title: "Secure links",
              body: "Every signing link is a unique token. No guessable IDs. Documents can't be accessed without the exact link.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-5"
            >
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-white/60">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Agency CTA */}
      <section className="border-t border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-3xl px-5 py-12 text-center sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent sm:text-sm">
            For agencies
          </p>
          <h2 className="mt-3 font-display text-2xl tracking-tight sm:text-3xl">
            Want a proper dashboard?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm text-white/70 sm:text-base">
            Create a free account and get a dashboard where you track all your
            documents, save a reusable agency signature, connect your own
            Supabase, and get email notifications every time a client signs.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <Link
              href="/admin/signup"
              className="w-full rounded-xl bg-accent px-8 py-3.5 text-base font-semibold text-white transition hover:bg-accent-deep glow-accent sm:w-auto"
            >
              Create free account
            </Link>
            <a
              href="https://github.com/Niranjan-M-T/open-sign"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full rounded-xl border border-white/20 px-8 py-3.5 text-base font-semibold transition hover:bg-white/10 sm:w-auto"
            >
              View source on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
        <h2 className="text-center font-display text-2xl tracking-tight sm:text-3xl">
          Why not just use DocuSign?
        </h2>
        <p className="mt-3 text-center text-sm text-white/60 sm:text-base">
          DocuSign's free plan gives you 3 documents a month, then $15/month.
          Studio Happens Sign is free, unlimited, and you can self-host it.
        </p>
        <div className="mt-8 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[420px] text-sm">
            <thead className="bg-white/[0.04]">
              <tr>
                <th className="px-4 py-3 text-left text-white/60 sm:px-5">Feature</th>
                <th className="px-4 py-3 text-left text-accent sm:px-5">Us</th>
                <th className="px-4 py-3 text-left text-white/40 sm:px-5">DocuSign</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {[
                ["Price", "Free", "$15/month"],
                ["Documents/month", "Unlimited", "5 on free, then paid"],
                ["No account to sign", "Yes", "No"],
                ["Self-hostable", "Yes (MIT)", "No"],
                ["Own storage", "Yes", "No"],
                ["Mobile signing", "Yes", "Partially"],
              ].map(([feat, ours, theirs]) => (
                <tr key={feat}>
                  <td className="px-4 py-3 text-white/70 sm:px-5">{feat}</td>
                  <td className="px-4 py-3 font-semibold text-white sm:px-5">{ours}</td>
                  <td className="px-4 py-3 text-white/40 sm:px-5">{theirs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-5xl px-5 py-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div>
              <span className="font-display text-sm tracking-tight">STUDIO HAPPENS SIGN</span>
              <p className="mt-0.5 text-xs text-white/40">
                Free document signing platform. Open source.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-white/50 sm:justify-end">
              <Link href="/admin/login" className="hover:text-white">Sign in</Link>
              <Link href="/admin/signup" className="hover:text-white">Create account</Link>
              <Link href="/guest" className="hover:text-white">Sign a document</Link>
              <Link href="/faq" className="hover:text-white">FAQ</Link>
              <Link href="/docs" className="hover:text-white">Docs</Link>
              <Link href="/contact" className="hover:text-white">Contact</Link>
              <a
                href="https://github.com/Niranjan-M-T/open-sign"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                GitHub
              </a>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-white/30">
            Studio Happens Sign is a free, open-source document signing platform.
            Documents are auto-deleted 30 days after sending.{" "}
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
