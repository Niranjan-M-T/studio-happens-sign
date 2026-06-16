import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib";
import type { FieldRow } from "./types";

export interface StampInput {
  /** Original PDF bytes. */
  pdfBytes: Uint8Array | ArrayBuffer;
  fields: Pick<FieldRow, "page" | "type" | "x" | "y" | "width" | "height">[];
  /** Decoded PNG bytes of the drawn signature. */
  signaturePng: Uint8Array;
  signerName: string;
  signedAtISO: string;
  ip: string | null;
  docId: string;
}

const INK = rgb(0.04, 0.04, 0.05);
const MUTED = rgb(0.4, 0.4, 0.42);

/** Largest font size (down to 6pt) at which `text` fits the box width. */
function fitText(text: string, font: PDFFont, maxW: number, maxH: number): number {
  let size = Math.min(maxH * 0.7, 16);
  while (size > 6 && font.widthOfTextAtSize(text, size) > maxW) size -= 0.5;
  return size;
}

/**
 * Stamp the drawn signature, typed name, and date into the PDF at the
 * admin-placed field coordinates, then append an audit line.
 *
 * Coordinates arrive normalized (0..1) with a top-left origin (screen
 * convention). pdf-lib uses a bottom-left origin, so Y is flipped.
 */
export async function stampPdf(input: StampInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(input.pdfBytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const signature = await pdf.embedPng(input.signaturePng);
  const pages = pdf.getPages();

  const dateStr = new Date(input.signedAtISO).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  for (const f of input.fields) {
    const page = pages[f.page];
    if (!page) continue;
    const { width: pw, height: ph } = page.getSize();
    const boxX = f.x * pw;
    const boxW = f.width * pw;
    const boxH = f.height * ph;
    const boxY = (1 - f.y - f.height) * ph; // flip Y

    if (f.type === "signature") {
      const fit = signature.scaleToFit(boxW, boxH);
      page.drawImage(signature, {
        x: boxX + (boxW - fit.width) / 2,
        y: boxY + (boxH - fit.height) / 2,
        width: fit.width,
        height: fit.height,
      });
    } else {
      const text = f.type === "name" ? input.signerName : dateStr;
      const size = fitText(text, font, boxW, boxH);
      page.drawText(text, {
        x: boxX + 2,
        y: boxY + (boxH - size) / 2,
        size,
        font,
        color: INK,
      });
    }
  }

  // Audit trail along the bottom of the last page.
  const last = pages[pages.length - 1];
  const audit =
    `Electronically signed by ${input.signerName} on ${input.signedAtISO}` +
    (input.ip ? ` from IP ${input.ip}` : "") +
    ` · Document ${input.docId}`;
  last.drawText(audit, { x: 24, y: 14, size: 7, font, color: MUTED });

  return pdf.save();
}
