import type { Metadata } from "next";
import { Archivo_Black, Inter } from "next/font/google";
import "./globals.css";

const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  weight: "400",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sign.studiohappens.tech"),
  title: {
    default: "Studio Happens Sign — Free Document Signing, No Account Needed",
    template: "%s | Studio Happens Sign",
  },
  description:
    "Sign PDF documents online for free. No account required. Upload a PDF, place signature fields, share a link. Your client signs from any phone in seconds.",
  keywords: [
    "free e-signature",
    "document signing",
    "PDF signing",
    "online signature",
    "no signup document signing",
    "free PDF signing",
    "e-sign documents free",
    "digital signature",
    "sign documents online",
    "free docusign alternative",
    "free hellosign alternative",
    "online PDF signer",
    "document signing without account",
    "open source e-signature",
  ],
  openGraph: {
    type: "website",
    url: "https://sign.studiohappens.tech",
    siteName: "Studio Happens Sign",
    title: "Studio Happens Sign — Free Document Signing",
    description:
      "Upload a PDF, add signature fields, share the link. Your client signs in seconds. No account needed.",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Studio Happens Sign — Free Document Signing",
    description:
      "Free PDF signing. Upload, drop fields, share a link. No account needed to sign.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "https://sign.studiohappens.tech" },
};

const orgSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://sign.studiohappens.tech/#organization",
      name: "Studio Happens",
      description: "Creative and marketing agency. Designers and builders of Studio Happens Sign.",
      url: "https://studiohappens.tech",
      logo: "https://sign.studiohappens.tech/icon.png",
      email: "studiohappens26@gmail.com",
      sameAs: [
        "https://studiohappens.tech",
        "https://github.com/Niranjan-M-T/open-sign",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://sign.studiohappens.tech/#website",
      url: "https://sign.studiohappens.tech",
      name: "Studio Happens Sign",
      description: "Free PDF document signing. No account required.",
      publisher: { "@id": "https://sign.studiohappens.tech/#organization" },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${archivoBlack.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        {children}
      </body>
    </html>
  );
}
