/**
 * Credit Note Number Management for Invoicify.
 *
 * WHAT IT IS: A function that generates sequential credit note numbers with a "КИ-" prefix.
 * WHY IT EXISTS: Credit notes need separate numbering from invoices to avoid confusion.
 *   The "КИ-" prefix (Кредитно Известие) makes them instantly recognizable.
 * REAL WORLD ANALOGY: Like having two different ticket rolls at a counter —
 *   one for regular orders and another for returns/refunds.
 */

import { VALIDATION_LIMITS } from "./constants";

const CREDIT_NOTE_PREFIX = "КИ-";

/**
 * Returns the next sequential credit note number.
 *
 * Format: "КИ-0000000001", "КИ-0000000002", etc.
 *
 * @param lastNumber - The last used credit note number (e.g. "КИ-0000000001"), or empty string if none.
 * @returns The next credit note number with "КИ-" prefix and 10-digit zero-padded sequence.
 *
 * @example
 * getNextCreditNoteNumber("")                 // "КИ-0000000001"
 * getNextCreditNoteNumber("КИ-0000000001")   // "КИ-0000000002"
 * getNextCreditNoteNumber("КИ-0000000099")   // "КИ-0000000100"
 */
export function getNextCreditNoteNumber(lastNumber: string): string {
  if (!lastNumber) {
    return `${CREDIT_NOTE_PREFIX}${"1".padStart(VALIDATION_LIMITS.invoiceNumberPadLength, "0")}`;
  }

  // Extract the numeric suffix from the last number
  const numericMatch = lastNumber.match(/(\d+)$/);
  if (!numericMatch) {
    return `${CREDIT_NOTE_PREFIX}${"1".padStart(VALIDATION_LIMITS.invoiceNumberPadLength, "0")}`;
  }

  const nextNum = parseInt(numericMatch[1], 10) + 1;
  return `${CREDIT_NOTE_PREFIX}${nextNum.toString().padStart(VALIDATION_LIMITS.invoiceNumberPadLength, "0")}`;
}
