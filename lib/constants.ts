/**
 * Shared constants for Invoicify.
 *
 * WHAT IT IS: A single file holding all "magic values" used across the app.
 * WHY IT EXISTS: Instead of scattering numbers and strings throughout the code,
 * we define them once here. If a limit changes, we update one place.
 * REAL WORLD ANALOGY: Like a settings panel for the entire application —
 * all configurable values live in one spot.
 */

import type { CompanyData, LineItem } from "./types";

// ─── localStorage Keys ───────────────────────────────────────────────────────
/**
 * Keys used to read/write data in localStorage.
 * Using a shared object prevents typos and makes it easy to find all usages.
 */
export const STORAGE_KEYS = {
  /** User's own company information */
  company: "invoicify_company",
  /** Array of saved clients */
  clients: "invoicify_clients",
  /** Array of draft invoices */
  drafts: "invoicify_drafts",
  /** The last invoice number that was successfully generated as PDF */
  lastInvoiceNumber: "invoicify_last_invoice_number",
  /** The last credit note number used */
  lastCreditNoteNumber: "invoicify_last_credit_note_number",
  /** Theme preference: "dark" or "light" */
  theme: "invoicify_theme",
  /** Total number of invoices generated (shown on landing page) */
  invoiceCount: "invoicify_invoice_count",
} as const;

// ─── Validation Limits ───────────────────────────────────────────────────────
/**
 * Maximum/minimum values for form fields.
 * These match the requirements document and Zod schema constraints.
 */
export const VALIDATION_LIMITS = {
  /** Maximum characters for company/client name fields */
  maxNameLength: 200,
  /** Maximum characters for address fields */
  maxAddressLength: 500,
  /** Maximum characters for MOL fields */
  maxMolLength: 200,
  /** Maximum characters for VAT reason text */
  maxVatReasonLength: 200,
  /** Maximum characters for invoice number */
  maxInvoiceNumberLength: 20,
  /** Maximum characters for line item description */
  maxDescriptionLength: 200,
  /** Maximum characters for unit of measure */
  maxUnitOfMeasureLength: 50,

  /** Exact number of digits for a standard EIK */
  eikLength: 9,
  /** EIK can also be 13 digits (for client EIK) */
  eikLengthExtended: 13,

  /** Minimum quantity per line item */
  minQuantity: 0.01,
  /** Maximum quantity per line item */
  maxQuantity: 10_000,

  /** Minimum unit price per line item (in BGN) */
  minUnitPrice: 0.01,
  /** Maximum unit price per line item (in BGN) */
  maxUnitPrice: 999_999.99,

  /** Maximum number of line items on a single invoice */
  maxLineItems: 50,
  /** Minimum number of line items (at least one is required) */
  minLineItems: 1,

  /** Maximum number of saved drafts in localStorage */
  maxDrafts: 10,

  /** Maximum logo file size in bytes (2 MB) */
  maxLogoSizeBytes: 2 * 1024 * 1024,

  /** Minimum supported amount for amount-in-words conversion */
  minAmount: 0.01,
  /** Maximum supported amount for amount-in-words conversion */
  maxAmount: 9_999_999.99,

  /** VAT rate in Bulgaria (20%) */
  vatRate: 0.2,

  /** Number of digits for zero-padded invoice numbers */
  invoiceNumberPadLength: 10,
} as const;

// ─── Default Values ──────────────────────────────────────────────────────────
/**
 * Sensible defaults used when creating new invoices or resetting the form.
 */

/** Default company data — all fields empty, ready to be filled */
export const DEFAULT_COMPANY_DATA: CompanyData = {
  name: "",
  eik: "",
  address: "",
  mol: "",
  iban: "",
  vatNumber: "",
  vatReason: "",
  logo: null,
};

/** Default line item — a blank row added when user clicks "+ Add row" */
export const DEFAULT_LINE_ITEM: Omit<LineItem, "id"> = {
  description: "",
  quantity: 0,
  unitPrice: 0,
  unitOfMeasure: "",
  lineTotal: 0,
};

/** Default payment method for new invoices */
export const DEFAULT_PAYMENT_METHOD = "bank_transfer" as const;

/** Default theme when no preference is saved */
export const DEFAULT_THEME = "dark" as const;

/** Default starting invoice number (10-digit zero-padded) */
export const DEFAULT_INVOICE_NUMBER = "0000000001";

/** Accepted image file types for logo upload */
export const ACCEPTED_LOGO_TYPES = ["image/png", "image/jpeg", "image/svg+xml"] as const;

/** Auto-save debounce delay in milliseconds */
export const AUTO_SAVE_DELAY_MS = 2000;

/** Toast notification display duration in milliseconds */
export const TOAST_DURATION_MS = 4000;

/** PDF generation timeout in milliseconds */
export const PDF_TIMEOUT_MS = 30_000;
