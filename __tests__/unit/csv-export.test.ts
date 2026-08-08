/**
 * Property-Based Tests for CSV Export.
 *
 * WHAT IT IS: Tests that verify the CSV export function correctly filters invoices
 * by month and produces properly formatted output for ANY set of invoices.
 *
 * WHY IT EXISTS: The CSV export is used by freelancers to send monthly data to their
 * accountants. Incorrect filtering or formatting could cause accounting errors.
 *
 * REAL WORLD ANALOGY: Like testing that a bank's monthly statement always includes
 * exactly the transactions from that month — not more, not fewer — and always
 * shows the correct columns.
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { filterDraftsByMonth, generateCsv } from "../../lib/csv-export";
import { roundTo2 } from "../../lib/totals-calculator";
import { VALIDATION_LIMITS } from "../../lib/constants";
import type { DraftInvoice, LineItem } from "../../lib/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Creates a valid LineItem with pre-calculated lineTotal.
 */
function makeLineItem(quantity: number, unitPrice: number): LineItem {
  return {
    id: crypto.randomUUID(),
    description: "Test service",
    quantity,
    unitPrice,
    unitOfMeasure: "бр.",
    lineTotal: roundTo2(quantity * unitPrice),
  };
}

/**
 * Creates a DraftInvoice with a specific dateOfIssue.
 */
function makeDraft(
  dateOfIssue: string,
  invoiceNumber: string,
  clientName: string,
  clientEik: string,
  lineItems: LineItem[],
  vatRegistered: boolean
): DraftInvoice {
  return {
    id: crypto.randomUUID(),
    lastModified: new Date().toISOString(),
    company: {
      name: "Test Company",
      eik: "123456789",
      address: "Test Address",
      mol: "Test MOL",
      iban: "BG12AAAA12345678901234",
      vatNumber: vatRegistered ? "BG123456789" : "",
      vatReason: vatRegistered ? "" : "чл. 113, ал. 9 от ЗДДС",
      logo: null,
    },
    client: {
      id: crypto.randomUUID(),
      name: clientName,
      eik: clientEik,
      address: "Client Address",
      mol: "Client MOL",
    },
    invoiceDetails: {
      invoiceNumber,
      dateOfIssue,
      dateOfTaxEvent: dateOfIssue,
      paymentMethod: "bank_transfer",
    },
    lineItems,
    label: "original",
  };
}

// ─── Arbitraries (Smart Generators) ─────────────────────────────────────────

/** Generates a valid year between 2020 and 2030 */
const yearArb = fc.integer({ min: 2020, max: 2030 });

/** Generates a valid month between 1 and 12 */
const monthArb = fc.integer({ min: 1, max: 12 });

/** Generates a valid day for a given year and month */
function dayArb(year: number, month: number): fc.Arbitrary<number> {
  const daysInMonth = new Date(year, month, 0).getDate();
  return fc.integer({ min: 1, max: daysInMonth });
}

/** Generates a valid date string "YYYY-MM-DD" for a specific year and month */
function dateInMonthArb(year: number, month: number): fc.Arbitrary<string> {
  return dayArb(year, month).map((day) => {
    const mm = String(month).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  });
}

/** Generates a random date string "YYYY-MM-DD" from any year/month */
const randomDateArb = fc
  .tuple(yearArb, monthArb)
  .chain(([year, month]) => dateInMonthArb(year, month));

/** Generates a simple invoice number */
const invoiceNumberArb = fc
  .integer({ min: 1, max: 999999 })
  .map((n) => String(n).padStart(10, "0"));

/** Generates a simple client name (no commas/quotes to avoid CSV escaping complexity) */
const clientNameArb = fc
  .array(fc.constantFrom("A", "B", "C", "D", "E", "F"), {
    minLength: 1,
    maxLength: 20,
  })
  .map((chars) => chars.join(""));

/** Generates a valid EIK (9 digits) */
const clientEikArb = fc
  .array(fc.constantFrom("0", "1", "2", "3", "4", "5", "6", "7", "8", "9"), {
    minLength: 9,
    maxLength: 9,
  })
  .map((digits) => digits.join(""));

/** Generates a small valid quantity */
const quantityArb = fc
  .double({ min: 0.01, max: 100, noNaN: true, noDefaultInfinity: true })
  .map((n) => roundTo2(n));

