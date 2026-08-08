/**
 * Zustand Store for Invoicify.
 *
 * WHAT IT IS: The central state management for the entire invoice form.
 * WHY IT EXISTS: Zustand provides a simple, lightweight store that holds all
 * form data, saved clients, drafts, and theme — and syncs to localStorage.
 * REAL WORLD ANALOGY: Like the desk where you keep your current invoice,
 * your client Rolodex, and your filing drawer — all in one organized place.
 */

import { create } from "zustand";
import type {
  CompanyData,
  ClientData,
  InvoiceDetails,
  LineItem,
  TotalsResult,
  DraftInvoice,
} from "./types";
import {
  STORAGE_KEYS,
  DEFAULT_COMPANY_DATA,
  DEFAULT_LINE_ITEM,
  DEFAULT_INVOICE_NUMBER,
  DEFAULT_PAYMENT_METHOD,
  DEFAULT_THEME,
  AUTO_SAVE_DELAY_MS,
  VALIDATION_LIMITS,
} from "./constants";
import { calculateTotals, calculateLineTotal } from "./totals-calculator";
import { getNextInvoiceNumber } from "./invoice-number";
import { getNextCreditNoteNumber } from "./credit-note-number";
import { safeGetItem, safeSetItem } from "./storage";

// ─── Helper: Create a blank line item with a unique ID ──────────────────────

function createLineItem(): LineItem {
  return {
    id: crypto.randomUUID(),
    ...DEFAULT_LINE_ITEM,
  };
}

// ─── Helper: Create a blank client with a unique ID ─────────────────────────

function createEmptyClient(): ClientData {
  return { id: crypto.randomUUID(), name: "", eik: "", address: "", mol: "" };
}

// ─── Helper: Get today's date as ISO string (YYYY-MM-DD) ────────────────────

function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Store Interface ─────────────────────────────────────────────────────────

interface InvoiceStore {
  // Form data
  company: CompanyData;
  client: ClientData;
  invoiceDetails: InvoiceDetails;
  lineItems: LineItem[];
  totals: TotalsResult;
  label: "original" | "copy";

  // Saved data
  savedClients: ClientData[];
  lastInvoiceNumber: string;
  lastCreditNoteNumber: string;
  drafts: DraftInvoice[];
  invoiceCount: number;

  // Theme
  theme: "dark" | "light";

  // Auto-save indicator (ISO timestamp of last successful auto-save)
  lastAutoSaveAt: string | null;

  // Actions
  setCompany: (data: Partial<CompanyData>) => void;
  setClient: (data: Partial<ClientData>) => void;
  setInvoiceDetails: (data: Partial<InvoiceDetails>) => void;
  addLineItem: () => void;
  removeLineItem: (index: number) => void;
  updateLineItem: (index: number, data: Partial<LineItem>) => void;
  reorderLineItems: (fromIndex: number, toIndex: number) => void;
  saveDraft: () => boolean;
  loadDraft: (draftId: string) => boolean;
  saveClient: (client: ClientData) => void;
  toggleTheme: () => void;
  setLabel: (label: "original" | "copy") => void;
  duplicateFromDraft: (draftId: string) => boolean;
  generateInvoice: () => void;
  generateCreditNoteNumber: () => string;
  reset: () => void;
}

// ─── Auto-save Debounce Timer ────────────────────────────────────────────────

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

// Reference to the store's set function, captured at store creation time
let storeSet: ((partial: Partial<InvoiceStore>) => void) | null = null;

function scheduleAutoSave(state: InvoiceStore) {
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    const draft: DraftInvoice = {
      id: "autosave",
      lastModified: new Date().toISOString(),
      company: state.company,
      client: state.client,
      invoiceDetails: state.invoiceDetails,
      lineItems: state.lineItems,
      label: state.label,
    };
    // Save the autosave draft separately from user-created drafts
    const success = safeSetItem(STORAGE_KEYS.drafts + "_autosave", draft);
    if (success && storeSet) {
      storeSet({ lastAutoSaveAt: new Date().toISOString() });
    }
  }, AUTO_SAVE_DELAY_MS);
}

// ─── Recalculate totals helper ───────────────────────────────────────────────

function recalculateTotals(
  lineItems: LineItem[],
  company: CompanyData
): TotalsResult {
  const isVATRegistered = company.vatNumber !== "";
  return calculateTotals(lineItems, isVATRegistered);
}

// ─── Persist helpers (save specific slices to localStorage) ──────────────────

function persistCompany(company: CompanyData) {
  safeSetItem(STORAGE_KEYS.company, company);
}

function persistClients(clients: ClientData[]) {
  safeSetItem(STORAGE_KEYS.clients, clients);
}

