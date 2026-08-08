/**
 * Property-Based Tests for Form Validation
 *
 * WHAT IT IS: Tests that verify the invoice form validation correctly rejects
 * incomplete data and invalid dates across hundreds of random inputs.
 * WHY IT EXISTS: The validation schema must prevent invalid invoices from being
 * generated. These tests ensure no combination of missing fields slips through.
 * REAL WORLD ANALOGY: Like a customs officer checking every possible combination
 * of missing documents — if anything is missing, the form is rejected.
 *
 * Feature: faktura-invoice-generator
 * Property 12: Form Validation Rejects Incomplete Data
 * Property 15: Date Validation
 * Validates: Requirements 10.11, 14.1, 14.5
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { invoiceFormSchema } from "../../lib/validation";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Computes a valid EIK check digit for an 8-digit prefix.
 * We need this to generate valid EIK strings for test data.
 */
function computeCheckDigit(digits: number[]): number {
  const weights1 = [1, 2, 3, 4, 5, 6, 7, 8];
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += digits[i] * weights1[i];
  }
  let remainder = sum % 11;

  if (remainder < 10) return remainder;

  const weights2 = [3, 4, 5, 6, 7, 8, 9, 10];
  sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += digits[i] * weights2[i];
  }
  remainder = sum % 11;

  return remainder < 10 ? remainder : 0;
}

/** Generates a valid 9-digit EIK string */
function generateValidEIK(): fc.Arbitrary<string> {
  return fc
    .array(fc.integer({ min: 0, max: 9 }), { minLength: 8, maxLength: 8 })
    .map((prefix) => {
      const checkDigit = computeCheckDigit(prefix);
      return prefix.join("") + checkDigit.toString();
    });
}

/** Generates a valid date string (YYYY-MM-DD) that is within the last year */
function generateValidDateString(): fc.Arbitrary<string> {
  // Generate a number of days in the past (0 to 364 to stay safely within 1 year)
  return fc.integer({ min: 0, max: 364 }).map((daysAgo) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - daysAgo);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
}

/**
 * Builds a completely valid invoice form data object.
 * We use this as a baseline, then blank out specific fields to test validation.
 */
function buildValidFormData(
  companyEik: string,
  clientEik: string,
  dateOfIssue: string
) {
  return {
    company: {
      name: "Test Company",
      eik: companyEik,
      address: "123 Test Street",
      mol: "Ivan Ivanov",
      iban: "",
      vatNumber: "",
      vatReason: "",
      logo: null,
    },
    client: {
      name: "Client Company",
      eik: clientEik,
      address: "456 Client Avenue",
      mol: "Petar Petrov",
    },
    invoiceDetails: {
      invoiceNumber: "0000000001",
      dateOfIssue: dateOfIssue,
      dateOfTaxEvent: dateOfIssue,
      paymentMethod: "bank_transfer" as const,
    },
    lineItems: [
      {
        id: "item-1",
        description: "Web development services",
        quantity: 10,
        unitPrice: 50,
        unitOfMeasure: "hours",
        lineTotal: 500,
      },
    ],
  };
}

// ─── Required fields that can be blanked out for testing ─────────────────────

/**
 * Each entry maps a field name (for error message checking) to a function
 * that blanks out that specific field in the form data.
 */
