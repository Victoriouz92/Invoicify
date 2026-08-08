/**
 * Credit Note Invoice Filter
 *
 * WHAT IT IS: A pure function that filters invoices to only show those
 * eligible for credit note creation (status "issued" or "paid").
 * WHY IT EXISTS: Bulgarian law requires credit notes to reference only
 * invoices that have been formally issued or paid — not drafts or cancelled ones.
 * REAL WORLD ANALOGY: Like a store's return policy — you can only return items
 * from completed purchases (receipts that were actually processed), not from
 * abandoned shopping carts or voided transactions.
 */

import type { DraftInvoice } from "./types";

/**
 * Possible statuses for an invoice in its lifecycle.
 * - "draft": still being edited, not yet sent
 * - "issued": formally sent to the client
 * - "paid": client has paid the invoice
 * - "cancelled": invoice was voided/cancelled
 */
export type InvoiceStatus = "draft" | "issued" | "paid" | "cancelled";

/**
 * An invoice that carries a status field (extends DraftInvoice).
 * This represents a finalized invoice in the system.
 */
export interface InvoiceWithStatus extends DraftInvoice {
  status: InvoiceStatus;
}

/**
 * Statuses that are eligible for credit note creation.
 * Only invoices that have been formally issued or paid can be credited.
 */
export const CREDIT_NOTE_ELIGIBLE_STATUSES: readonly InvoiceStatus[] = [
  "issued",
  "paid",
] as const;

/**
 * Filters a list of invoices to return only those eligible for credit note creation.
 * Only invoices with status "issued" or "paid" are eligible.
 *
 * @param invoices - Array of invoices with status information
 * @returns Only invoices with status "issued" or "paid"
 */
export function filterInvoicesForCreditNote(
  invoices: InvoiceWithStatus[]
): InvoiceWithStatus[] {
  return invoices.filter(
    (inv) =>
      inv.status === "issued" || inv.status === "paid"
  );
}
