/**
 * Simple i18n (internationalization) system for Invoicify.
 *
 * WHAT IT IS: A lightweight translation system with Bulgarian and English strings.
 * WHY IT EXISTS: The app needs full Bulgarian localization with an English fallback.
 * REAL WORLD ANALOGY: Like a dictionary you flip between — one side Bulgarian, one English.
 *
 * HOW IT WORKS:
 * - All UI strings live in the `translations` object keyed by language
 * - useLocale() hook reads/writes the language preference to localStorage
 * - useTranslations() hook returns the current language's strings
 */

"use client";

import { useState, useEffect, useCallback } from "react";

export type Locale = "bg" | "en";

const STORAGE_KEY = "invoicify_locale";
const DEFAULT_LOCALE: Locale = "bg";

export const translations = {
  bg: {
    // Company section
    myCompany: "Моята фирма",
    companyName: "Наименование *",
    companyNamePlaceholder: "Въведете наименование на фирмата",
    eik: "ЕИК *",
    eikPlaceholder: "9-цифрен ЕИК",
    address: "Адрес *",
    addressPlaceholder: "Пълен адрес на фирмата",
    mol: "МОЛ *",
    molPlaceholder: "Материално отговорно лице",
    iban: "IBAN",
    ibanPlaceholder: "Банкова сметка IBAN (незадължително)",
    vatNumber: "ДДС номер",
    vatNumberPlaceholder: "Регистрация по ДДС (незадължително)",
    vatReason: "Основание за неначисляване на ДДС",
    vatReasonPlaceholder: "напр. чл. 113, ал. 9 от ЗДДС",
    companyLogo: "Лого на фирмата",
    logoDropText: "Провлачете лого тук или натиснете за избор",
    logoDropFormats: "PNG, JPG, SVG — макс. 2MB",
    removeLogo: "Премахни",
    logoInvalidType: "Невалиден формат. Поддържани: PNG, JPG, SVG",
    logoTooLarge: "Файлът е прекалено голям. Максимум 2MB",

    // Client section
    client: "Клиент",
    selectClient: "Избери клиент",
    selectClientPlaceholder: "Избери клиент...",
    noName: "(без име)",
    addNew: "+ Добави нов",
    clientName: "Име на фирмата *",
    clientNamePlaceholder: "Наименование на клиента",
    clientAddress: "Адрес *",
    clientAddressPlaceholder: "Пълен адрес",
    clientMol: "МОЛ *",
    clientMolPlaceholder: "Материално отговорно лице",
    saveClient: "Запази клиент",
    clientSaved: "Клиентът е запазен!",
    clientSaveError: "Грешка при запазване.",

    // EIK errors
    eikNonDigits: "ЕИК трябва да съдържа само цифри",
    eikWrongLength: "ЕИК трябва да бъде точно 9 цифри",
    eikInvalidChecksum: "Невалиден ЕИК — моля, проверете дали е въведен правилно",
    eikInvalid: "Невалиден ЕИК",
    eikSearching: "Търсене...",
    eikAutoFilled: "Данни заредени от Търговски регистър",

    // Invoice details
    invoiceDetails: "Данни за фактурата",
    invoiceNumber: "Номер на фактура",
    dateOfIssue: "Дата на издаване",
    dateOfTaxEvent: "Дата на данъчно събитие",
    paymentMethod: "Начин на плащане",
    bankTransfer: "Банков превод",
    cash: "В брой",
    selectPaymentMethod: "Изберете начин на плащане",
    sequenceGap: "⚠ Пропуснати номера в последователността",

    // Line items
    lineItems: "Редове",
    description: "Описание",
    qty: "Кол.",
    unitPrice: "Ед. цена",
    unit: "Мярка",
    total: "Стойност",
    addRow: "Добави ред",
    dragToReorder: "Плъзнете за пренареждане",
    deleteLineItem: "Изтрий ред",

    // Totals
    totalsHeading: "Обща информация",
    taxBase: "Данъчна основа",
    vat20: "ДДС 20%",
    grandTotal: "Обща сума",
    amountInWords: "Словом:",

    // Action buttons
    generatePdf: "Генерирай PDF",
    saveDraft: "Запази",
    duplicate: "Дублирай",
    generatingPdf: "Генериране на PDF...",
    pdfSuccess: "PDF генериран успешно!",
    downloadPdf: "Изтегли PDF",
    openInNewTab: "Отвори в нов таб",
    generateAnother: "Генерирай нова",
    retry: "Опитай отново",
    dismiss: "Затвори",
    duplicateTooltip: "Налично след генериране на първа фактура",

    // Duplicate dialog
    duplicateFrom: "Дублирай от:",
    noDraftsAvailable: "Няма налични чернови",
    draftNotFound: "Черновата не е намерена",

    // Preview
    documentLabel: "Етикет:",
    original: "Оригинал",
    copy: "Копие",

    // Drafts
    draftSaved: "Чернова запазена!",
    draftRestored: "Чернова възстановена",
    autoSaved: "Автоматично запазено",
    draftsLabel: "Чернови",
    noDrafts: "Няма запазени чернови",
    loadDraft: "Зареди",
    storageWarning: "Данните не могат да бъдат запазени. localStorage не е достъпен.",

    // Credit note
    creditNote: "Кредитно известие",
    creditNoteTitle: "КРЕДИТНО ИЗВЕСТИЕ",
    createCreditNote: "Кредитно известие",
    selectOriginalInvoice: "Изберете оригинална фактура",
    noFinalizedInvoices: "Няма издадени фактури",
    originalInvoiceRef: "Основание: Кредитно известие към фактура №",
    creditNoteReason: "Причина",
    creditNoteReasonPlaceholder: "Причина за издаване на кредитно известие",
    creditNoteGenerated: "Кредитно известие генерирано!",
    creditNoteAllZero: "Всички суми са 0 — моля, коригирайте поне една позиция",
    adjustAmounts: "Коригирайте сумите надолу",
    generateCreditNote: "Генерирай кредитно известие",
    creditNoteNumber: "Номер на кредитно известие",

    // CSV Export
    csvExportTitle: "Експорт на фактури (CSV)",
    csvExportButton: "Експортирай",
    csvNoInvoices: "Няма фактури за избрания месец.",

    // Create page
    invoiceCreator: "Създаване на фактура",
    back: "Назад",
    formTab: "Форма",
    previewTab: "Преглед",
  },
  en: {
    // Company section
    myCompany: "My Company",
    companyName: "Company Name *",
    companyNamePlaceholder: "Enter company name",
    eik: "EIK *",
    eikPlaceholder: "9-digit EIK number",
    address: "Address *",
    addressPlaceholder: "Full company address",
    mol: "MOL *",
    molPlaceholder: "Materially responsible person",
    iban: "IBAN",
    ibanPlaceholder: "Bank account IBAN (optional)",
    vatNumber: "VAT Number",
    vatNumberPlaceholder: "VAT registration number (optional)",
    vatReason: "Reason for not charging VAT",
    vatReasonPlaceholder: "e.g. чл. 113, ал. 9 от ЗДДС",
    companyLogo: "Company Logo",
    logoDropText: "Drag & drop a logo here, or click to browse",
    logoDropFormats: "PNG, JPG, SVG — max 2MB",
    removeLogo: "Remove",
    logoInvalidType: "Invalid file type. Accepted: PNG, JPG, SVG",
    logoTooLarge: "File too large. Maximum size is 2MB",

    // Client section
    client: "Client",
    selectClient: "Select client",
    selectClientPlaceholder: "Select client...",
    noName: "(no name)",
    addNew: "+ Add new",
    clientName: "Company Name *",
    clientNamePlaceholder: "Client company name",
    clientAddress: "Address *",
    clientAddressPlaceholder: "Full address",
    clientMol: "MOL *",
    clientMolPlaceholder: "Materially responsible person",
    saveClient: "Save client",
    clientSaved: "Client saved!",
    clientSaveError: "Error saving client.",

    // EIK errors
    eikNonDigits: "EIK must contain only digits",
    eikWrongLength: "EIK must be exactly 9 digits",
    eikInvalidChecksum: "Invalid EIK — please check if entered correctly",
    eikInvalid: "Invalid EIK",
    eikSearching: "Searching...",
    eikAutoFilled: "Data loaded from Trade Registry",

    // Invoice details
    invoiceDetails: "Invoice Details",
    invoiceNumber: "Invoice Number",
    dateOfIssue: "Date of Issue",
    dateOfTaxEvent: "Date of Tax Event",
    paymentMethod: "Payment Method",
    bankTransfer: "Bank Transfer",
    cash: "Cash",
    selectPaymentMethod: "Select payment method",
    sequenceGap: "⚠ Numbers skipped in sequence",

    // Line items
    lineItems: "Line Items",
    description: "Description",
    qty: "Qty",
    unitPrice: "Unit Price",
    unit: "Unit",
    total: "Total",
    addRow: "Add Row",
    dragToReorder: "Drag to reorder",
    deleteLineItem: "Delete line item",

    // Totals
    totalsHeading: "Totals",
    taxBase: "Tax Base",
    vat20: "VAT 20%",
    grandTotal: "Grand Total",
    amountInWords: "In words:",

    // Action buttons
    generatePdf: "Generate PDF",
    saveDraft: "Save as Draft",
    duplicate: "Duplicate",
    generatingPdf: "Generating PDF...",
    pdfSuccess: "PDF generated successfully!",
    downloadPdf: "Download PDF",
    openInNewTab: "Open in New Tab",
    generateAnother: "Generate Another",
    retry: "Retry",
    dismiss: "Dismiss",
    duplicateTooltip: "Available after first invoice is generated",

    // Duplicate dialog
    duplicateFrom: "Duplicate from:",
    noDraftsAvailable: "No drafts available",
    draftNotFound: "Draft not found",

    // Preview
    documentLabel: "Document label:",
    original: "Original",
    copy: "Copy",

    // Drafts
    draftSaved: "Draft saved!",
    draftRestored: "Draft restored",
    autoSaved: "Auto-saved",
    draftsLabel: "Drafts",
    noDrafts: "No saved drafts",
    loadDraft: "Load",
    storageWarning: "Data cannot be saved. localStorage is unavailable.",

    // Credit note
    creditNote: "Credit Note",
    creditNoteTitle: "CREDIT NOTE",
    createCreditNote: "Credit Note",
    selectOriginalInvoice: "Select original invoice",
    noFinalizedInvoices: "No issued invoices available",
    originalInvoiceRef: "Basis: Credit note for invoice №",
    creditNoteReason: "Reason",
    creditNoteReasonPlaceholder: "Reason for issuing credit note",
    creditNoteGenerated: "Credit note generated!",
    creditNoteAllZero: "All amounts are 0 — please adjust at least one item",
    adjustAmounts: "Adjust amounts downward",
    generateCreditNote: "Generate credit note",
    creditNoteNumber: "Credit note number",

    // CSV Export
    csvExportTitle: "Export Invoices (CSV)",
    csvExportButton: "Export",
    csvNoInvoices: "No invoices found for the selected month.",

    // Create page
    invoiceCreator: "Invoice Creator",
    back: "Back",
    formTab: "Form",
    previewTab: "Preview",
  },
} as const;

export type TranslationKey = keyof typeof translations.bg;

/**
 * Hook that manages the locale preference (reads/writes to localStorage).
 * Returns the current locale and a setter function.
 */
export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (stored === "bg" || stored === "en") {
        setLocaleState(stored);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch {
      // localStorage unavailable
    }
  }, []);

  return { locale, setLocale };
}

/**
 * Hook that returns all translation strings for the current locale.
 */
export function useTranslations() {
  const { locale, setLocale } = useLocale();
  const t = translations[locale];
  return { t, locale, setLocale };
}
