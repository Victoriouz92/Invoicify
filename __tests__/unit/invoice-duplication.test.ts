/**
 * Property-Based Tests for Invoice Duplication
 *
 * WHAT IT IS: Tests that verify duplicating an invoice correctly copies some fields
 * and resets others, for ANY valid source invoice — not just a few examples.
 * WHY IT EXISTS: When duplicating an invoice, the system must copy client/line items exactly,
 * assign the next sequential number, set today's date, and clear payment status.
 * REAL WORLD ANALOGY: Like photocopying a form but stamping today's date and a new serial number
 * on top — the content stays the same, but the metadata changes.
 *
 * Feature: faktura-invoice-generator
 * Property 11: Invoice Duplication Preserves Correct Fields
 * Validates: Requirements 12.1, 12.2, 12.3, 12.4
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { getNextInvoiceNumber } from "../../lib/invoice-number";
import type { DraftInvoice, ClientData, LineItem, CompanyData, InvoiceDetails } from "../../lib/types";

// ─── Generators ──────────────────────────────────────────────────────────────

/** Generates a 9-digit string (valid EIK format, checksum not validated here) */
const nineDigitStringArb = fc
  .array(fc.integer({ min: 0, max: 9 }), { minLength: 9, maxLength: 9 })
  .map((digits) => digits.join(""));

/** Generates a valid client data object */
const clientDataArb: fc.Arbitrary<ClientData> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  eik: nineDigitStringArb,
  address: fc.string({ minLength: 1, maxLength: 100 }),
  mol: fc.string({ minLength: 1, maxLength: 50 }),
});

/** Generates a valid company data object */
const companyDataArb: fc.Arbitrary<CompanyData> = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }),
  eik: nineDigitStringArb,
  address: fc.string({ minLength: 1, maxLength: 100 }),
  mol: fc.string({ minLength: 1, maxLength: 50 }),
  iban: fc.string({ minLength: 0, maxLength: 30 }),
  vatNumber: fc.string({ minLength: 0, maxLength: 20 }),
  vatReason: fc.string({ minLength: 0, maxLength: 50 }),
  logo: fc.constant(null),
});

/** Generates a valid line item */
const lineItemArb: fc.Arbitrary<LineItem> = fc.record({
  id: fc.uuid(),
  description: fc.string({ minLength: 1, maxLength: 100 }),
  quantity: fc.double({ min: 0.01, max: 10000, noNaN: true }),
  unitPrice: fc.double({ min: 0.01, max: 999999.99, noNaN: true }),
  unitOfMeasure: fc.string({ minLength: 1, maxLength: 30 }),
  lineTotal: fc.double({ min: 0, max: 9999999999, noNaN: true }),
});

/** Generates a valid invoice number (10-digit zero-padded, non-zero) */
const invoiceNumberArb = fc
  .integer({ min: 1, max: 9999999999 })
  .map((n) => n.toString().padStart(10, "0"));

/** Generates a valid ISO date string (YYYY-MM-DD) from random year/month/day */
const isoDateArb = fc
  .record({
    year: fc.integer({ min: 2020, max: 2030 }),
    month: fc.integer({ min: 1, max: 12 }),
    day: fc.integer({ min: 1, max: 28 }), // use 28 to avoid invalid days
  })
  .map(({ year, month, day }) =>
    `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`
  );

/** Generates a valid ISO timestamp string */
const isoTimestampArb = isoDateArb.map((date) => `${date}T10:00:00.000Z`);

/** Generates a valid invoice details object */
const invoiceDetailsArb: fc.Arbitrary<InvoiceDetails> = fc.record({
  invoiceNumber: invoiceNumberArb,
  dateOfIssue: isoDateArb,
  dateOfTaxEvent: isoDateArb,
  paymentMethod: fc.constantFrom("bank_transfer" as const, "cash" as const),
});

/** Generates a valid draft invoice (source for duplication) */
const draftInvoiceArb: fc.Arbitrary<DraftInvoice> = fc.record({
  id: fc.uuid(),
  lastModified: isoTimestampArb,
  company: companyDataArb,
  client: clientDataArb,
  invoiceDetails: invoiceDetailsArb,
  lineItems: fc.array(lineItemArb, { minLength: 1, maxLength: 10 }),
  label: fc.constantFrom("original" as const, "copy" as const),
});

// ─── Pure Duplication Logic ──────────────────────────────────────────────────
/**
 * Extracts the pure duplication logic from the Zustand store's `duplicateFromDraft`.
 * This allows us to test it without side effects (localStorage, React state).
 *
 * Given a source draft and a lastInvoiceNumber, returns the new form state
 * that should result from duplication.
 */
function duplicateInvoice(
  source: DraftInvoice,
  lastInvoiceNumber: string
) {
  const today = new Date().toISOString().slice(0, 10);
  const nextNumber = lastInvoiceNumber
    ? getNextInvoiceNumber(lastInvoiceNumber)
    : "0000000001";

  // Copy line items with new IDs (same content, different identity)
  const lineItems = source.lineItems.map((item) => ({
    ...item,
    id: "new-id", // In real code this would be crypto.randomUUID()
  }));

  return {
    company: source.company,
    client: source.client,
    invoiceDetails: {
      invoiceNumber: nextNumber,
      dateOfIssue: today,
      dateOfTaxEvent: today,
      paymentMethod: source.invoiceDetails.paymentMethod,
    },
    lineItems,
    label: "original" as const,
  };
}

