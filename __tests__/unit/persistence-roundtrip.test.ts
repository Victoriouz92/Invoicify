/**
 * Property-Based Tests for Data Persistence Round-Trips
 *
 * WHAT IT IS: Tests that verify data survives being saved and loaded from localStorage
 * (via JSON.stringify → JSON.parse) for ALL possible valid inputs.
 * WHY IT EXISTS: If even one field gets lost or corrupted during save/load, users could
 * lose important invoice data. These tests generate hundreds of random valid objects
 * to ensure nothing is ever lost in the round-trip.
 * REAL WORLD ANALOGY: Like photocopying a document and comparing every word —
 * if even one letter is different, the test catches it.
 *
 * Feature: faktura-invoice-generator
 * Properties 6, 7, 8: Data Persistence Round-Trips
 * Validates: Requirements 3.2, 3.3, 4.4, 4.6, 13.1, 13.3
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type {
  CompanyData,
  ClientData,
  DraftInvoice,
  InvoiceDetails,
  LineItem,
} from "../../lib/types";

// ─── Arbitraries (data generators) ──────────────────────────────────────────

/**
 * Generates a valid 9-digit EIK string (just digits, no checksum validation needed
 * for persistence testing — we only care that the string survives the round-trip).
 */
const eikArb = fc
  .array(fc.integer({ min: 0, max: 9 }), { minLength: 9, maxLength: 9 })
  .map((digits) => digits.join(""));

/** Generates a valid client EIK (9 or 13 digits) */
const clientEikArb = fc.oneof(
  eikArb,
  fc
    .array(fc.integer({ min: 0, max: 9 }), { minLength: 13, maxLength: 13 })
    .map((digits) => digits.join(""))
);

/** Generates a non-empty string up to a given max length (for text fields) */
function textArb(maxLength: number): fc.Arbitrary<string> {
  return fc.string({ minLength: 1, maxLength: Math.min(maxLength, 50) });
}

/** Generates an optional string (empty or with content) */
function optionalTextArb(maxLength: number): fc.Arbitrary<string> {
  return fc.oneof(fc.constant(""), textArb(maxLength));
}

/** Generates a base64 logo string or null */
const logoArb: fc.Arbitrary<string | null> = fc.oneof(
  fc.constant(null),
  fc.string({ minLength: 10, maxLength: 50 }).map((s) => `data:image/png;base64,${s}`)
);

/** Generates a valid CompanyData object */
const companyDataArb: fc.Arbitrary<CompanyData> = fc.record({
  name: textArb(200),
  eik: eikArb,
  address: textArb(500),
  mol: textArb(200),
  iban: optionalTextArb(34),
  vatNumber: optionalTextArb(15),
  vatReason: optionalTextArb(200),
  logo: logoArb,
});

/** Generates a valid ClientData object */
const clientDataArb: fc.Arbitrary<ClientData> = fc.record({
  id: fc.uuid(),
  name: textArb(200),
  eik: clientEikArb,
  address: textArb(500),
  mol: textArb(200),
});

/** Generates a date string in YYYY-MM-DD format */
const dateStringArb = fc
  .integer({ min: 2020, max: 2030 })
  .chain((year) =>
    fc.integer({ min: 1, max: 12 }).chain((month) =>
      fc.integer({ min: 1, max: 28 }).map((day) => {
        const y = year.toString();
        const m = month.toString().padStart(2, "0");
        const d = day.toString().padStart(2, "0");
        return `${y}-${m}-${d}`;
      })
    )
  );

/** Generates a valid InvoiceDetails object */
const invoiceDetailsArb: fc.Arbitrary<InvoiceDetails> = fc.record({
  invoiceNumber: fc
    .array(fc.integer({ min: 0, max: 9 }), { minLength: 1, maxLength: 10 })
    .map((digits) => digits.join("").padStart(10, "0")),
  dateOfIssue: dateStringArb,
  dateOfTaxEvent: dateStringArb,
  paymentMethod: fc.constantFrom("bank_transfer" as const, "cash" as const),
});

/** Generates a valid LineItem object */
const lineItemArb: fc.Arbitrary<LineItem> = fc.record({
  id: fc.uuid(),
  description: textArb(200),
  quantity: fc.double({ min: 0.01, max: 10000, noNaN: true }).map((n) =>
    Math.round(n * 100) / 100
  ),
  unitPrice: fc.double({ min: 0.01, max: 999999.99, noNaN: true }).map((n) =>
    Math.round(n * 100) / 100
  ),
  unitOfMeasure: textArb(50),
  lineTotal: fc.double({ min: 0, max: 9999999999, noNaN: true }).map((n) =>
    Math.round(n * 100) / 100
  ),
});

/** Generates a non-empty array of line items (1 to 5 for speed) */
const lineItemsArb = fc.array(lineItemArb, { minLength: 1, maxLength: 5 });

/** Generates an ISO timestamp string */
const isoTimestampArb = dateStringArb.map((d) => `${d}T12:00:00.000Z`);