function persistTheme(theme: "dark" | "light") {
  safeSetItem(STORAGE_KEYS.theme, theme);
}

function persistLastInvoiceNumber(num: string) {
  safeSetItem(STORAGE_KEYS.lastInvoiceNumber, num);
}

function persistLastCreditNoteNumber(num: string) {
  safeSetItem(STORAGE_KEYS.lastCreditNoteNumber, num);
}

function persistInvoiceCount(count: number) {
  safeSetItem(STORAGE_KEYS.invoiceCount, count);
}

// ─── Load initial state from localStorage ────────────────────────────────────

function loadInitialState() {
  const company = safeGetItem<CompanyData>(
    STORAGE_KEYS.company,
    DEFAULT_COMPANY_DATA
  );
  const savedClients = safeGetItem<ClientData[]>(STORAGE_KEYS.clients, []);
  const drafts = safeGetItem<DraftInvoice[]>(STORAGE_KEYS.drafts, []);
  const lastInvoiceNumber = safeGetItem<string>(
    STORAGE_KEYS.lastInvoiceNumber,
    ""
  );
  const lastCreditNoteNumber = safeGetItem<string>(
    STORAGE_KEYS.lastCreditNoteNumber,
    ""
  );
  const theme = safeGetItem<"dark" | "light">(STORAGE_KEYS.theme, DEFAULT_THEME);
  const invoiceCount = safeGetItem<number>(STORAGE_KEYS.invoiceCount, 0);

  const today = getTodayISO();
  const nextNumber = lastInvoiceNumber
    ? getNextInvoiceNumber(lastInvoiceNumber)
    : DEFAULT_INVOICE_NUMBER;

  const lineItems = [createLineItem()];
  const isVATRegistered = company.vatNumber !== "";

  return {
    company,
    client: createEmptyClient(),
    invoiceDetails: {
      invoiceNumber: nextNumber,
      dateOfIssue: today,
      dateOfTaxEvent: today,
      paymentMethod: DEFAULT_PAYMENT_METHOD,
    } as InvoiceDetails,
    lineItems,
    totals: calculateTotals(lineItems, isVATRegistered),
    label: "original" as const,
    savedClients,
    lastInvoiceNumber,
    lastCreditNoteNumber,
    drafts,
    invoiceCount,
    theme,
    lastAutoSaveAt: null,
  };
}

// ─── Store Creation ──────────────────────────────────────────────────────────

/**
 * The main Zustand store hook for Invoicify.
 * Use this in any React component to read or update invoice state.
 *
 * @example
 * const company = useInvoiceStore((s) => s.company);
 * const setCompany = useInvoiceStore((s) => s.setCompany);
 */