const REQUIRED_FIELDS = [
  { name: "company.name", blank: (data: ReturnType<typeof buildValidFormData>) => { data.company.name = ""; } },
  { name: "company.eik", blank: (data: ReturnType<typeof buildValidFormData>) => { data.company.eik = ""; } },
  { name: "company.address", blank: (data: ReturnType<typeof buildValidFormData>) => { data.company.address = ""; } },
  { name: "company.mol", blank: (data: ReturnType<typeof buildValidFormData>) => { data.company.mol = ""; } },
  { name: "client.name", blank: (data: ReturnType<typeof buildValidFormData>) => { data.client.name = ""; } },
  { name: "client.eik", blank: (data: ReturnType<typeof buildValidFormData>) => { data.client.eik = ""; } },
  { name: "client.address", blank: (data: ReturnType<typeof buildValidFormData>) => { data.client.address = ""; } },
  { name: "invoiceDetails.invoiceNumber", blank: (data: ReturnType<typeof buildValidFormData>) => { data.invoiceDetails.invoiceNumber = ""; } },
  { name: "invoiceDetails.dateOfIssue", blank: (data: ReturnType<typeof buildValidFormData>) => { data.invoiceDetails.dateOfIssue = ""; } },
  { name: "invoiceDetails.dateOfTaxEvent", blank: (data: ReturnType<typeof buildValidFormData>) => { data.invoiceDetails.dateOfTaxEvent = ""; } },
] as const;

// ─── Property 12: Form Validation Rejects Incomplete Data ────────────────────

