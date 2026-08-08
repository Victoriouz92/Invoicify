/**
 * Property-Based Tests for Totals Calculator and Line Item Math.
 *
 * WHAT IT IS: Tests that verify invoice math works correctly for ANY combination
 * of line items, quantities, and prices — not just a few hand-picked examples.
 *
 * WHY IT EXISTS: Invoices involve money. A rounding bug or math error could cause
 * legal and financial problems. These tests generate hundreds of random inputs
 * to catch edge cases we'd never think to test manually.
 *
 * REAL WORLD ANALOGY: Instead of checking a calculator with just "2 + 2",
 * we check it with hundreds of random problems and verify the answers are correct.
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  calculateTotals,
  calculateLineTotal,
  roundTo2,
} from "../../lib/totals-calculator";
import type { LineItem } from "../../lib/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Creates a valid LineItem with pre-calculated lineTotal.
 * This mirrors how the app works: lineTotal is computed before passing to calculateTotals.
 */
function makeLineItem(quantity: number, unitPrice: number): LineItem {
  return {
    id: crypto.randomUUID(),
    description: "Test item",
    quantity,
    unitPrice,
    unitOfMeasure: "бр.",
    lineTotal: roundTo2(quantity * unitPrice),
  };
}

/**
 * Generates a valid quantity between 0.01 and 10,000 (up to 2 decimal places).
 */
const quantityArb = fc.double({
  min: 0.01,
  max: 10_000,
  noNaN: true,
  noDefaultInfinity: true,
}).map((n) => roundTo2(n));

/**
 * Generates a valid unit price between 0.01 and 999,999.99 (up to 2 decimal places).
 */
const unitPriceArb = fc.double({
  min: 0.01,
  max: 999_999.99,
  noNaN: true,
  noDefaultInfinity: true,
}).map((n) => roundTo2(n));

/**
 * Smart generator for line items whose totals stay within the amountToWords limit.
 *
 * WHY: The calculateTotals function calls amountToWords internally, which only
 * supports amounts up to 9,999,999.99. With VAT (×1.2), the taxBase must not
 * exceed 8,333,333.32 (so grandTotal stays under the limit).
 *
 * STRATEGY: We generate 1-10 items with moderate prices/quantities so the total
 * sum stays safely within range.
 */
const safeQuantityArb = fc.double({
  min: 0.01,
  max: 1000,
  noNaN: true,
  noDefaultInfinity: true,
}).map((n) => roundTo2(n));

const safeUnitPriceArb = fc.double({
  min: 0.01,
  max: 5000,
  noNaN: true,
  noDefaultInfinity: true,
}).map((n) => roundTo2(n));

const safeLineItemArb = fc.tuple(safeQuantityArb, safeUnitPriceArb).map(
  ([qty, price]) => makeLineItem(qty, price)
);

/**
 * Generates 1-10 line items where the total sum is guaranteed to stay
 * within the 9,999,999.99 limit even with 20% VAT applied.
 * Max possible: 10 items × 1000 qty × 5000 price = 50,000,000 (way too high)
 * So we filter to ensure taxBase stays under 8,333,333 (safe with VAT).
 */
const safeLineItemsArb = fc
  .array(safeLineItemArb, { minLength: 1, maxLength: 10 })
  .filter((items) => {
    const taxBase = items.reduce((sum, item) => sum + item.lineTotal, 0);
    // With VAT: grandTotal = taxBase * 1.2, must be <= 9,999,999.99
    return taxBase > 0 && taxBase <= 8_333_333;
  });

// ─── Property 2: Totals Calculation Invariant ────────────────────────────────
// Feature: faktura-invoice-generator, Property 2: Totals Calculation Invariant

