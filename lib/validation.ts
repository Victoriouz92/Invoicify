/**
 * Invoice Form Validation Schema
 *
 * WHAT IT IS: A Zod schema that defines the shape and rules for every field
 * in the invoice form.
 * WHY IT EXISTS: Before generating a PDF, we need to ensure all required data
 * is present and correct. This schema is the single source of truth for what
 * "valid invoice data" means.
 * REAL WORLD ANALOGY: Like a checklist a clerk uses before stamping a document —
 * every box must be checked before the form is accepted.
 */

import { z } from "zod";
import { validateEIK } from "./eik-validator";
import { VALIDATION_LIMITS } from "./constants";

// ─── Helper: Date Validation ─────────────────────────────────────────────────

/**
 * Checks if a date string is a valid calendar date AND not more than 1 year
 * in the past relative to today.
 */
function isValidDate(dateStr: string): boolean {
  // Must match YYYY-MM-DD format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }

  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  // Check if the date components match (catches invalid dates like Feb 30)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return false;
  }

  // Check not more than 1 year in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  return date >= oneYearAgo;
}

// ─── Helper: EIK Checksum Refinement ─────────────────────────────────────────

/**
 * Wraps validateEIK for use as a Zod refinement.
 * Returns true only when the EIK passes all checks (format + checksum).
 */
function isValidEIK(eik: string): boolean {
  return validateEIK(eik).valid;
}

// ─── Line Item Schema ────────────────────────────────────────────────────────

export const lineItemSchema = z.object({
  id: z.string(),
  description: z
    .string()
    .min(1, "Description is required")
    .max(VALIDATION_LIMITS.maxDescriptionLength),
  quantity: z
    .number()
    .min(VALIDATION_LIMITS.minQuantity, "Quantity must be at least 0.01")
    .max(VALIDATION_LIMITS.maxQuantity, "Quantity cannot exceed 10,000"),
  unitPrice: z
    .number()
    .min(VALIDATION_LIMITS.minUnitPrice, "Unit price must be at least 0.01")
    .max(VALIDATION_LIMITS.maxUnitPrice, "Unit price cannot exceed 999,999.99"),
  unitOfMeasure: z.string().max(VALIDATION_LIMITS.maxUnitOfMeasureLength),
  lineTotal: z.number(),
});

// ─── Invoice Form Schema ─────────────────────────────────────────────────────

export const invoiceFormSchema = z.object({
  company: z.object({
    name: z
      .string()
      .min(1, "Company name is required")
      .max(VALIDATION_LIMITS.maxNameLength),
    eik: z.string().refine(isValidEIK, "Invalid EIK"),
    address: z
      .string()
      .min(1, "Address is required")
      .max(VALIDATION_LIMITS.maxAddressLength),
    mol: z
      .string()
      .min(1, "MOL is required")
      .max(VALIDATION_LIMITS.maxMolLength),
    iban: z.string().optional(),
    vatNumber: z.string().optional(),
    vatReason: z.string().max(VALIDATION_LIMITS.maxVatReasonLength).optional(),
    logo: z.string().nullable(),
  }),
  client: z.object({
    name: z
      .string()
      .min(1, "Client name is required")
      .max(VALIDATION_LIMITS.maxNameLength),
    eik: z.string().refine(isValidEIK, "Invalid EIK"),
    address: z
      .string()
      .min(1, "Client address is required")
      .max(VALIDATION_LIMITS.maxAddressLength),
    mol: z
      .string()
      .min(1, "Client MOL is required")
      .max(VALIDATION_LIMITS.maxMolLength),
  }),
  invoiceDetails: z.object({
    invoiceNumber: z
      .string()
      .min(1, "Invoice number is required")
      .max(VALIDATION_LIMITS.maxInvoiceNumberLength),
    dateOfIssue: z
      .string()
      .min(1, "Date of issue is required")
      .refine(isValidDate, "Date must be a valid calendar date and not more than 1 year in the past"),
    dateOfTaxEvent: z
      .string()
      .min(1, "Date of tax event is required"),
    paymentMethod: z.enum(["bank_transfer", "cash"]),
  }),
  lineItems: z
    .array(lineItemSchema)
    .min(VALIDATION_LIMITS.minLineItems, "At least one line item is required")
    .max(VALIDATION_LIMITS.maxLineItems),
});

// ─── Inferred Type ───────────────────────────────────────────────────────────

/**
 * TypeScript type inferred from the Zod schema.
 * Use this wherever you need to type invoice form data throughout the app.
 */
export type InvoiceFormData = z.infer<typeof invoiceFormSchema>;
