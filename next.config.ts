import type { NextConfig } from "next";

// Content Security Policy. The signing surfaces upload PDFs directly to
// Supabase Storage signed URLs, so connect-src must allow Supabase hosts:
//  - BYO agencies are always https://<ref>.supabase.co (enforced in the
//    connection route), covered by the wildcard.
//  - The optional platform-hosted data plane lives on a custom subdomain
//    under hosting.studiohappens.tech.
// 'unsafe-inline' on script-src is needed for Next's hydration bootstrap and
// the inline JSON-LD blocks; moving to a nonce-based policy is a future
// hardening step. blob: on worker-src/img-src is for the pdf.js worker and
// canvas-rendered PDF pages; data: img-src is for drawn-signature data URLs.
const isDev = process.env.NODE_ENV === "development";

// 'wasm-unsafe-eval' lets pdf.js compile its WebAssembly image decoders
// without opening up full eval(). In development only, Next's Fast Refresh
// (HMR) needs full 'unsafe-eval'; production stays strict (WASM only).
const scriptSrc = isDev
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
  : "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'";

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "worker-src 'self' blob:",
  "connect-src 'self' https://*.supabase.co https://*.hosting.studiohappens.tech",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
