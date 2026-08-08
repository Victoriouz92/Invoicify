"use client";

/**
 * CreditNoteDialog — Modal for creating credit notes from existing invoices.
 *
 * WHAT IT IS: A two-step dialog that lets users select an original invoice
 *   and adjust line item amounts downward to generate a credit note PDF.
 * WHY IT EXISTS: Bulgarian law requires a formal "Кредитно известие" document
 *   when correcting or partially refunding a previously issued invoice.
 * REAL WORLD ANALOGY: Like filling out a return form at a store — you pick
 *   the original receipt and specify which items (and how much) you're returning.
 */

import { useState, useCallback } from "react";
import { FileText, Loader2 } from "lucide-react";

import { useInvoiceStore } from "@/lib/store";
import { useTranslations } from "@/lib/i18n";
import { calculateTotals } from "@/lib/totals-calculator";
import { PDF_TIMEOUT_MS } from "@/lib/constants";
import type { DraftInvoice, LineItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface CreditNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "select" | "adjust";

export function CreditNoteDialog({ open, onOpenChange }: CreditNoteDialogProps) {
  const { t } = useTranslations();
  const drafts = useInvoiceStore((s) => s.drafts);
  const company = useInvoiceStore((s) => s.company);
  const generateCreditNoteNumber = useInvoiceStore((s) => s.generateCreditNoteNumber);

  const [step, setStep] = useState<Step>("select");
  const [selectedDraft, setSelectedDraft] = useState<DraftInvoice | null>(null);
  const [creditLineItems, setCreditLineItems] = useState<LineItem[]>([]);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);

  // Reset state when dialog closes
  const handleOpenChange = useCallback((value: boolean) => {
    if (!value) {
      setStep("select");
      setSelectedDraft(null);
      setCreditLineItems([]);
      setReason("");
      setError("");
      setGenerating(false);
    }
    onOpenChange(value);
  }, [onOpenChange]);

  // Step 1: Select an invoice (using drafts as source for MVP)
  const handleSelectInvoice = useCallback((draft: DraftInvoice) => {
    setSelectedDraft(draft);
    // Pre-populate line items from the original, with new IDs
    const items = draft.lineItems.map((item) => ({
      ...item,
      id: crypto.randomUUID(),
    }));
    setCreditLineItems(items);
    setStep("adjust");
    setError("");
  }, []);

  // Update a line item's quantity or unitPrice (only allow adjusting downward)
  const handleUpdateItem = useCallback((index: number, field: "quantity" | "unitPrice", value: number) => {
    setCreditLineItems((prev) => {
      if (!selectedDraft) return prev;
      const originalItem = selectedDraft.lineItems[index];
      // Clamp: value cannot exceed original, cannot be less than 0
      const maxValue = field === "quantity" ? originalItem.quantity : originalItem.unitPrice;
      const clamped = Math.max(0, Math.min(value, maxValue));

      return prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: clamped };
        updated.lineTotal = Math.round(updated.quantity * updated.unitPrice * 100) / 100;
        return updated;
      });
    });
    setError("");
  }, [selectedDraft]);

  // Generate the credit note PDF
  const handleGenerate = useCallback(async () => {
    // Validate: reject if all line items = 0
    const allZero = creditLineItems.every((item) => item.lineTotal === 0);
    if (allZero) {
      setError(t.creditNoteAllZero);
      return;
    }

    if (!selectedDraft) return;

    setGenerating(true);
    setError("");

    try {
      const creditNoteNumber = generateCreditNoteNumber();
      const today = new Date().toISOString().slice(0, 10);
      const isVATRegistered = company.vatNumber !== "";
      const totals = calculateTotals(creditLineItems, isVATRegistered);

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error("PDF generation timed out"));
        }, PDF_TIMEOUT_MS);
      });

      const { pdf } = await import("@react-pdf/renderer");
      const { CreditNotePDF } = await import("@/lib/pdf/credit-note-document");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfDocument: any = (
        <CreditNotePDF
          company={company}
          client={selectedDraft.client}
          creditNoteNumber={creditNoteNumber}
          dateOfIssue={today}
          originalInvoiceNumber={selectedDraft.invoiceDetails.invoiceNumber}
          originalInvoiceDate={selectedDraft.invoiceDetails.dateOfIssue}
          lineItems={creditLineItems}
          totals={totals}
          reason={reason}
        />
      );

      const blob = await Promise.race([
        pdf(pdfDocument).toBlob(),
        timeoutPromise,
      ]);

      // Download the PDF
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = `CreditNote_${creditNoteNumber}.pdf`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);

      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error generating credit note");
    } finally {
      setGenerating(false);
    }
  }, [creditLineItems, selectedDraft, company, reason, t, generateCreditNoteNumber, handleOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.createCreditNote}</DialogTitle>
          <DialogDescription>
            {step === "select" ? t.selectOriginalInvoice : t.adjustAmounts}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Select invoice */}
        {step === "select" && (
          <div className="space-y-2">
            {drafts.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.noFinalizedInvoices}</p>
            ) : (
              drafts.map((draft) => (
                <button
                  key={draft.id}
                  type="button"
                  onClick={() => handleSelectInvoice(draft)}
                  className="w-full flex items-center justify-between rounded-lg border border-border p-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <span className="text-sm font-medium">
                      № {draft.invoiceDetails.invoiceNumber}
                    </span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {draft.client.name || "(без име)"}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(draft.lastModified).toLocaleDateString()}
                  </span>
                </button>
              ))
            )}
          </div>
        )}

        {/* Step 2: Adjust amounts */}
        {step === "adjust" && selectedDraft && (
          <div className="space-y-4">
            {/* Original invoice reference */}
            <div className="text-sm text-muted-foreground rounded-md bg-muted/50 p-2">
              {t.originalInvoiceRef}{selectedDraft.invoiceDetails.invoiceNumber}
              {" от "}{selectedDraft.invoiceDetails.dateOfIssue}
            </div>

            {/* Line items editing */}
            <div className="space-y-3">
              {creditLineItems.map((item, index) => {
                const original = selectedDraft.lineItems[index];
                return (
                  <div key={item.id} className="space-y-1 rounded-md border border-border p-2">
                    <p className="text-sm font-medium truncate">{item.description || `Ред ${index + 1}`}</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">{t.qty} (макс. {original.quantity})</Label>
                        <Input
                          type="number"
                          min={0}
                          max={original.quantity}
                          step={0.01}
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">{t.unitPrice} (макс. {original.unitPrice.toFixed(2)})</Label>
                        <Input
                          type="number"
                          min={0}
                          max={original.unitPrice}
                          step={0.01}
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">{t.total}</Label>
                        <div className="h-8 flex items-center text-sm text-muted-foreground">
                          {item.lineTotal.toFixed(2)} лв.
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reason field */}
            <div>
              <Label className="text-sm">{t.creditNoteReason}</Label>
              <Input
                type="text"
                placeholder={t.creditNoteReasonPlaceholder}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Error message */}
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        )}

        {/* Footer with actions */}
        {step === "adjust" && (
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep("select")}
              disabled={generating}
            >
              {t.back}
            </Button>
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" data-icon="inline-start" />
              ) : (
                <FileText className="h-4 w-4" data-icon="inline-start" />
              )}
              {t.generateCreditNote}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
