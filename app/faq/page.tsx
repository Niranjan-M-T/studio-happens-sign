import Link from "next/link";
import type { Metadata } from "next";
import DotFieldBg from "@/components/DotFieldBg";

export const metadata: Metadata = {
  title: "FAQ & Support — Studio Happens Sign",
  description:
    "Answers to common questions about Studio Happens Sign — free document signing, storage, security, email notifications, and more.",
  alternates: { canonical: "https://sign.studiohappens.tech/faq" },
};

const faqs = [
  {
    q: "Is Studio Happens Sign really free?",
    a: "Yes, completely free. No credit card, no monthly fee, no per-document charge, and no watermarks on signed PDFs. The platform is also open source — you can self-host it if you want.",
  },
  {
    q: "Do I need an account to send a document?",
    a: "No. The guest mode lets you upload a PDF, place signature fields, and share a signing link in about 90 seconds — no signup required. Guest documents are stored for 30 days. If you want a persistent dashboard and document history, create a free account.",
  },
  {
    q: "Does my client need to install anything or create an account?",
    a: "No. Your client receives a link and opens it in their browser. The signing page works on any smartphone or desktop. They draw their signature with a finger or mouse, and the signed PDF is ready immediately.",
  },
  {
    q: "How long are documents stored?",
    a: "Documents are stored for 30 days from the date they were uploaded. After that, they are automatically and permanently deleted — the original PDF and the signed copy. Download your signed copy before the 30-day window closes.",
  },
  {
    q: "What happens to the 250 MB storage limit?",
    a: "Each account gets 250 MB of storage across all documents. Since documents are deleted after 30 days, space is freed automatically. You can also manually delete documents at any time from your dashboard to free up space earlier.",
  },
  {
    q: "Is my document secure?",
    a: "Documents are stored in a private Supabase Storage bucket — they can only be accessed via a signed URL that the server generates. Every signing link is a unique random token. The signed PDF is written directly into storage; no one else can view it without the exact link.",
  },
  {
    q: "What file types are supported?",
    a: "PDF only. For best results, use a flat PDF without form fields. Documents with interactive form fields may not render perfectly.",
  },
  {
    q: "Can my client sign on a phone?",
    a: "Yes. The signing page is built specifically for mobile. The PDF pages are scaled to fit the screen and clients draw their signature with their finger. No app install required.",
  },
  {
    q: "How do email notifications work?",
    a: "Studio Happens Sign can email the signed PDF automatically when a client signs. To enable it, add a free Resend API key in Settings. You can also add a 'From' address and an 'Always CC' address so the signed copy goes exactly where you need it.",
  },
  {
    q: "What is 'Bring Your Own Database'?",
    a: "By default, your documents are stored on Studio Happens hosting. If you prefer full control, you can connect your own Supabase project. Your files then go directly into your own storage bucket — they never touch our servers. The service-role key you paste in is encrypted at rest with AES-256-GCM and is never echoed back to the browser.",
  },
  {
    q: "What is an agency signature?",
    a: "In Settings → Your signature, you can draw a reusable signature for your agency. When you place an 'Agency signature' field on a document, that signature is stamped onto the PDF automatically when the client signs — so the final document is counter-signed by your agency without any extra steps.",
  },
  {
    q: "Can I counter-sign a document after the client signs?",
    a: "Yes. Place an 'Agency signature' field when you set up the document. When the client signs, your saved agency signature is stamped into that field at the same time. Download the signed PDF — it contains both signatures.",
  },
  {
    q: "How do I delete a document?",
    a: "Open the document from your dashboard and click the delete button. This permanently removes the document row and all associated files from storage immediately.",
  },
  {
    q: "Can I self-host Studio Happens Sign?",
    a: "Yes. The full source code is on GitHub under the MIT licence. You'll need a Supabase project (for auth + control DB), a second Supabase project (for documents), a Resend account (for emails), and a hosting platform like Render or Vercel.",
  },
  {
    q: "Who built this?",
    a: "Studio Happens Sign was built by Studio Happens, a creative and tech studio. The source is public on GitHub.",
  },
];

export default function FaqPage() {
  return (
    <div className="relative min-h-screen bg-ink text-white">
      <DotFieldBg />

      <div className="relative z-10">
        {/* Nav */}
        <nav className="border-b border-white/10 backdrop-blur-sm">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-display text-xl tracking-tight">STUDIO HAPPENS</span>
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Sign</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/admin/login" className="text-sm font-semibold text-white/60 hover:text-white">
                Sign in
              </Link>
              <Link
                href="/admin/signup"
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-deep glow-accent"
              >
                Create free account
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
              href="mailto:a2zheavyequipments@gmail.com"
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
                href="mailto:a2zheavyequipments@gmail.com"
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
              <div className="flex items-center gap-6 text-sm text-white/50">
                <Link href="/" className="hover:text-white">Home</Link>
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
          </div>
        </footer>
      </div>
    </div>
  );
}
