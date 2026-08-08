/**
 * Invoice Number Management for Invoicify.
 *
 * WHAT IT IS: Two pure functions that handle sequential invoice numbering.
 * WHY IT EXISTS: Bulgarian law requires sequential invoice numbers with no gaps.
 *   These functions compute the next number and detect if the user skips any.
 * REAL WORLD ANALOGY: Like a ticket dispenser at the deli counter —
 *   each ticket is one more than the last, and skipping a number means something went wrong.
 */

import { DEFAULT_INVOICE_NUMBER, VALIDATION_LIMITS } from "./constants";

/**
 * Returns the next sequential invoice number based on the last used number.
 *
 * - If no previous number exists (first-time use), returns "0000000001".
 * - If the last number has a numeric suffix, increments it by 1.
 * - Always returns a 10-digit zero-padded string.
 *
 * @param lastNumber - The last used invoice number, or null if no invoice has been generated yet.
 * @returns The next invoice number as a 10-digit zero-padded string.
 *
 * @example
 * getNextInvoiceNumber(null)           // "0000000001"
 * getNextInvoiceNumber("0000000001")   // "0000000002"
 * getNextInvoiceNumber("0000000099")   // "0000000100"
 * getNextInvoiceNumber("INV-0005")     // "0000000006"
 */
export function getNextInvoiceNumber(lastNumber: string | null): string {
  if (!lastNumber) return DEFAULT_INVOICE_NUMBER;

  // Extract the numeric suffix from the last number
  const numericMatch = lastNumber.match(/(\d+)$/);
  if (!numericMatch) return DEFAULT_INVOICE_NUMBER;

  const nextNum = parseInt(numericMatch[1], 10) + 1;
  return nextNum.toString().padStart(VALIDATION_LIMITS.invoiceNumberPadLength, "0");
}

/**
 * Checks whether the current invoice number creates a gap in the sequence.
 *
 * A gap means the user is skipping one or more numbers (e.g., going from 5 to 8).
 * Bulgarian law requires sequential numbering with no gaps.
 *
 * Returns false if there is no previous number to compare against (first-time use).
 *
 * @param currentNumber - The invoice number the user wants to use.
 * @param lastUsed - The last successfully generated invoice number, or null if none.
 * @returns true if there is a gap (numbers were skipped), false otherwise.
 *
 * @example
 * checkSequenceGap("0000000002", "0000000001") // false (no gap)
 * checkSequenceGap("0000000005", "0000000001") // true  (gap: 2, 3, 4 skipped)
 * checkSequenceGap("0000000001", null)         // false (first invoice, nothing to compare)
 */
export function checkSequenceGap(
  currentNumber: string,
  lastUsed: string | null
): boolean {
  if (!lastUsed) return false;

  // Extract only digits from both numbers for comparison
  const current = parseInt(currentNumber.replace(/\D/g, ""), 10);
  const last = parseInt(lastUsed.replace(/\D/g, ""), 10);

  // A gap exists when the current number is more than 1 ahead of the last used
  return current > last + 1;
}
