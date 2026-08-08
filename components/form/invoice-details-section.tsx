"use client";

/**
 * InvoiceDetailsSection — form fields for invoice number, dates, and payment method.
 *
 * WHAT IT IS: A form section that captures invoice metadata (number, dates, payment type).
 * WHY IT EXISTS: Every Bulgarian invoice requires a sequential number, issue date,
 * tax event date, and payment method.
 * REAL WORLD ANALOGY: Like the header of a paper invoice form where you stamp
 * the invoice number and write the date.
 */

import { useInvoiceStore } from "@/lib/store";
import { checkSequenceGap } from "@/lib/invoice-number";
import { useTranslations } from "@/lib/i18n";
import { VALIDATION_LIMITS } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function InvoiceDetailsSection() {
  const { t } = useTranslations();
  const invoiceDetails = useInvoiceStore((s) => s.invoiceDetails);
  const lastInvoiceNumber = useInvoiceStore((s) => s.lastInvoiceNumber);
  const setInvoiceDetails = useInvoiceStore((s) => s.setInvoiceDetails);

  const hasSequenceGap = checkSequenceGap(
    invoiceDetails.invoiceNumber,
    lastInvoiceNumber || null
  );

  return (
    <section className="rounded-lg border border-border p-4 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">{t.invoiceDetails}</h3>

      {/* Invoice Number */}
      <div className="space-y-1.5">
        <Label htmlFor="invoice-number">{t.invoiceNumber}</Label>
        <Input
          id="invoice-number"
          value={invoiceDetails.invoiceNumber}
          maxLength={VALIDATION_LIMITS.maxInvoiceNumberLength}
          placeholder="0000000001"
          onChange={(e) => {
            const value = e.target.value.replace(/[^a-zA-Z0-9\-/]/g, "");
            setInvoiceDetails({ invoiceNumber: value });
          }}
        />
        {hasSequenceGap && (
          <p className="text-xs text-yellow-600 dark:text-yellow-400">
            {t.sequenceGap}
          </p>
        )}
      </div>

      {/* Date of Issue */}
      <div className="space-y-1.5">
        <Label htmlFor="date-of-issue">{t.dateOfIssue}</Label>
        <Input
          id="date-of-issue"
          type="date"
          value={invoiceDetails.dateOfIssue}
          onChange={(e) => setInvoiceDetails({ dateOfIssue: e.target.value })}
        />
      </div>

      {/* Date of Tax Event */}
      <div className="space-y-1.5">
        <Label htmlFor="date-of-tax-event">{t.dateOfTaxEvent}</Label>
        <Input
          id="date-of-tax-event"
          type="date"
          value={invoiceDetails.dateOfTaxEvent}
          onChange={(e) => setInvoiceDetails({ dateOfTaxEvent: e.target.value })}
        />
      </div>

      {/* Payment Method */}
      <div className="space-y-1.5">
        <Label htmlFor="payment-method">{t.paymentMethod}</Label>
        <Select
          value={invoiceDetails.paymentMethod}
          onValueChange={(value) => {
            setInvoiceDetails({
              paymentMethod: value as "bank_transfer" | "cash",
            });
          }}
        >
          <SelectTrigger className="w-full" id="payment-method">
            <SelectValue placeholder={t.selectPaymentMethod} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bank_transfer">{t.bankTransfer}</SelectItem>
            <SelectItem value="cash">{t.cash}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </section>
  );
}
