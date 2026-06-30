import Link from "next/link";
import type { Metadata } from "next";
import DotFieldBg from "@/components/DotFieldBg";

export const metadata: Metadata = {
  title: "FAQ & Support",
  description:
    "Common questions about Studio Happens Sign: how signing works, storage limits, security, email notifications, self-hosting, and more.",
  alternates: { canonical: "https://sign.studiohappens.tech/faq" },
  openGraph: {
    title: "FAQ & Support — Studio Happens Sign",
    description:
      "Common questions about Studio Happens Sign: how signing works, storage limits, security, email notifications, self-hosting, and more.",
    url: "https://sign.studiohappens.tech/faq",
    type: "website",
  },
};

const faqs = [
  {
    q: "Is Studio Happens Sign really free?",
    a: "Yes. No credit card, no monthly fee, no per-document charge. Signed PDFs have no watermarks. The code is MIT-licensed and on GitHub if you want to host it yourself.",
  },
  {
    q: "Do I need an account to send a document?",
    a: "No. Guest mode lets you upload a PDF, drop in signature fields, and share a signing link in about 90 seconds with no login. Guest documents are stored for 30 days. For a persistent dashboard and document history, create a free account.",
  },
  {
    q: "Does my client need to install anything or create an account?",
    a: "No. Your client gets a link, opens it in their browser, and draws their signature with a finger (or a mouse on desktop). The signed PDF is ready as soon as they submit.",
  },
  {
    q: "How long are documents stored?",
    a: "Documents are stored for 30 days from the date uploaded. After that, the server deletes both the original PDF and the signed copy. Download your copy before the window closes.",
  },
  {
    q: "What happens to the 250 MB storage limit?",
    a: "Each account has a 250 MB storage cap across all documents. Documents auto-delete at 30 days, so space clears on its own. You can also delete documents from the dashboard whenever you want.",
  },
  {
    q: "Is my document secure?",
    a: "Documents go into a private storage bucket with no public access. The only way to retrieve a file is through a time-limited signed URL the server generates on demand. Each signing link uses a unique random token. Nobody can view the PDF without the exact link.",
  },
  {
    q: "What file types are supported?",
    a: "PDF only. Flat PDFs work best. Interactive form fields may not render correctly.",
  },
  {
    q: "Can my client sign on a phone?",
    a: "Yes. The signing page is built for mobile. PDF pages scale to fit the screen and clients sign with a finger. No app to install.",
  },
  {
    q: "How do email notifications work?",
    a: "When a client signs, the platform can email the signed PDF immediately. To turn this on, add a Resend API key in Settings. You can set a From address and an Always CC address if you want copies sent to specific inboxes.",
  },
  {
    q: "What is 'Bring Your Own Database'?",
    a: "By default, your documents go into Studio Happens hosting. To store them in your own Supabase project instead, connect it in Settings. Your files then go straight into your own bucket and never touch our servers. The service-role key you paste in is encrypted with AES-256-GCM at rest and is never sent back to the browser.",
  },
  {
    q: "What is an agency signature?",
    a: "In Settings, you can draw and save a reusable signature for your agency. Add an Agency signature field to a document and that signature gets stamped in automatically when the client signs. No separate counter-signing step needed.",
  },
  {
    q: "Can I counter-sign a document after the client signs?",
    a: "Yes. Add an Agency signature field when you set up the document. When the client signs, your saved agency signature goes into that field at the same time. The downloaded PDF contains both signatures.",
  },
  {
    q: "How do I delete a document?",
    a: "Open the document from your dashboard and click Delete. The document and all its files are removed from storage right away.",
  },
  {
    q: "Can I self-host Studio Happens Sign?",
    a: "Yes. The full source code is on GitHub under the MIT licence. You need a Supabase project for auth and the control database, a second Supabase project for documents, a Resend account for emails, and a hosting platform like Render or Vercel.",
  },
  {
    q: "Who built this?",
    a: "Studio Happens Sign is built and maintained by Studio Happens, a creative and tech studio. The source code is public on GitHub.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": "https://sign.studiohappens.tech/faq#faqpage",
  url: "https://sign.studiohappens.tech/faq",
  name: "FAQ — Studio Happens Sign",
  isPartOf: { "@id": "https://sign.studiohappens.tech/#website" },
  mainEntity: faqs.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
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
      name: "FAQ",
      item: "https://sign.studiohappens.tech/faq",
    },
  ],
};

export default function FaqPage() {
  return (
    <div className="relative min-h-screen bg-ink text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <DotFieldBg />

      <div className="relative z-10">
        {/* Nav */}
        <nav className="border-b border-white/10 backdrop-blur-sm">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-5 sm:py-4">
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
        <section className="mx-auto max-w-3xl px-5 py-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent">
            Help & support
          </p>
          <h1 className="mt-4 font-display text-4xl tracking-tight sm:text-5xl">
            Frequently asked questions
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/60">
            Everything you need to know about Studio Happens Sign.
            Can&apos;t find an answer?{" "}
            <a
              href="mailto:studiohappens26@gmail.com"
              className="text-accent underline hover:text-accent-bright"
            >
              Email us
            </a>
            .
          </p>
        </section>

        {/* FAQ list */}
        <section className="mx-auto max-w-3xl px-5 pb-20">
          <div className="space-y-3">
            {faqs.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-4 backdrop-blur-sm open:bg-white/[0.05]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {item.q}
                  <span className="shrink-0 text-white/40 transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-white/70">{item.a}</p>
              </details>
            ))}
          </div>

          {/* Contact block */}
          <div className="mt-12 rounded-2xl border border-accent/30 bg-accent/5 p-8 text-center">
            <h2 className="font-display text-2xl tracking-tight">Still have a question?</h2>
            <p className="mt-3 text-white/60">
              Reach out by email or open an issue on GitHub. We typically reply within 24 hours.
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
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="mx-auto max-w-5xl px-5 py-8">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div>
                <span className="font-display text-sm tracking-tight">STUDIO HAPPENS SIGN</span>
                <p className="mt-0.5 text-xs text-white/40">Free document signing. Open source.</p>
              </div>
              <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-white/50 sm:justify-end">
                <Link href="/" className="hover:text-white">Home</Link>
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
