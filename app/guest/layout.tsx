import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign a Document — No Account Needed",
  description:
    "Upload a PDF, place signature fields, and share a signing link in about 90 seconds. No login required. Free to use.",
  alternates: { canonical: "https://sign.studiohappens.tech/guest" },
  openGraph: {
    title: "Sign a Document — No Account Needed",
    description:
      "Upload a PDF, place signature fields, and share a signing link in about 90 seconds. No login required.",
    url: "https://sign.studiohappens.tech/guest",
    type: "website",
  },
};

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
