/**
 * Totals Calculator for Invoicify.
 *
 * WHAT IT IS: A set of pure functions that calculate invoice totals —
 * line totals, tax base, VAT, grand total, and the amount in words.
 * WHY IT EXISTS: Automates invoice math so freelancers avoid manual calculation errors.
 * REAL WORLD ANALOGY: Like a cash register that automatically sums up items,
 * applies tax, and prints the total — but for invoices.
 */

import type { LineItem, TotalsResult } from "./types";
import { VALIDATION_LIMITS } from "./constants";
import { amountToWords } from "./amount-converter";

/**
 * Rounds a number to 2 decimal places using standard rounding.
 * Uses the multiply-round-divide pattern to avoid floating-point drift.
 *
 * @param n - The number to round
 * @returns The number rounded to 2 decimal places
 *
 * @example
 * roundTo2(1.005)  // 1.01
 * roundTo2(2.999)  // 3
 * roundTo2(10.1)   // 10.1
 */
export function roundTo2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Calculates the line total for a single item (quantity × unit price),
 * rounded to 2 decimal places.
 *
 * @param quantity - How many units (0.01 to 10,000)
 * @param unitPrice - Price per unit in BGN (0.01 to 999,999.99)
 * @returns The line total rounded to 2 decimal places
 *
 * @example
 * calculateLineTotal(2, 10.50)   // 21.00
 * calculateLineTotal(3, 33.33)   // 99.99
 * calculateLineTotal(0.5, 100)   // 50.00
 */
export function calculateLineTotal(quantity: number, unitPrice: number): number {
  return roundTo2(quantity * unitPrice);
}

/**
 * Calculates all invoice totals from an array of line items.
 *
 * Steps:
 * 1. Sum all line item totals to get the tax base
 * 2. Calculate VAT (20% of tax base if VAT-registered, 0 otherwise)
 * 3. Calculate grand total (tax base + VAT)
 * 4. Convert grand total to Bulgarian words (if > 0)
 *
 * @param lineItems - Array of line items (each must have a lineTotal value)
 * @param isVATRegistered - Whether the company is VAT-registered
 * @returns Object containing taxBase, vatAmount, grandTotal, and amountInWords
 *
 * @example
 * const items = [
 *   { id: "1", description: "Service", quantity: 2, unitPrice: 100, unitOfMeasure: "бр.", lineTotal: 200 },
 * ];
 * calculateTotals(items, true);
 * // { taxBase: 200, vatAmount: 40, grandTotal: 240, amountInWords: "двеста и четиридесет лева" }
 */
export function calculateTotals(
  lineItems: LineItem[],
  isVATRegistered: boolean
): TotalsResult {
  // Step 1: Sum all line totals to get tax base
  const taxBase = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const roundedTaxBase = roundTo2(taxBase);

  // Step 2: Calculate VAT (20% if VAT-registered, 0 otherwise)
  const vatAmount = isVATRegistered
    ? roundTo2(roundedTaxBase * VALIDATION_LIMITS.vatRate)
    : 0;

  // Step 3: Grand total = tax base + VAT
  const grandTotal = roundTo2(roundedTaxBase + vatAmount);

  // Step 4: Convert to Bulgarian words (empty string if zero)
  const amountInWords = grandTotal > 0 ? amountToWords(grandTotal) : "";

  return { taxBase: roundedTaxBase, vatAmount, grandTotal, amountInWords };
}
