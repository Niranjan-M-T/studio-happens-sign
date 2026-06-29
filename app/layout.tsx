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
  title: "Studio Happens Sign — Free Document Signing, No Account Needed",
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
  ],
  openGraph: {
    title: "Studio Happens Sign — Free Document Signing",
    description:
      "Upload a PDF, add signature fields, share the link. Your client signs in seconds. No account needed.",
    type: "website",
    url: "https://sign.studiohappens.tech",
  },
  twitter: {
    card: "summary",
    title: "Studio Happens Sign — Free Document Signing",
    description: "Sign PDF documents online. No account needed. Free forever.",
  },
  robots: { index: true, follow: true },
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
      <body className="min-h-full">{children}</body>
    </html>
  );
}
