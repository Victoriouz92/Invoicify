/**
 * InvoicePreview — Live HTML-based invoice preview mimicking A4 layout.
 *
 * WHAT IT IS: A read-only visual preview of the invoice that updates in real-time
 * as the user fills in the form fields.
 * WHY IT EXISTS: Requirement 2.2 demands the preview updates within 300ms of form changes.
 * Users need to see exactly how their invoice will look before generating the PDF.
 * REAL WORLD ANALOGY: Like the "print preview" in a word processor — shows you the
 * finished document while you're still typing.
 *
 * This is NOT the PDF renderer — it's a pure HTML/CSS approximation of the final layout.
 * It reads all data directly from the Zustand store (no props needed).
 */

"use client";

import { useInvoiceStore } from "@/lib/store";
import { format, parseISO } from "date-fns";

// ─── Helper: Format a date string from ISO (YYYY-MM-DD) to Bulgarian DD.MM.YYYY ──
function formatDate(isoDate: string): string {
  if (!isoDate) return "";
  try {
    return format(parseISO(isoDate), "dd.MM.yyyy");
  } catch {
    return isoDate;
  }
}

// ─── Helper: Show placeholder text when a field is empty ──────────────────────
function Field({ value, placeholder }: { value: string; placeholder: string }) {
  if (value.trim()) {
    return <span>{value}</span>;
  }
  return <span className="text-gray-400 italic">{placeholder}</span>;
}

// ─── Helper: Format a number as currency (2 decimal places) ───────────────────
function currency(n: number): string {
  return n.toFixed(2);
}