describe("Property 12: Form Validation Rejects Incomplete Data", () => {
  it("should reject form when any non-empty subset of required fields is left empty", () => {
    fc.assert(
      fc.property(
        generateValidEIK(),
        generateValidEIK(),
        generateValidDateString(),
        // Generate a non-empty subset of fields to blank (represented as indices)
        fc.subarray(
          Array.from({ length: REQUIRED_FIELDS.length }, (_, i) => i),
          { minLength: 1 }
        ),
        (companyEik, clientEik, dateStr, fieldIndices) => {
          // Start with fully valid data
          const formData = buildValidFormData(companyEik, clientEik, dateStr);

          // Blank out the selected subset of required fields
          for (const idx of fieldIndices) {
            REQUIRED_FIELDS[idx].blank(formData);
          }

          // Validation should FAIL
          const result = invoiceFormSchema.safeParse(formData);
          expect(result.success).toBe(false);

          // Verify errors exist for the blanked fields
          if (!result.success) {
            const errorPaths = result.error.issues.map((issue) =>
              issue.path.join(".")
            );

            for (const idx of fieldIndices) {
              const fieldName = REQUIRED_FIELDS[idx].name;
              // Each blanked field should have a corresponding error
              const hasError = errorPaths.some((path) =>
                path.startsWith(fieldName)
              );
              expect(hasError).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should accept form when all required fields are filled with valid data", () => {
    fc.assert(
      fc.property(
        generateValidEIK(),
        generateValidEIK(),
        generateValidDateString(),
        (companyEik, clientEik, dateStr) => {
          const formData = buildValidFormData(companyEik, clientEik, dateStr);
          const result = invoiceFormSchema.safeParse(formData);
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should reject form when line items array is empty", () => {
    fc.assert(
      fc.property(
        generateValidEIK(),
        generateValidEIK(),
        generateValidDateString(),
        (companyEik, clientEik, dateStr) => {
          const formData = buildValidFormData(companyEik, clientEik, dateStr);
          formData.lineItems = [];

          const result = invoiceFormSchema.safeParse(formData);
          expect(result.success).toBe(false);

          if (!result.success) {
            const errorPaths = result.error.issues.map((issue) =>
              issue.path.join(".")
            );
            const hasLineItemError = errorPaths.some((path) =>
              path.startsWith("lineItems")
            );
            expect(hasLineItemError).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 15: Date Validation ────────────────────────────────────────────

describe("Property 15: Date Validation", () => {
  it("should accept valid calendar dates that are within the last year", () => {
    fc.assert(
      fc.property(
        generateValidEIK(),
        generateValidEIK(),
        generateValidDateString(),
        (companyEik, clientEik, dateStr) => {
          const formData = buildValidFormData(companyEik, clientEik, dateStr);
          const result = invoiceFormSchema.safeParse(formData);
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should reject dates more than 1 year in the past", () => {
    // Generate dates that are definitely more than 1 year ago
    const oldDateArb = fc
      .integer({ min: 2, max: 10 }) // years in the past (2-10)
      .chain((yearsAgo) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const pastDate = new Date(today);
        pastDate.setFullYear(pastDate.getFullYear() - yearsAgo);
        // Generate a date around that year
        const min = new Date(pastDate);
        min.setMonth(0, 1);
        const max = new Date(pastDate);
        max.setMonth(11, 28);
        return fc.date({ min, max }).map((d) => {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        });
      });

    fc.assert(
      fc.property(
        generateValidEIK(),
        generateValidEIK(),
        oldDateArb,
        (companyEik, clientEik, oldDate) => {
          const formData = buildValidFormData(companyEik, clientEik, oldDate);
          // Use a valid date for dateOfTaxEvent so we only test dateOfIssue
          const today = new Date();
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
          formData.invoiceDetails.dateOfTaxEvent = todayStr;

          const result = invoiceFormSchema.safeParse(formData);
          expect(result.success).toBe(false);

          if (!result.success) {
            const dateErrors = result.error.issues.filter((issue) =>
              issue.path.join(".").includes("dateOfIssue")
            );
            expect(dateErrors.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should reject invalid calendar dates (e.g., Feb 30, month 13)", () => {
    // Generate dates that are NOT valid calendar dates
    const invalidDateArb = fc.oneof(
      // February 30
      fc.constant("2024-02-30"),
      // February 31
      fc.constant("2024-02-31"),
      // April 31
      fc.constant("2024-04-31"),
      // June 31
      fc.constant("2024-06-31"),
      // Month 13
      fc.integer({ min: 2020, max: 2025 }).map((y) => `${y}-13-01`),
      // Month 00
      fc.integer({ min: 2020, max: 2025 }).map((y) => `${y}-00-15`),
      // Day 00
      fc.integer({ min: 2020, max: 2025 }).map((y) => `${y}-06-00`),
      // Day 32
      fc.integer({ min: 2020, max: 2025 }).map((y) => `${y}-01-32`)
    );

    fc.assert(
      fc.property(
        generateValidEIK(),
        generateValidEIK(),
        invalidDateArb,
        (companyEik, clientEik, badDate) => {
          const formData = buildValidFormData(companyEik, clientEik, badDate);
          // Use a valid date for dateOfTaxEvent so we only test dateOfIssue
          const today = new Date();
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
          formData.invoiceDetails.dateOfTaxEvent = todayStr;

          const result = invoiceFormSchema.safeParse(formData);
          expect(result.success).toBe(false);

          if (!result.success) {
            const dateErrors = result.error.issues.filter((issue) =>
              issue.path.join(".").includes("dateOfIssue")
            );
            expect(dateErrors.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should reject non-date format strings in dateOfIssue", () => {
    // Generate strings that don't match YYYY-MM-DD format at all
    const nonDateArb = fc.oneof(
      fc.constant("not-a-date"),
      fc.constant("12/25/2024"),
      fc.constant("2024/01/15"),
      fc.constant("20240115"),
      fc.constant("Jan 15, 2024"),
      // Random short strings
      fc.string({ minLength: 1, maxLength: 5 }).filter((s) => !/^\d{4}-\d{2}-\d{2}$/.test(s))
    );

    fc.assert(
      fc.property(
        generateValidEIK(),
        generateValidEIK(),
        nonDateArb,
        (companyEik, clientEik, badFormat) => {
          const formData = buildValidFormData(companyEik, clientEik, badFormat);
          // Use a valid date for dateOfTaxEvent
          const today = new Date();
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
          formData.invoiceDetails.dateOfTaxEvent = todayStr;

          const result = invoiceFormSchema.safeParse(formData);
          expect(result.success).toBe(false);

          if (!result.success) {
            const dateErrors = result.error.issues.filter((issue) =>
              issue.path.join(".").includes("dateOfIssue")
            );
            expect(dateErrors.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