export const useInvoiceStore = create<InvoiceStore>((set, get) => {
  // Capture the set function for use in scheduleAutoSave
  storeSet = set as (partial: Partial<InvoiceStore>) => void;

  return {
  ...loadInitialState(),

  setCompany: (data) => {
    set((state) => {
      const company = { ...state.company, ...data };
      const totals = recalculateTotals(state.lineItems, company);
      persistCompany(company);
      scheduleAutoSave({ ...state, company, totals });
      return { company, totals };
    });
  },

  setClient: (data) => {
    set((state) => {
      const client = { ...state.client, ...data };
      scheduleAutoSave({ ...state, client });
      return { client };
    });
  },

  setInvoiceDetails: (data) => {
    set((state) => {
      const invoiceDetails = { ...state.invoiceDetails, ...data };
      scheduleAutoSave({ ...state, invoiceDetails });
      return { invoiceDetails };
    });
  },

  addLineItem: () => {
    set((state) => {
      if (state.lineItems.length >= VALIDATION_LIMITS.maxLineItems) return state;
      const lineItems = [...state.lineItems, createLineItem()];
      const totals = recalculateTotals(lineItems, state.company);
      scheduleAutoSave({ ...state, lineItems, totals });
      return { lineItems, totals };
    });
  },

  removeLineItem: (index) => {
    set((state) => {
      // Prevent removing the last line item
      if (state.lineItems.length <= 1) return state;
      const lineItems = state.lineItems.filter((_, i) => i !== index);
      const totals = recalculateTotals(lineItems, state.company);
      scheduleAutoSave({ ...state, lineItems, totals });
      return { lineItems, totals };
    });
  },

  updateLineItem: (index, data) => {
    set((state) => {
      const lineItems = state.lineItems.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, ...data };
        // Recalculate lineTotal if quantity or unitPrice changed
        if ("quantity" in data || "unitPrice" in data) {
          updated.lineTotal = calculateLineTotal(
            updated.quantity,
            updated.unitPrice
          );
        }
        return updated;
      });
      const totals = recalculateTotals(lineItems, state.company);
      scheduleAutoSave({ ...state, lineItems, totals });
      return { lineItems, totals };
    });
  },

  reorderLineItems: (fromIndex, toIndex) => {
    set((state) => {
      const lineItems = [...state.lineItems];
      const [moved] = lineItems.splice(fromIndex, 1);
      lineItems.splice(toIndex, 0, moved);
      scheduleAutoSave({ ...state, lineItems });
      return { lineItems };
    });
  },

  saveDraft: () => {
    const state = get();
    const draft: DraftInvoice = {
      id: crypto.randomUUID(),
      lastModified: new Date().toISOString(),
      company: state.company,
      client: state.client,
      invoiceDetails: state.invoiceDetails,
      lineItems: state.lineItems,
      label: state.label,
    };

    let drafts = [...state.drafts];

    // Enforce max 10 drafts — replace oldest if at limit
    if (drafts.length >= VALIDATION_LIMITS.maxDrafts) {
      drafts.sort(
        (a, b) =>
          new Date(a.lastModified).getTime() -
          new Date(b.lastModified).getTime()
      );
      drafts = drafts.slice(1); // Remove the oldest
    }

    drafts.push(draft);
    const success = safeSetItem(STORAGE_KEYS.drafts, drafts);
    if (!success) return false;
    set({ drafts });
    return true;
  },

  loadDraft: (draftId) => {
    const state = get();
    const draft = state.drafts.find((d) => d.id === draftId);
    if (!draft) return false;

    const totals = recalculateTotals(draft.lineItems, draft.company);

    set({
      company: draft.company,
      client: draft.client,
      invoiceDetails: draft.invoiceDetails,
      lineItems: draft.lineItems,
      label: draft.label,
      totals,
    });
    return true;
  },

  saveClient: (client) => {
    set((state) => {
      // Avoid duplicates by ID
      const existing = state.savedClients.findIndex((c) => c.id === client.id);
      let savedClients: ClientData[];

      if (existing >= 0) {
        savedClients = state.savedClients.map((c, i) =>
          i === existing ? client : c
        );
      } else {
        savedClients = [...state.savedClients, client];
      }

      persistClients(savedClients);
      return { savedClients };
    });
  },

  toggleTheme: () => {
    set((state) => {
      const theme = state.theme === "dark" ? "light" : "dark";
      persistTheme(theme);
      return { theme };
    });
  },

  setLabel: (label) => {
    set({ label });
  },

  duplicateFromDraft: (draftId) => {
    const state = get();
    const draft = state.drafts.find((d) => d.id === draftId);
    if (!draft) return false;

    const today = getTodayISO();
    const nextNumber = state.lastInvoiceNumber
      ? getNextInvoiceNumber(state.lastInvoiceNumber)
      : DEFAULT_INVOICE_NUMBER;

    // Copy line items with new IDs to avoid key conflicts
    const lineItems = draft.lineItems.map((item) => ({
      ...item,
      id: crypto.randomUUID(),
    }));

    const totals = recalculateTotals(lineItems, draft.company);

    set({
      company: draft.company,
      client: draft.client,
      invoiceDetails: {
        invoiceNumber: nextNumber,
        dateOfIssue: today,
        dateOfTaxEvent: today,
        paymentMethod: draft.invoiceDetails.paymentMethod,
      },
      lineItems,
      totals,
      label: "original",
    });

    return true;
  },

  generateInvoice: () => {
    set((state) => {
      const lastInvoiceNumber = state.invoiceDetails.invoiceNumber;
      const invoiceCount = state.invoiceCount + 1;

      persistLastInvoiceNumber(lastInvoiceNumber);
      persistInvoiceCount(invoiceCount);

      return { lastInvoiceNumber, invoiceCount };
    });
  },

  generateCreditNoteNumber: () => {
    const state = get();
    const nextNumber = getNextCreditNoteNumber(state.lastCreditNoteNumber);
    persistLastCreditNoteNumber(nextNumber);
    set({ lastCreditNoteNumber: nextNumber });
    return nextNumber;
  },

  reset: () => {
    const state = get();
    const today = getTodayISO();
    const nextNumber = state.lastInvoiceNumber
      ? getNextInvoiceNumber(state.lastInvoiceNumber)
      : DEFAULT_INVOICE_NUMBER;

    const lineItems = [createLineItem()];
    const totals = recalculateTotals(lineItems, state.company);

    set({
      client: createEmptyClient(),
      invoiceDetails: {
        invoiceNumber: nextNumber,
        dateOfIssue: today,
        dateOfTaxEvent: today,
        paymentMethod: DEFAULT_PAYMENT_METHOD,
      },
      lineItems,
      totals,
      label: "original",
    });
  },
};
});
