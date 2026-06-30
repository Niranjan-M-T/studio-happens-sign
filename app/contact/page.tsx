import Link from "next/link";
import type { Metadata } from "next";
import DotFieldBg from "@/components/DotFieldBg";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Studio Happens. Email us for support, questions about Studio Happens Sign, or anything else.",
  alternates: { canonical: "https://sign.studiohappens.tech/contact" },
  openGraph: {
    title: "Contact Us | Studio Happens Sign",
    description:
      "Get in touch with Studio Happens for support or general enquiries.",
    url: "https://sign.studiohappens.tech/contact",
    type: "website",
  },
};

const contactPageSchema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "@id": "https://sign.studiohappens.tech/contact#contactpage",
  url: "https://sign.studiohappens.tech/contact",
  name: "Contact Studio Happens",
  description:
    "Get in touch with Studio Happens for support, questions about Studio Happens Sign, or general enquiries.",
  isPartOf: { "@id": "https://sign.studiohappens.tech/#website" },
  breadcrumb: {
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
        name: "Contact",
        item: "https://sign.studiohappens.tech/contact",
      },
    ],
  },
};

const orgContactSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://sign.studiohappens.tech/#organization",
  name: "Studio Happens",
  url: "https://studiohappens.tech",
  email: "studiohappens26@gmail.com",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: "studiohappens26@gmail.com",
    availableLanguage: "English",
  },
  sameAs: [
    "https://studiohappens.tech",
    "https://github.com/Niranjan-M-T/studio-happens-sign",
  ],
};

export default function ContactPage() {
  return (
    <div className="relative min-h-screen bg-ink text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgContactSchema) }}
      />
      <DotFieldBg />

      <div className="relative z-10">
        {/* Nav */}
        <nav className="border-b border-white/10 backdrop-blur-sm">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-5 sm:py-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-display text-lg tracking-tight sm:text-xl">STUDIO HAPPENS</span>
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Sign</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/admin/login" className="text-sm font-semibold text-white/60 hover:text-white">
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
            Get in touch
          </p>
          <h1 className="mt-4 font-display text-4xl tracking-tight sm:text-5xl">
            Contact us
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/60">
            Questions about Studio Happens Sign, a bug report, or anything else.
            We reply within 24 hours.
          </p>
        </section>

        {/* Contact cards */}
        <section className="mx-auto max-w-3xl px-5 pb-20">
          <div className="grid gap-5 sm:grid-cols-2">

            {/* Email */}
            <a
              href="mailto:studiohappens26@gmail.com"
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-sm transition hover:border-accent/40 hover:bg-white/[0.06]"
            >
              <div className="flex items-start gap-4">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-semibold">Email</h2>
                  <p className="mt-1 text-sm text-white/50">
                    For support, questions, or feedback.
                  </p>
                  <p className="mt-3 text-sm font-medium text-accent group-hover:underline">
                    studiohappens26@gmail.com
                  </p>
                </div>
              </div>
            </a>

            {/* GitHub Issues */}
            <a
              href="https://github.com/Niranjan-M-T/studio-happens-sign/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-sm transition hover:border-white/30 hover:bg-white/[0.06]"
            >
              <div className="flex items-start gap-4">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/70">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-semibold">GitHub issues</h2>
                  <p className="mt-1 text-sm text-white/50">
                    Bug reports and feature requests.
                  </p>
                  <p className="mt-3 text-sm font-medium text-white/60 group-hover:text-white">
                    github.com/Niranjan-M-T/studio-happens-sign
                  </p>
                </div>
              </div>
            </a>

            {/* Studio Happens */}
            <a
              href="https://studiohappens.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-sm transition hover:border-white/30 hover:bg-white/[0.06] sm:col-span-2"
            >
              <div className="flex items-start gap-4">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/70">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253M3 12a8.96 8.96 0 00.284 2.253" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-semibold">Studio Happens</h2>
                  <p className="mt-1 text-sm text-white/50">
                    Studio Happens Sign is designed and built by Studio Happens, a creative and marketing agency.
                    Visit the main site to learn more about what we do.
                  </p>
                  <p className="mt-3 text-sm font-medium text-white/60 group-hover:text-white">
                    studiohappens.tech
                  </p>
                </div>
              </div>
            </a>
          </div>

          {/* FAQ nudge */}
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center">
            <p className="text-sm text-white/50">
              Looking for quick answers?{" "}
              <Link href="/faq" className="font-semibold text-accent hover:underline">
                Check the FAQ
              </Link>{" "}
              first — most common questions are covered there.
            </p>
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
                <Link href="/faq" className="hover:text-white">FAQ</Link>
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