export function InvoicePreview() {
  const company = useInvoiceStore((s) => s.company);
  const client = useInvoiceStore((s) => s.client);
  const invoiceDetails = useInvoiceStore((s) => s.invoiceDetails);
  const lineItems = useInvoiceStore((s) => s.lineItems);
  const totals = useInvoiceStore((s) => s.totals);
  const label = useInvoiceStore((s) => s.label);

  const isVATRegistered = company.vatNumber !== "";

  return (
    <div className="w-full h-full p-4 text-[9px] leading-tight text-black bg-white font-sans overflow-hidden">
      {/* ─── Header: Title + Label ─────────────────────────────── */}
      <div className="text-center mb-3">
        <h1 className="text-sm font-bold tracking-wide">ФАКТУРА</h1>
        <p className="text-[8px] text-gray-500 uppercase tracking-widest mt-0.5">
          {label === "original" ? "Оригинал" : "Копие"}
        </p>
      </div>

      {/* ─── Invoice Number & Dates ────────────────────────────── */}
      <div className="text-center mb-3 space-y-0.5">
        <p>
          <span className="font-semibold">№ </span>
          <span className="font-mono">
            <Field value={invoiceDetails.invoiceNumber} placeholder="0000000001" />
          </span>
        </p>
        <p>
          Дата на издаване:{" "}
          <span className="font-mono">
            {formatDate(invoiceDetails.dateOfIssue) || (
              <span className="text-gray-400 italic">дд.мм.гггг</span>
            )}
          </span>
        </p>
        <p>
          Дата на данъчно събитие:{" "}
          <span className="font-mono">
            {formatDate(invoiceDetails.dateOfTaxEvent) || (
              <span className="text-gray-400 italic">дд.мм.гггг</span>
            )}
          </span>
        </p>
      </div>

      {/* ─── Supplier / Client Two-Column ──────────────────────── */}
      <div className="grid grid-cols-2 gap-2 mb-3 border border-gray-300 rounded p-2">
        {/* Supplier (left) */}
        <div className="space-y-0.5">
          <p className="font-bold text-[8px] uppercase text-gray-500 mb-1">
            Доставчик
          </p>
          <p className="font-semibold">
            <Field value={company.name} placeholder="Име на фирмата" />
          </p>
          <p>
            ЕИК: <span className="font-mono"><Field value={company.eik} placeholder="000000000" /></span>
          </p>
          {isVATRegistered && (
            <p>
              ДДС №: <span className="font-mono">{company.vatNumber}</span>
            </p>
          )}
          <p>
            <Field value={company.address} placeholder="Адрес" />
          </p>
          <p>
            МОЛ: <Field value={company.mol} placeholder="Име на МОЛ" />
          </p>
        </div>

        {/* Client (right) */}
        <div className="space-y-0.5">
          <p className="font-bold text-[8px] uppercase text-gray-500 mb-1">
            Получател
          </p>
          <p className="font-semibold">
            <Field value={client.name} placeholder="Име на клиента" />
          </p>
          <p>
            ЕИК: <span className="font-mono"><Field value={client.eik} placeholder="000000000" /></span>
          </p>
          <p>
            <Field value={client.address} placeholder="Адрес на клиента" />
          </p>
          <p>
            МОЛ: <Field value={client.mol} placeholder="Име на МОЛ" />
          </p>
        </div>
      </div>

      {/* ─── Line Items Table ──────────────────────────────────── */}
      <table className="w-full border-collapse mb-3 text-[8px]">
        <thead>
          <tr className="border-b border-gray-300 text-left">
            <th className="py-0.5 pr-1 w-5">№</th>
            <th className="py-0.5 pr-1">Описание</th>
            <th className="py-0.5 pr-1 text-right w-8">Кол.</th>
            <th className="py-0.5 pr-1 w-8">Мярка</th>
            <th className="py-0.5 pr-1 text-right w-12">Ед. цена</th>
            <th className="py-0.5 text-right w-14">Стойност</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((item, index) => (
            <tr key={item.id} className="border-b border-gray-100">
              <td className="py-0.5 pr-1 font-mono">{index + 1}</td>
              <td className="py-0.5 pr-1 truncate max-w-[80px]">
                <Field value={item.description} placeholder="Описание" />
              </td>
              <td className="py-0.5 pr-1 text-right font-mono">
                {item.quantity > 0 ? currency(item.quantity) : "—"}
              </td>
              <td className="py-0.5 pr-1">
                <Field value={item.unitOfMeasure} placeholder="бр." />
              </td>
              <td className="py-0.5 pr-1 text-right font-mono">
                {item.unitPrice > 0 ? currency(item.unitPrice) : "—"}
              </td>
              <td className="py-0.5 text-right font-mono">
                {item.lineTotal > 0 ? currency(item.lineTotal) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ─── Totals ────────────────────────────────────────────── */}
      <div className="flex justify-end mb-2">
        <div className="w-1/2 space-y-0.5 text-[8px]">
          <div className="flex justify-between">
            <span>Данъчна основа:</span>
            <span className="font-mono">{currency(totals.taxBase)} лв.</span>
          </div>
          <div className="flex justify-between">
            <span>ДДС 20%:</span>
            <span className="font-mono">{currency(totals.vatAmount)} лв.</span>
          </div>
          <div className="flex justify-between font-bold border-t border-gray-300 pt-0.5">
            <span>Общо:</span>
            <span className="font-mono">{currency(totals.grandTotal)} лв.</span>
          </div>
        </div>
      </div>

      {/* ─── Amount in Words ───────────────────────────────────── */}
      <div className="mb-2 text-[8px]">
        <span className="font-semibold">Сума с думи: </span>
        {totals.amountInWords ? (
          <span>{totals.amountInWords}</span>
        ) : (
          <span className="text-gray-400 italic">нула лева</span>
        )}
      </div>

      {/* ─── Payment Method ────────────────────────────────────── */}
      <div className="mb-2 text-[8px]">
        <span className="font-semibold">Начин на плащане: </span>
        <span>
          {invoiceDetails.paymentMethod === "bank_transfer"
            ? "Банков превод"
            : "В брой"}
        </span>
      </div>

      {/* ─── VAT Reason (shown only when NOT VAT-registered) ───── */}
      {!isVATRegistered && (
        <div className="mb-2 text-[8px] text-gray-600">
          <span className="font-semibold">Основание за неначисляване на ДДС: </span>
          <Field value={company.vatReason} placeholder="чл. 113, ал. 9 от ЗДДС" />
        </div>
      )}

      {/* ─── Signature Line ────────────────────────────────────── */}
      <div className="mt-4 pt-2 border-t border-gray-200 text-[8px]">
        <div className="flex justify-between">
          <div className="text-center">
            <div className="w-24 border-b border-gray-400 mb-0.5" />
            <p className="text-gray-500">Съставил (МОЛ)</p>
            <p className="text-[7px]">
              <Field value={company.mol} placeholder="Име" />
            </p>
          </div>
          <div className="text-center">
            <div className="w-24 border-b border-gray-400 mb-0.5" />
            <p className="text-gray-500">Получател (МОЛ)</p>
            <p className="text-[7px]">
              <Field value={client.mol} placeholder="Име" />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
