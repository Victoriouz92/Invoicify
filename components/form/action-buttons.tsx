"use client";

/**
 * ActionButtons — Generate PDF, Save Draft, and Duplicate buttons.
 *
 * WHAT IT IS: The action buttons section at the bottom of the invoice form.
 * WHY IT EXISTS: Users need clear actions to generate PDFs, save drafts, and duplicate invoices.
 * REAL WORLD ANALOGY: Like the "Print", "Save", and "Copy" buttons on a word processor toolbar.
 */

import { useState, useCallback, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Save, Copy, Download, ExternalLink, Loader2, AlertCircle, RotateCcw, FileDown } from "lucide-react";

import { useInvoiceStore } from "@/lib/store";
import { useTranslations } from "@/lib/i18n";
import { invoiceFormSchema, type InvoiceFormData } from "@/lib/validation";
import { PDF_TIMEOUT_MS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { useToastManager } from "@/components/ui/toast";
import { CreditNoteDialog } from "@/components/form/credit-note-dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type GenerationState = "idle" | "generating" | "success" | "error";

export function ActionButtons() {
  const { t } = useTranslations();
  const toastManager = useToastManager();
  const [state, setState] = useState<GenerationState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { trigger, getValues, formState } = useFormContext<InvoiceFormData>();

  const generateInvoice = useInvoiceStore((s) => s.generateInvoice);
  const saveDraft = useInvoiceStore((s) => s.saveDraft);
  const duplicateFromDraft = useInvoiceStore((s) => s.duplicateFromDraft);
  const drafts = useInvoiceStore((s) => s.drafts);
  const company = useInvoiceStore((s) => s.company);
  const client = useInvoiceStore((s) => s.client);
  const invoiceDetails = useInvoiceStore((s) => s.invoiceDetails);
  const lineItems = useInvoiceStore((s) => s.lineItems);
  const totals = useInvoiceStore((s) => s.totals);
  const label = useInvoiceStore((s) => s.label);
  const [duplicateError, setDuplicateError] = useState("");
  const [creditNoteOpen, setCreditNoteOpen] = useState(false);

  const cleanupBlobUrl = useCallback(() => {
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
  }, [pdfBlobUrl]);

  const clearTimeoutRef = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleGeneratePDF = useCallback(async () => {
    cleanupBlobUrl();
    setErrorMessage("");
    setState("generating");

    const isValid = await trigger();
    if (!isValid) {
      setState("idle");
      const firstErrorKey = Object.keys(formState.errors)[0];
      if (firstErrorKey) {
        const errorElement = document.querySelector(`[name^="${firstErrorKey}"]`);
        errorElement?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    const formData = getValues();
    const zodResult = invoiceFormSchema.safeParse(formData);
    if (!zodResult.success) {
      setState("idle");
      return;
    }

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutRef.current = setTimeout(() => {
          reject(new Error("PDF generation timed out after 30 seconds"));
        }, PDF_TIMEOUT_MS);
      });

      const { pdf } = await import("@react-pdf/renderer");
      const { renderToBlob } = await import("@/lib/pdf/render-pdf");

      const blob = await Promise.race([
        renderToBlob(pdf, { company, client, invoiceDetails, lineItems, totals, label }),
        timeoutPromise,
      ]);

      clearTimeoutRef();

      const url = URL.createObjectURL(blob);
      const fileName = `Invoice_${invoiceDetails.invoiceNumber}.pdf`;

      setPdfBlobUrl(url);
      setPdfFileName(fileName);
      setState("success");
      generateInvoice();
    } catch (error) {
      clearTimeoutRef();
      const message = error instanceof Error
        ? error.message
        : "An unexpected error occurred during PDF generation";
      setErrorMessage(message);
      setState("error");
    }
  }, [
    trigger, getValues, formState.errors, company, client,
    invoiceDetails, lineItems, totals, label, generateInvoice,
    cleanupBlobUrl, clearTimeoutRef,
  ]);

  const handleDownload = useCallback(() => {
    if (!pdfBlobUrl) return;
    const link = document.createElement("a");
    link.href = pdfBlobUrl;
    link.download = pdfFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [pdfBlobUrl, pdfFileName]);

  const handleOpenInTab = useCallback(() => {
    if (!pdfBlobUrl) return;
    window.open(pdfBlobUrl, "_blank");
  }, [pdfBlobUrl]);

  const handleReset = useCallback(() => {
    cleanupBlobUrl();
    setErrorMessage("");
    setState("idle");
  }, [cleanupBlobUrl]);

  const handleSaveDraft = useCallback(() => {
    const success = saveDraft();
    if (success) {
      toastManager.add({
        title: t.draftSaved,
        type: "success",
        timeout: 4000,
      });
    } else {
      toastManager.add({
        title: t.storageWarning,
        type: "warning",
        timeout: 6000,
      });
    }
  }, [saveDraft, toastManager, t]);

  const handleDuplicate = useCallback((draftId: string) => {
    setDuplicateError("");
    const success = duplicateFromDraft(draftId);
    if (!success) {
      setDuplicateError(t.draftNotFound);
      setTimeout(() => setDuplicateError(""), 4000);
    }
  }, [duplicateFromDraft, t.draftNotFound]);

  // Determine if duplication is available (need at least one draft)
  const canDuplicate = drafts.length > 0;
  // Credit note is available when at least one draft exists (as finalized invoice source)
  const canCreateCreditNote = drafts.length > 0;

  return (
    <section className="space-y-3 pt-2" aria-label="Invoice actions">
      <AnimatePresence mode="wait">
        {state === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-wrap gap-3"
          >
            <Button type="button" variant="outline" size="lg" onClick={handleSaveDraft}>
              <Save className="h-4 w-4" data-icon="inline-start" />
              {t.saveDraft}
            </Button>
            <Button type="button" onClick={handleGeneratePDF} size="lg" data-shortcut-pdf>
              <FileText className="h-4 w-4" data-icon="inline-start" />
              {t.generatePdf}
            </Button>
            {canDuplicate && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button type="button" variant="outline" size="lg">
                      <Copy className="h-4 w-4" data-icon="inline-start" />
                      {t.duplicate}
                    </Button>
                  }
                />
                <DropdownMenuContent align="start" sideOffset={4}>
                  <DropdownMenuLabel>{t.duplicateFrom}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {drafts.map((draft) => (
                    <DropdownMenuItem
                      key={draft.id}
                      onClick={() => handleDuplicate(draft.id)}
                    >
                      <span className="truncate max-w-[200px]">
                        {draft.client.name || draft.invoiceDetails.invoiceNumber}
                      </span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {new Date(draft.lastModified).toLocaleDateString()}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {canCreateCreditNote && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setCreditNoteOpen(true)}
              >
                <FileDown className="h-4 w-4" data-icon="inline-start" />
                {t.createCreditNote}
              </Button>
            )}
          </motion.div>
        )}

        {/* Duplicate error message */}
        {duplicateError && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2"
          >
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">{duplicateError}</span>
          </motion.div>
        )}

        {state === "generating" && (
          <motion.div
            key="generating"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-4 py-3"
          >
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">{t.generatingPdf}</span>
          </motion.div>
        )}

        {state === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3">
              <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                {t.pdfSuccess}
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={handleDownload} size="lg">
                <Download className="h-4 w-4" data-icon="inline-start" />
                {t.downloadPdf}
              </Button>
              <Button type="button" variant="outline" size="lg" onClick={handleOpenInTab}>
                <ExternalLink className="h-4 w-4" data-icon="inline-start" />
                {t.openInNewTab}
              </Button>
              <Button type="button" variant="ghost" size="lg" onClick={handleReset}>
                {t.generateAnother}
              </Button>
            </div>
          </motion.div>
        )}

        {state === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">
                {errorMessage || "PDF generation failed"}
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={handleGeneratePDF} size="lg">
                <RotateCcw className="h-4 w-4" data-icon="inline-start" />
                {t.retry}
              </Button>
              <Button type="button" variant="ghost" size="lg" onClick={handleReset}>
                {t.dismiss}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <CreditNoteDialog open={creditNoteOpen} onOpenChange={setCreditNoteOpen} />
    </section>
  );
}
