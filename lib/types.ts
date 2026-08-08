/**
 * Shared TypeScript interfaces for Invoicify.
 *
 * WHAT IT IS: A single file defining the "shape" of all data objects used across the app.
 * WHY IT EXISTS: Having one source of truth for data types prevents mismatches between
 * components and makes it easy to see what fields each object contains.
 * REAL WORLD ANALOGY: Like a blueprint that everyone on a construction site follows —
 * if you change the blueprint, everyone sees the update.
 */

// ─── Company Data ────────────────────────────────────────────────────────────
/**
 * Represents the user's own company information.
 * Persisted to localStorage so it's remembered between sessions.
 */
export interface CompanyData {
  /** Company legal name (max 200 characters) */
  name: string;
  /** Bulgarian EIK number — exactly 9 digits with a checksum */
  eik: string;
  /** Full company address (max 500 characters) */
  address: string;
  /** MOL — the materially responsible person / authorized representative (max 200 chars) */
  mol: string;
  /** Bank account IBAN (optional) */
  iban: string;
  /** VAT registration number (optional — if empty, vatReason is required) */
  vatNumber: string;
  /** Legal reason for not charging VAT, e.g. "чл. 113, ал. 9 от ЗДДС" (max 200 chars) */
  vatReason: string;
  /** Company logo as a base64 data URI, or null if no logo uploaded */
  logo: string | null;
}

// ─── Client Data ─────────────────────────────────────────────────────────────
/**
 * Represents a client (the invoice recipient).
 * Clients are saved to localStorage for reuse across invoices.
 */
export interface ClientData {
  /** Unique identifier generated with crypto.randomUUID() */
  id: string;
  /** Client company name (max 200 characters, required) */
  name: string;
  /** Client EIK — 9 or 13 digits (required) */
  eik: string;
  /** Client full address (max 500 characters, required) */
  address: string;
  /** Client MOL — authorized representative (max 200 characters, required) */
  mol: string;
}

// ─── Invoice Details ─────────────────────────────────────────────────────────
/**
 * Administrative metadata for an invoice (number, dates, payment method).
 */
export interface InvoiceDetails {
  /** Sequential invoice number (max 20 characters, alphanumeric + hyphens/slashes) */
  invoiceNumber: string;
  /** Date the invoice was issued (ISO date string, e.g. "2024-01-15") */
  dateOfIssue: string;
  /** Date the taxable event occurred (ISO date string) */
  dateOfTaxEvent: string;
  /** How the client will pay */
  paymentMethod: "bank_transfer" | "cash";
}

// ─── Line Item ───────────────────────────────────────────────────────────────
/**
 * A single row on the invoice representing one product or service.
 */
export interface LineItem {
  /** Unique ID used as a React key for drag-and-drop reordering */
  id: string;
  /** What is being billed — service or product name (max 200 characters) */
  description: string;
  /** How many units (0.01 to 10,000, up to 2 decimal places) */
  quantity: number;
  /** Price per unit in BGN (0.01 to 999,999.99, up to 2 decimal places) */
  unitPrice: number;
  /** Measurement unit, e.g. "бр.", "час", "кг" (max 50 characters) */
  unitOfMeasure: string;
  /** Auto-calculated: quantity × unitPrice, rounded to 2 decimals */
  lineTotal: number;
}

// ─── Totals Result ───────────────────────────────────────────────────────────
/**
 * The calculated totals for an invoice.
 * All monetary values are in BGN, rounded to 2 decimal places.
 */
export interface TotalsResult {
  /** Sum of all line item totals */
  taxBase: number;
  /** 20% of taxBase if VAT-registered, otherwise 0 */
  vatAmount: number;
  /** taxBase + vatAmount */
  grandTotal: number;
  /** Grand total written in Bulgarian words (required by law) */
  amountInWords: string;
}

// ─── Draft Invoice ───────────────────────────────────────────────────────────
/**
 * A saved-in-progress invoice that the user can come back to later.
 * Stored in localStorage (max 10 drafts).
 */
export interface DraftInvoice {
  /** Unique draft identifier */
  id: string;
  /** When the draft was last modified (ISO timestamp, e.g. "2024-01-15T10:30:00Z") */
  lastModified: string;
  /** Company data snapshot at time of save */
  company: CompanyData;
  /** Client data snapshot at time of save */
  client: ClientData;
  /** Invoice metadata snapshot */
  invoiceDetails: InvoiceDetails;
  /** All line items in the draft */
  lineItems: LineItem[];
  /** Whether this is an original or a copy */
  label: "original" | "copy";
}

// ─── Credit Note ─────────────────────────────────────────────────────────────
/**
 * A document that reverses or adjusts a previously issued invoice.
 * Required when you need to correct an invoice after it's been sent.
 */
export interface CreditNote {
  /** Credit note number — separate sequence from invoices, with a prefix */
  creditNoteNumber: string;
  /** The invoice number being credited/reversed */
  originalInvoiceNumber: string;
  /** Date of the original invoice (ISO date string) */
  originalInvoiceDate: string;
  /** Line items copied from original — amounts can be adjusted down to 0 */
  lineItems: LineItem[];
  /** Reason for issuing the credit note */
  reason: string;
}

// ─── EIK Validation Result ───────────────────────────────────────────────────
/**
 * Result returned by the EIK validation function.
 */
export interface EIKValidationResult {
  /** Whether the EIK number is valid */
  valid: boolean;
  /** If invalid, the specific error type */
  error?: "non_digits" | "wrong_length" | "invalid_checksum";
}