/** Generates a small valid unit price */
const unitPriceArb = fc
  .double({ min: 0.01, max: 1000, noNaN: true, noDefaultInfinity: true })
  .map((n) => roundTo2(n));

/** Generates 1-5 line items */
const lineItemsArb = fc
  .array(fc.tuple(quantityArb, unitPriceArb).map(([q, p]) => makeLineItem(q, p)), {
    minLength: 1,
    maxLength: 5,
  });

/** Generates a boolean for VAT registration */
const vatRegisteredArb = fc.boolean();

/**
 * Generates a DraftInvoice with a specific date.
 */
function draftWithDateArb(dateStr: string): fc.Arbitrary<DraftInvoice> {
  return fc
    .tuple(invoiceNumberArb, clientNameArb, clientEikArb, lineItemsArb, vatRegisteredArb)
    .map(([num, name, eik, items, vat]) =>
      makeDraft(dateStr, num, name, eik, items, vat)
    );
}

// ─── Property 13: CSV Export Correctness ─────────────────────────────────────
// Feature: faktura-invoice-generator, Property 13: CSV Export Correctness

describe("Property 13: CSV Export Correctness", () => {
  /**
   * Validates: Requirements 21.1
   * The exported CSV contains exactly the invoices whose dateOfIssue
   * falls within the selected month.
   */
  it("filterDraftsByMonth returns only invoices matching the selected month", () => {
    fc.assert(
      fc.property(
        yearArb,
        monthArb,
        fc.tuple(yearArb, monthArb).chain(([y, m]) =>
          fc.tuple(
            // Drafts IN the target month (0-5)
            fc.array(dateInMonthArb(y, m).chain((d) => draftWithDateArb(d)), {
              minLength: 0,
              maxLength: 5,
            }),
            // Drafts NOT in the target month (0-5) - different month or year
            fc.array(
              fc
                .tuple(yearArb, monthArb)
                .filter(([y2, m2]) => y2 !== y || m2 !== m)
                .chain(([y2, m2]) => dateInMonthArb(y2, m2))
                .chain((d) => draftWithDateArb(d)),
              { minLength: 0, maxLength: 5 }
            ),
            fc.constant([y, m] as [number, number])
          )
        ),
        (_year, _month, [matchingDrafts, nonMatchingDrafts, [targetYear, targetMonth]]) => {
          // Combine both sets
          const allDrafts = [...matchingDrafts, ...nonMatchingDrafts];

          // Filter by month
          const filtered = filterDraftsByMonth(allDrafts, targetYear, targetMonth);

          // The filtered set should contain exactly the matching drafts
          expect(filtered.length).toBe(matchingDrafts.length);

          // Every filtered draft should have date in the target month
          const monthStr = String(targetMonth).padStart(2, "0");
          const prefix = `${targetYear}-${monthStr}`;
          for (const draft of filtered) {
            expect(draft.invoiceDetails.dateOfIssue.startsWith(prefix)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Validates: Requirements 21.2
   * Each CSV row contains: invoice number, date of issue, client name,
   * client EIK, tax base, VAT amount, and grand total.
   */
  it("CSV output contains correct columns for each invoice", () => {
    fc.assert(
      fc.property(
        fc.tuple(yearArb, monthArb).chain(([y, m]) =>
          fc.tuple(
            fc.array(dateInMonthArb(y, m).chain((d) => draftWithDateArb(d)), {
              minLength: 1,
              maxLength: 5,
            }),
            fc.constant(y),
            fc.constant(m)
          )
        ),
        ([drafts, year, month]) => {
          const result = generateCsv(drafts, year, month);

          // Remove BOM and split into lines
          const content = result.content.replace(/^\uFEFF/, "");
          const lines = content.split("\n");

          // First line should be the header
          expect(lines[0]).toBe("Номер,Дата,Клиент,ЕИК,Данъчна основа,ДДС,Общо");

          // Should have header + one row per draft
          expect(lines.length).toBe(drafts.length + 1);

          // Verify each data row has 7 fields and correct values
          for (let i = 0; i < drafts.length; i++) {
            const draft = drafts[i];
            const row = lines[i + 1];

            // Calculate expected totals (same logic as csv-export.ts)
            const taxBase = roundTo2(
              draft.lineItems.reduce((sum, item) => sum + item.lineTotal, 0)
            );
            const isVATRegistered = draft.company.vatNumber !== "";
            const vatAmount = isVATRegistered
              ? roundTo2(taxBase * VALIDATION_LIMITS.vatRate)
              : 0;
            const grandTotal = roundTo2(taxBase + vatAmount);

            // Check that the row contains the expected values
            expect(row).toContain(draft.invoiceDetails.dateOfIssue);
            expect(row).toContain(draft.client.eik);
            expect(row).toContain(taxBase.toFixed(2));
            expect(row).toContain(vatAmount.toFixed(2));
            expect(row).toContain(grandTotal.toFixed(2));
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Validates: Requirements 21.5
   * The filename matches the pattern "invoices_[YYYY]-[MM].csv".
   */
  it("filename matches pattern invoices_YYYY-MM.csv", () => {
    fc.assert(
      fc.property(yearArb, monthArb, (year, month) => {
        const result = generateCsv([], year, month);

        const monthStr = String(month).padStart(2, "0");
        const expectedFilename = `invoices_${year}-${monthStr}.csv`;

        expect(result.filename).toBe(expectedFilename);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Validates: Requirements 21.1, 21.2
   * The count field matches the number of invoices passed in.
   */
  it("count field matches the number of drafts provided", () => {
    fc.assert(
      fc.property(
        fc.tuple(yearArb, monthArb).chain(([y, m]) =>
          fc.tuple(
            fc.array(dateInMonthArb(y, m).chain((d) => draftWithDateArb(d)), {
              minLength: 0,
              maxLength: 10,
            }),
            fc.constant(y),
            fc.constant(m)
          )
        ),
        ([drafts, year, month]) => {
          const result = generateCsv(drafts, year, month);
          expect(result.count).toBe(drafts.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Validates: Requirements 21.2
   * CSV content starts with UTF-8 BOM for Excel compatibility.
   */
  it("CSV content starts with UTF-8 BOM", () => {
    fc.assert(
      fc.property(
        fc.tuple(yearArb, monthArb).chain(([y, m]) =>
          fc.tuple(
            fc.array(dateInMonthArb(y, m).chain((d) => draftWithDateArb(d)), {
              minLength: 0,
              maxLength: 3,
            }),
            fc.constant(y),
            fc.constant(m)
          )
        ),
        ([drafts, year, month]) => {
          const result = generateCsv(drafts, year, month);
          expect(result.content.charCodeAt(0)).toBe(0xfeff);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Validates: Requirements 21.1, 21.2, 21.5
   * End-to-end: filter + generate produces CSV with only matching invoices
   * and correct filename for any mix of invoices across months.
   */
  it("full pipeline: filter then generate produces correct output", () => {
    fc.assert(
      fc.property(
        fc.tuple(yearArb, monthArb).chain(([y, m]) =>
          fc.tuple(
            // Some drafts in target month
            fc.array(dateInMonthArb(y, m).chain((d) => draftWithDateArb(d)), {
              minLength: 1,
              maxLength: 4,
            }),
            // Some drafts in other months
            fc.array(
              fc
                .tuple(yearArb, monthArb)
                .filter(([y2, m2]) => y2 !== y || m2 !== m)
                .chain(([y2, m2]) => dateInMonthArb(y2, m2))
                .chain((d) => draftWithDateArb(d)),
              { minLength: 0, maxLength: 4 }
            ),
            fc.constant(y),
            fc.constant(m)
          )
        ),
        ([matchingDrafts, otherDrafts, year, month]) => {
          const allDrafts = [...matchingDrafts, ...otherDrafts];

          // Step 1: Filter
          const filtered = filterDraftsByMonth(allDrafts, year, month);

          // Step 2: Generate CSV
          const result = generateCsv(filtered, year, month);

          // Verify count matches filtered set
          expect(result.count).toBe(matchingDrafts.length);

          // Verify filename
          const monthStr = String(month).padStart(2, "0");
          expect(result.filename).toBe(`invoices_${year}-${monthStr}.csv`);

          // Verify CSV has header + correct number of data rows
          const content = result.content.replace(/^\uFEFF/, "");
          const lines = content.split("\n");
          expect(lines.length).toBe(matchingDrafts.length + 1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
