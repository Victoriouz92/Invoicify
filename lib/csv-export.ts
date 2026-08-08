/**
 * CSV Export Utility for Invoicify.
 *
 * WHAT IT IS: A pure function that converts an array of draft invoices into a CSV string.
 * WHY IT EXISTS: Bulgarian freelancers need to send monthly invoice data to their accountants.
 * REAL WORLD ANALOGY: Like pulling a monthly statement from your bank — but for invoices you issued.
 *
 * HOW IT WORKS:
 * 1. Filters drafts by the selected month (matching dateOfIssue)
 * 2. Calculates totals for each invoice (tax base, VAT, grand total)
 * 3. Generates a UTF-8 CSV string with BOM for Excel compatibility
 * 4. Returns the CSV content and suggested filename
 */

import type { DraftInvoice } from "./types";
import { VALIDATION_LIMITS } from "./constants";
import { roundTo2 } from "./totals-calculator";

/** The result of generating a CSV export */
export interface CsvExportResult {
  /** The CSV content string (includes UTF-8 BOM) */
  content: string;
  /** The suggested filename, e.g. "invoices_2024-03.csv" */
  filename: string;
  /** How many invoices were included */
  count: number;
}

/**
 * Filters drafts that have a dateOfIssue within the given year and month.
 *
 * @param drafts - All saved drafts
 * @param year - The 4-digit year to filter by
 * @param month - The 1-based month (1 = January, 12 = December)
 * @returns Only drafts whose dateOfIssue falls in that month
 */
export function filterDraftsByMonth(
  drafts: DraftInvoice[],
  year: number,
  month: number
): DraftInvoice[] {
  const monthStr = String(month).padStart(2, "0");
  const prefix = `${year}-${monthStr}`;

  return drafts.filter((draft) => {
    const dateOfIssue = draft.invoiceDetails.dateOfIssue;
    // dateOfIssue is stored as "YYYY-MM-DD"
    return dateOfIssue.startsWith(prefix);
  });
}

/**
 * Generates a CSV export for the given drafts.
 *
 * Columns: Номер, Дата, Клиент, ЕИК, Данъчна основа, ДДС, Общо
 *
 * @param drafts - The drafts to include (already filtered by month)
 * @param year - The year (for filename)
 * @param month - The month (for filename)
 * @returns CsvExportResult with content, filename, and count
 */
export function generateCsv(
  drafts: DraftInvoice[],
  year: number,
  month: number
): CsvExportResult {
  const monthStr = String(month).padStart(2, "0");
  const filename = `invoices_${year}-${monthStr}.csv`;

  // UTF-8 BOM so Excel opens the file correctly with Bulgarian characters
  const BOM = "\uFEFF";

  // CSV header row
  const header = "Номер,Дата,Клиент,ЕИК,Данъчна основа,ДДС,Общо";

  // CSV data rows
  const rows = drafts.map((draft) => {
    const invoiceNumber = escapeCsvField(draft.invoiceDetails.invoiceNumber);
    const date = draft.invoiceDetails.dateOfIssue;
    const clientName = escapeCsvField(draft.client.name);
    const clientEik = draft.client.eik;

    // Calculate totals from line items
    const taxBase = roundTo2(
      draft.lineItems.reduce((sum, item) => sum + item.lineTotal, 0)
    );
    const isVATRegistered = draft.company.vatNumber !== "";
    const vatAmount = isVATRegistered
      ? roundTo2(taxBase * VALIDATION_LIMITS.vatRate)
      : 0;
    const grandTotal = roundTo2(taxBase + vatAmount);

    return `${invoiceNumber},${date},${clientName},${clientEik},${taxBase.toFixed(2)},${vatAmount.toFixed(2)},${grandTotal.toFixed(2)}`;
  });

  const content = BOM + [header, ...rows].join("\n");

  return { content, filename, count: drafts.length };
}

/**
 * Escapes a field value for CSV. If it contains a comma, quote, or newline,
 * the value is wrapped in double quotes with any internal quotes doubled.
 */
function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Triggers a file download in the browser from a CSV string.
 *
 * @param content - The CSV content (with BOM)
 * @param filename - The desired filename
 */
export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();

  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
