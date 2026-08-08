/**
 * renderToBlob — Helper to generate a PDF blob from invoice data.
 *
 * WHAT IT IS: A thin wrapper that creates the InvoicePDF React element and
 * calls @react-pdf/renderer's pdf().toBlob() with proper TypeScript types.
 * WHY IT EXISTS: The pdf() function expects a ReactElement<DocumentProps>, and
 * wrapping this in a separate file avoids complex type gymnastics in the UI component.
 * REAL WORLD ANALOGY: Like a print shop helper — you give them the data, they
 * handle the printing machinery and give you back the finished document.
 */

import type { InvoicePDFProps } from "./invoice-document";
import { InvoicePDF } from "./invoice-document";

/**
 * Generates a PDF Blob from invoice data.
 *
 * @param pdfFn - The pdf() function from @react-pdf/renderer
 * @param props - All the invoice data needed to render the PDF
 * @returns A Blob containing the PDF file
 */
export async function renderToBlob(
  pdfFn: typeof import("@react-pdf/renderer").pdf,
  props: InvoicePDFProps
): Promise<Blob> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const document = <InvoicePDF {...props} /> as any;
  return pdfFn(document).toBlob();
}