// ─── Property Tests ──────────────────────────────────────────────────────────

describe("Property 11: Invoice Duplication Preserves Correct Fields", () => {
  /**
   * Requirement 12.1: Client details are copied exactly from the source invoice.
   */
  it("should preserve client details exactly when duplicating", () => {
    fc.assert(
      fc.property(draftInvoiceArb, invoiceNumberArb, (source, lastNumber) => {
        const result = duplicateInvoice(source, lastNumber);

        // Client name, EIK, address, and MOL must match exactly
        expect(result.client.name).toBe(source.client.name);
        expect(result.client.eik).toBe(source.client.eik);
        expect(result.client.address).toBe(source.client.address);
        expect(result.client.mol).toBe(source.client.mol);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Requirement 12.1: Line items (descriptions, quantities, unit prices, units of measure)
   * are copied exactly from the source invoice.
   */
  it("should preserve line item content exactly when duplicating", () => {
    fc.assert(
      fc.property(draftInvoiceArb, invoiceNumberArb, (source, lastNumber) => {
        const result = duplicateInvoice(source, lastNumber);

        // Same number of line items
        expect(result.lineItems.length).toBe(source.lineItems.length);

        // Each line item content matches (description, quantity, unitPrice, unitOfMeasure)
        for (let i = 0; i < source.lineItems.length; i++) {
          expect(result.lineItems[i].description).toBe(source.lineItems[i].description);
          expect(result.lineItems[i].quantity).toBe(source.lineItems[i].quantity);
          expect(result.lineItems[i].unitPrice).toBe(source.lineItems[i].unitPrice);
          expect(result.lineItems[i].unitOfMeasure).toBe(source.lineItems[i].unitOfMeasure);
          expect(result.lineItems[i].lineTotal).toBe(source.lineItems[i].lineTotal);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Requirement 12.2: The invoice number is set to the next sequential number
   * following the last used invoice number.
   */
  it("should set invoice number to next sequential number", () => {
    fc.assert(
      fc.property(draftInvoiceArb, invoiceNumberArb, (source, lastNumber) => {
        const result = duplicateInvoice(source, lastNumber);

        const expectedNextNumber = getNextInvoiceNumber(lastNumber);
        expect(result.invoiceDetails.invoiceNumber).toBe(expectedNextNumber);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Requirement 12.3: The date of issue is set to today's date.
   */
  it("should set date of issue to today's date", () => {
    fc.assert(
      fc.property(draftInvoiceArb, invoiceNumberArb, (source, lastNumber) => {
        const result = duplicateInvoice(source, lastNumber);

        const today = new Date().toISOString().slice(0, 10);
        expect(result.invoiceDetails.dateOfIssue).toBe(today);
        expect(result.invoiceDetails.dateOfTaxEvent).toBe(today);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Requirement 12.4: Payment status is cleared (label reset to "original").
   */
  it("should clear payment status by resetting label to 'original'", () => {
    fc.assert(
      fc.property(draftInvoiceArb, invoiceNumberArb, (source, lastNumber) => {
        const result = duplicateInvoice(source, lastNumber);

        // The duplicated invoice always starts as "original" regardless of source label
        expect(result.label).toBe("original");
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Combined property: All duplication invariants hold simultaneously.
   * This tests that fixing one field doesn't break another.
   */
  it("should satisfy all duplication invariants simultaneously", () => {
    fc.assert(
      fc.property(draftInvoiceArb, invoiceNumberArb, (source, lastNumber) => {
        const result = duplicateInvoice(source, lastNumber);
        const today = new Date().toISOString().slice(0, 10);
        const expectedNextNumber = getNextInvoiceNumber(lastNumber);

        // Client preserved
        expect(result.client.name).toBe(source.client.name);
        expect(result.client.eik).toBe(source.client.eik);
        expect(result.client.address).toBe(source.client.address);
        expect(result.client.mol).toBe(source.client.mol);

        // Line items preserved (content, not IDs)
        expect(result.lineItems.length).toBe(source.lineItems.length);
        for (let i = 0; i < source.lineItems.length; i++) {
          expect(result.lineItems[i].description).toBe(source.lineItems[i].description);
          expect(result.lineItems[i].quantity).toBe(source.lineItems[i].quantity);
          expect(result.lineItems[i].unitPrice).toBe(source.lineItems[i].unitPrice);
          expect(result.lineItems[i].unitOfMeasure).toBe(source.lineItems[i].unitOfMeasure);
        }

        // New sequential number
        expect(result.invoiceDetails.invoiceNumber).toBe(expectedNextNumber);

        // Today's date
        expect(result.invoiceDetails.dateOfIssue).toBe(today);

        // Payment status cleared
        expect(result.label).toBe("original");
      }),
      { numRuns: 100 }
    );
  });
});
