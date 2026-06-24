import "server-only";

const RESEND_API_URL = "https://api.resend.com/emails";

interface SendSignedPdfEmailArgs {
  apiKey: string;
  from: string;
  to: string[];
  documentTitle: string;
  signerName: string;
  pdfBytes: Uint8Array;
}

/** Email the signed PDF via Resend. No-ops if no apiKey or no recipients. */
export async function sendSignedPdfEmail({
  apiKey,
  from,
  to,
  documentTitle,
  signerName,
  pdfBytes,
}: SendSignedPdfEmailArgs): Promise<void> {
  if (!apiKey || to.length === 0) return;

  const base64 = Buffer.from(pdfBytes).toString("base64");
  const safeName = documentTitle.replace(/[^\w.-]+/g, "_").slice(0, 100) || "document";

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: `Signed: ${documentTitle}`,
      html: `<p>${signerName} just signed <strong>${documentTitle}</strong>. The signed PDF is attached.</p>`,
      attachments: [{ filename: `${safeName}-signed.pdf`, content: base64 }],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Resend API error ${res.status}: ${text}`);
  }
}
