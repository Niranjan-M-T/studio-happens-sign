// Standalone check of the real stampPdf() function (no Supabase needed).
// Run: node scripts/verify-stamp.mjs
import { PDFDocument } from "pdf-lib";
import { stampPdf } from "../lib/pdf-stamp.ts";

// 1) Build a 2-page base PDF.
const base = await PDFDocument.create();
base.addPage([595, 842]); // A4-ish
base.addPage([595, 842]);
const basePdf = await base.save();

// 2) Tiny 1x1 PNG as a stand-in signature image.
const pngB64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/x8AAAAASUVORK5CYII=";
const signaturePng = new Uint8Array(Buffer.from(pngB64, "base64"));

// 3) Stamp: signature + name on page 0, date on page 1.
const signedAtISO = new Date().toISOString();
const out = await stampPdf({
  pdfBytes: basePdf,
  fields: [
    { page: 0, type: "signature", x: 0.1, y: 0.8, width: 0.3, height: 0.1 },
    { page: 0, type: "name", x: 0.1, y: 0.92, width: 0.3, height: 0.03 },
    { page: 1, type: "date", x: 0.6, y: 0.05, width: 0.2, height: 0.03 },
  ],
  signaturePng,
  signerName: "Jane Q. Client",
  signedAtISO,
  ip: "203.0.113.7",
  docId: "demo-doc-123",
});

// 4) Re-load to confirm it is a valid PDF with the expected pages.
const reloaded = await PDFDocument.load(out);
const pages = reloaded.getPageCount();
const ok = pages === 2 && out.length > basePdf.length;

const { writeFile } = await import("node:fs/promises");
await writeFile(new URL("./stamp-output.pdf", import.meta.url), out);

console.log(
  `base=${basePdf.length}B  signed=${out.length}B  pages=${pages}  ok=${ok}`,
);
console.log(ok ? "STAMP OK → scripts/stamp-output.pdf" : "STAMP FAILED");
process.exit(ok ? 0 : 1);