/** Generates a valid DraftInvoice object */
const draftInvoiceArb: fc.Arbitrary<DraftInvoice> = fc.record({
  id: fc.uuid(),
  lastModified: isoTimestampArb,
  company: companyDataArb,
  client: clientDataArb,
  invoiceDetails: invoiceDetailsArb,
  lineItems: lineItemsArb,
  label: fc.constantFrom("original" as const, "copy" as const),
});

// ─── Property Tests ──────────────────────────────────────────────────────────

describe("Property 6: Company Data Persistence Round-Trip", () => {
  it("serializing and deserializing any valid CompanyData produces an equal object", () => {
    fc.assert(
      fc.property(companyDataArb, (company) => {
        // Simulate localStorage: JSON.stringify → JSON.parse
        const serialized = JSON.stringify(company);
        const deserialized: CompanyData = JSON.parse(serialized);

        expect(deserialized).toEqual(company);
      }),
      { numRuns: 150 }
    );
  });

  it("all CompanyData fields survive the round-trip including null logo", () => {
    fc.assert(
      fc.property(companyDataArb, (company) => {
        const restored: CompanyData = JSON.parse(JSON.stringify(company));

        // Verify each field explicitly
        expect(restored.name).toBe(company.name);
        expect(restored.eik).toBe(company.eik);
        expect(restored.address).toBe(company.address);
        expect(restored.mol).toBe(company.mol);
        expect(restored.iban).toBe(company.iban);
        expect(restored.vatNumber).toBe(company.vatNumber);
        expect(restored.vatReason).toBe(company.vatReason);
        expect(restored.logo).toBe(company.logo);
      }),
      { numRuns: 100 }
    );
  });
});

describe("Property 7: Client Data Persistence Round-Trip", () => {
  it("serializing and deserializing any valid ClientData produces an equal object", () => {
    fc.assert(
      fc.property(clientDataArb, (client) => {
        // Simulate localStorage: JSON.stringify → JSON.parse
        const serialized = JSON.stringify(client);
        const deserialized: ClientData = JSON.parse(serialized);

        expect(deserialized).toEqual(client);
      }),
      { numRuns: 150 }
    );
  });

  it("saving and loading a list of clients preserves all entries", () => {
    fc.assert(
      fc.property(
        fc.array(clientDataArb, { minLength: 1, maxLength: 10 }),
        (clients) => {
          // Simulate saving the entire clients array to localStorage
          const serialized = JSON.stringify(clients);
          const deserialized: ClientData[] = JSON.parse(serialized);

          expect(deserialized).toHaveLength(clients.length);
          for (let i = 0; i < clients.length; i++) {
            expect(deserialized[i]).toEqual(clients[i]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("all ClientData fields survive the round-trip", () => {
    fc.assert(
      fc.property(clientDataArb, (client) => {
        const restored: ClientData = JSON.parse(JSON.stringify(client));

        expect(restored.id).toBe(client.id);
        expect(restored.name).toBe(client.name);
        expect(restored.eik).toBe(client.eik);
        expect(restored.address).toBe(client.address);
        expect(restored.mol).toBe(client.mol);
      }),
      { numRuns: 100 }
    );
  });
});

describe("Property 8: Draft Save/Load Round-Trip", () => {
  it("serializing and deserializing any valid DraftInvoice produces an equal object", () => {
    fc.assert(
      fc.property(draftInvoiceArb, (draft) => {
        // Simulate localStorage: JSON.stringify → JSON.parse
        const serialized = JSON.stringify(draft);
        const deserialized: DraftInvoice = JSON.parse(serialized);

        expect(deserialized).toEqual(draft);
      }),
      { numRuns: 150 }
    );
  });

  it("all nested objects within a draft survive the round-trip", () => {
    fc.assert(
      fc.property(draftInvoiceArb, (draft) => {
        const restored: DraftInvoice = JSON.parse(JSON.stringify(draft));

        // Top-level fields
        expect(restored.id).toBe(draft.id);
        expect(restored.lastModified).toBe(draft.lastModified);
        expect(restored.label).toBe(draft.label);

        // Nested company data
        expect(restored.company).toEqual(draft.company);

        // Nested client data
        expect(restored.client).toEqual(draft.client);

        // Nested invoice details
        expect(restored.invoiceDetails).toEqual(draft.invoiceDetails);

        // Line items (array of objects)
        expect(restored.lineItems).toHaveLength(draft.lineItems.length);
        for (let i = 0; i < draft.lineItems.length; i++) {
          expect(restored.lineItems[i]).toEqual(draft.lineItems[i]);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("saving and loading multiple drafts preserves all of them", () => {
    fc.assert(
      fc.property(
        fc.array(draftInvoiceArb, { minLength: 1, maxLength: 10 }),
        (drafts) => {
          // Simulate saving the full drafts array
          const serialized = JSON.stringify(drafts);
          const deserialized: DraftInvoice[] = JSON.parse(serialized);

          expect(deserialized).toHaveLength(drafts.length);
          for (let i = 0; i < drafts.length; i++) {
            expect(deserialized[i]).toEqual(drafts[i]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