describe("Property 2: Totals Calculation Invariant", () => {
  /**
   * Validates: Requirements 7.1
   * taxBase must equal the sum of all rounded(qty × price) values.
   */
  it("taxBase equals sum of all line item totals (rounded)", () => {
    fc.assert(
      fc.property(safeLineItemsArb, (lineItems) => {
        const result = calculateTotals(lineItems, true);

        // Calculate expected tax base: sum of each lineTotal (already rounded)
        const expectedTaxBase = roundTo2(
          lineItems.reduce((sum, item) => sum + item.lineTotal, 0)
        );

        expect(result.taxBase).toBeCloseTo(expectedTaxBase, 2);
      }),
      { numRuns: 150 }
    );
  });

  /**
   * Validates: Requirements 7.2
   * VAT = round(taxBase × 0.20, 2) when VAT-registered, 0 otherwise.
   */
  it("vatAmount = round(taxBase × 0.20, 2) when VAT-registered", () => {
    fc.assert(
      fc.property(safeLineItemsArb, (lineItems) => {
        const result = calculateTotals(lineItems, true);

        const expectedVat = roundTo2(result.taxBase * 0.2);
        expect(result.vatAmount).toBeCloseTo(expectedVat, 2);
      }),
      { numRuns: 150 }
    );
  });

  /**
   * Validates: Requirements 7.2
   * VAT = 0 when NOT VAT-registered.
   */
  it("vatAmount = 0 when NOT VAT-registered", () => {
    fc.assert(
      fc.property(safeLineItemsArb, (lineItems) => {
        const result = calculateTotals(lineItems, false);
        expect(result.vatAmount).toBe(0);
      }),
      { numRuns: 150 }
    );
  });

  /**
   * Validates: Requirements 7.3
   * grandTotal = taxBase + vatAmount.
   */
  it("grandTotal = taxBase + vatAmount", () => {
    fc.assert(
      fc.property(
        safeLineItemsArb,
        fc.boolean(),
        (lineItems, isVATRegistered) => {
          const result = calculateTotals(lineItems, isVATRegistered);

          const expectedGrandTotal = roundTo2(
            result.taxBase + result.vatAmount
          );
          expect(result.grandTotal).toBeCloseTo(expectedGrandTotal, 2);
        }
      ),
      { numRuns: 150 }
    );
  });

  /**
   * Validates: Requirements 7.1, 7.2, 7.3
   * All three invariants hold together for any combination (VAT-registered).
   */
  it("all totals invariants hold together for VAT-registered", () => {
    fc.assert(
      fc.property(safeLineItemsArb, (lineItems) => {
        const result = calculateTotals(lineItems, true);

        // Invariant 1: taxBase = sum of line totals
        const expectedTaxBase = roundTo2(
          lineItems.reduce((sum, item) => sum + item.lineTotal, 0)
        );
        expect(result.taxBase).toBeCloseTo(expectedTaxBase, 2);

        // Invariant 2: vatAmount = round(taxBase * 0.20, 2)
        const expectedVat = roundTo2(result.taxBase * 0.2);
        expect(result.vatAmount).toBeCloseTo(expectedVat, 2);

        // Invariant 3: grandTotal = taxBase + vatAmount
        const expectedGrandTotal = roundTo2(result.taxBase + result.vatAmount);
        expect(result.grandTotal).toBeCloseTo(expectedGrandTotal, 2);
      }),
      { numRuns: 150 }
    );
  });

  /**
   * Validates: Requirements 7.1, 7.2, 7.3
   * All three invariants hold together for non-VAT-registered.
   */
  it("all totals invariants hold together for non-VAT-registered", () => {
    fc.assert(
      fc.property(safeLineItemsArb, (lineItems) => {
        const result = calculateTotals(lineItems, false);

        // taxBase = sum of line totals
        const expectedTaxBase = roundTo2(
          lineItems.reduce((sum, item) => sum + item.lineTotal, 0)
        );
        expect(result.taxBase).toBeCloseTo(expectedTaxBase, 2);

        // vatAmount = 0
        expect(result.vatAmount).toBe(0);

        // grandTotal = taxBase (since VAT = 0)
        expect(result.grandTotal).toBeCloseTo(expectedTaxBase, 2);
      }),
      { numRuns: 150 }
    );
  });
});

// ─── Property 4: Line Item Calculation ───────────────────────────────────────
// Feature: faktura-invoice-generator, Property 4: Line Item Calculation

describe("Property 4: Line Item Calculation", () => {
  /**
   * Validates: Requirements 6.3
   * For any valid quantity and unitPrice, lineTotal = Math.round(qty * price * 100) / 100.
   */
  it("lineTotal = Math.round(qty * price * 100) / 100 for any valid inputs", () => {
    fc.assert(
      fc.property(quantityArb, unitPriceArb, (quantity, unitPrice) => {
        const result = calculateLineTotal(quantity, unitPrice);
        const expected = Math.round(quantity * unitPrice * 100) / 100;

        expect(result).toBe(expected);
      }),
      { numRuns: 150 }
    );
  });

  /**
   * Validates: Requirements 6.3
   * The line total must always have at most 2 decimal places.
   */
  it("lineTotal always has at most 2 decimal places", () => {
    fc.assert(
      fc.property(quantityArb, unitPriceArb, (quantity, unitPrice) => {
        const result = calculateLineTotal(quantity, unitPrice);

        // Multiply by 100 and check it's an integer (within floating point tolerance)
        const scaled = result * 100;
        expect(Math.abs(scaled - Math.round(scaled))).toBeLessThan(0.0001);
      }),
      { numRuns: 150 }
    );
  });

  /**
   * Validates: Requirements 6.3
   * The line total must be non-negative for valid positive inputs.
   */
  it("lineTotal is non-negative for positive inputs", () => {
    fc.assert(
      fc.property(quantityArb, unitPriceArb, (quantity, unitPrice) => {
        const result = calculateLineTotal(quantity, unitPrice);
        expect(result).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 150 }
    );
  });

  /**
   * Validates: Requirements 6.3
   * roundTo2 helper always produces a value with at most 2 decimal places.
   */
  it("roundTo2 always produces at most 2 decimal places", () => {
    fc.assert(
      fc.property(
        fc.double({ min: -999999.99, max: 999999.99, noNaN: true, noDefaultInfinity: true }),
        (n) => {
          const result = roundTo2(n);
          const scaled = result * 100;
          expect(Math.abs(scaled - Math.round(scaled))).toBeLessThan(0.0001);
        }
      ),
      { numRuns: 150 }
    );
  });
});
