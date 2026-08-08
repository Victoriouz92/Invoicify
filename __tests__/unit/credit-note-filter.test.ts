/**
 * Property-Based Tests for Credit Note Status Filter
 *
 * WHAT IT IS: Tests that verify the credit note dialog only shows invoices
 * with status "issued" or "paid" — for ANY random mix of invoice statuses.
 * WHY IT EXISTS: When creating a credit note, only formally issued or paid
 * invoices are legally valid references. Drafts and cancelled invoices must
 * never appear in the selection list.
 * REAL WORLD ANALOGY: Like a store's return system — you can only process
 * returns against completed transactions, never against abandoned carts.
 *
 * Feature: faktura-invoice-generator
 * Property 14: Credit Note Status Filter
 * Validates: Requirements 20.1
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  filterInvoicesForCreditNote,
  type InvoiceWithStatus,
  type InvoiceStatus,
} from "../../lib/credit-note-filter";

// ─── Generators ──────────────────────────────────────────────────────────────

/** All possible invoice statuses */
const allStatuses: InvoiceStatus[] = ["draft", "issued", "paid", "cancelled"];

/** Generates a random invoice status */
const invoiceStatusArb: fc.Arbitrary<InvoiceStatus> = fc.constantFrom(...allStatuses);

/** Generates a 9-digit string (valid EIK format) */
const nineDigitStringArb = fc
  .array(fc.integer({ min: 0, max: 9 }), { minLength: 9, maxLength: 9 })
  .map((digits) => digits.join(""));

/** Generates a valid ISO date string (YYYY-MM-DD) */
const isoDateArb = fc
  .record({
    year: fc.integer({ min: 2020, max: 2030 }),
    month: fc.integer({ min: 1, max: 12 }),
    day: fc.integer({ min: 1, max: 28 }),
  })
  .map(({ year, month, day }) =>
    `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`
  );

/** Generates a valid invoice number (10-digit zero-padded) */
const invoiceNumberArb = fc
  .integer({ min: 1, max: 9999999999 })
  .map((n) => n.toString().padStart(10, "0"));

/** Generates a minimal valid InvoiceWithStatus object */
const invoiceWithStatusArb: fc.Arbitrary<InvoiceWithStatus> = fc.record({
  id: fc.uuid(),
  lastModified: isoDateArb.map((d) => `${d}T10:00:00.000Z`),
  company: fc.record({
    name: fc.string({ minLength: 1, maxLength: 30 }),
    eik: nineDigitStringArb,
    address: fc.string({ minLength: 1, maxLength: 50 }),
    mol: fc.string({ minLength: 1, maxLength: 30 }),
    iban: fc.constant(""),
    vatNumber: fc.constant(""),
    vatReason: fc.constant(""),
    logo: fc.constant(null),
  }),
  client: fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 30 }),
    eik: nineDigitStringArb,
    address: fc.string({ minLength: 1, maxLength: 50 }),
    mol: fc.string({ minLength: 1, maxLength: 30 }),
  }),
  invoiceDetails: fc.record({
    invoiceNumber: invoiceNumberArb,
    dateOfIssue: isoDateArb,
    dateOfTaxEvent: isoDateArb,
    paymentMethod: fc.constantFrom("bank_transfer" as const, "cash" as const),
  }),
  lineItems: fc.array(
    fc.record({
      id: fc.uuid(),
      description: fc.string({ minLength: 1, maxLength: 50 }),
      quantity: fc.double({ min: 0.01, max: 100, noNaN: true }),
      unitPrice: fc.double({ min: 0.01, max: 1000, noNaN: true }),
      unitOfMeasure: fc.constant("бр."),
      lineTotal: fc.double({ min: 0.01, max: 100000, noNaN: true }),
    }),
    { minLength: 1, maxLength: 3 }
  ),
  label: fc.constantFrom("original" as const, "copy" as const),
  status: invoiceStatusArb,
});

/**
 * Generates a list of invoices with mixed statuses.
 * Ensures we have a realistic mix to test the filter.
 */
const invoiceListArb = fc.array(invoiceWithStatusArb, {
  minLength: 0,
  maxLength: 20,
});

// ─── Property Tests ──────────────────────────────────────────────────────────

describe("Property 14: Credit Note Status Filter", () => {
  /**
   * Core property: Filtered results contain ONLY invoices with status
   * "issued" or "paid". No "draft" or "cancelled" invoices should ever
   * appear in the result.
   */
  it("should only return invoices with status 'issued' or 'paid'", () => {
    fc.assert(
      fc.property(invoiceListArb, (invoices) => {
        const result = filterInvoicesForCreditNote(invoices);

        // Every item in the result must have an eligible status
        for (const invoice of result) {
          expect(
            invoice.status === "issued" || invoice.status === "paid"
          ).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * No eligible invoices are lost: every "issued" or "paid" invoice from
   * the input must appear in the output.
   */
  it("should include ALL invoices with status 'issued' or 'paid'", () => {
    fc.assert(
      fc.property(invoiceListArb, (invoices) => {
        const result = filterInvoicesForCreditNote(invoices);

        const eligibleFromInput = invoices.filter(
          (inv) => inv.status === "issued" || inv.status === "paid"
        );

        // The result count must match the count of eligible invoices
        expect(result.length).toBe(eligibleFromInput.length);

        // Every eligible invoice ID from input appears in the result
        const resultIds = new Set(result.map((inv) => inv.id));
        for (const inv of eligibleFromInput) {
          expect(resultIds.has(inv.id)).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * No "draft" or "cancelled" invoices should ever appear in the result,
   * regardless of how many there are in the input.
   */
  it("should never include invoices with status 'draft' or 'cancelled'", () => {
    fc.assert(
      fc.property(invoiceListArb, (invoices) => {
        const result = filterInvoicesForCreditNote(invoices);

        for (const invoice of result) {
          expect(invoice.status).not.toBe("draft");
          expect(invoice.status).not.toBe("cancelled");
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * The filter preserves the original order of invoices —
   * the relative order of eligible invoices is not changed.
   */
  it("should preserve the original order of eligible invoices", () => {
    fc.assert(
      fc.property(invoiceListArb, (invoices) => {
        const result = filterInvoicesForCreditNote(invoices);

        // Get the expected order by filtering the original list manually
        const expected = invoices.filter(
          (inv) => inv.status === "issued" || inv.status === "paid"
        );

        // Result should match in length and order (by ID)
        expect(result.length).toBe(expected.length);
        for (let i = 0; i < expected.length; i++) {
          expect(result[i].id).toBe(expected[i].id);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Empty input should produce empty output — the filter handles
   * edge case of no invoices gracefully.
   */
  it("should return an empty list when given an empty input", () => {
    const result = filterInvoicesForCreditNote([]);
    expect(result).toHaveLength(0);
  });
});
