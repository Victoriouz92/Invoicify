"use client";

/**
 * Invoice Creator Page — the main two-column layout for creating invoices.
 *
 * WHAT IT IS: The primary page where users fill out invoice forms and see a live preview.
 * WHY IT EXISTS: Users need a form + live preview side by side.
 *
 * LAYOUT BEHAVIOR:
 * - ≥1024px (lg): side-by-side grid (form left, preview right)
 * - 768–1023px (md): both panels stacked vertically
 * - <768px: tabbed toggle ("Form" / "Preview") with Form active by default
 */

import { useEffect, useCallback } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { invoiceFormSchema, type InvoiceFormData } from "@/lib/validation";
import { useInvoiceStore } from "@/lib/store";
import { useTranslations } from "@/lib/i18n";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AnimatedSection } from "@/components/ui/animated-section";

import { CompanySection } from "@/components/form/company-section";
import { ClientSection } from "@/components/form/client-section";
import { InvoiceDetailsSection } from "@/components/form/invoice-details-section";
import { LineItemsSection } from "@/components/form/line-items-section";
import { TotalsDisplay } from "@/components/form/totals-display";
import { ActionButtons } from "@/components/form/action-buttons";
import { AutoSaveIndicator } from "@/components/form/auto-save-indicator";
import { DraftsList } from "@/components/form/drafts-list";
import { CsvExport } from "@/components/form/csv-export";
import { PreviewPanel } from "@/components/preview/preview-panel";
import { Toaster } from "@/components/ui/toast";

export default function CreateInvoicePage() {
  const { t } = useTranslations();

  const company = useInvoiceStore((s) => s.company);
  const client = useInvoiceStore((s) => s.client);
  const invoiceDetails = useInvoiceStore((s) => s.invoiceDetails);
  const lineItems = useInvoiceStore((s) => s.lineItems);
  const label = useInvoiceStore((s) => s.label);
  const setCompany = useInvoiceStore((s) => s.setCompany);
  const setClient = useInvoiceStore((s) => s.setClient);
  const setInvoiceDetails = useInvoiceStore((s) => s.setInvoiceDetails);
  const setLabel = useInvoiceStore((s) => s.setLabel);

  // Trigger PDF generation via the ActionButtons' button in the DOM
  const handleGeneratePdfShortcut = useCallback(() => {
    const btn = document.querySelector<HTMLButtonElement>("[data-shortcut-pdf]");
    if (btn) btn.click();
  }, []);

  // Keyboard shortcuts: Ctrl+N, Ctrl+S, Ctrl+P
  useKeyboardShortcuts({ onGeneratePdf: handleGeneratePdfShortcut });

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      company: {
        name: company.name,
        eik: company.eik,
        address: company.address,
        mol: company.mol,
        iban: company.iban,
        vatNumber: company.vatNumber,
        vatReason: company.vatReason,
        logo: company.logo,
      },
      client: {
        name: client.name,
        eik: client.eik,
        address: client.address,
        mol: client.mol,
      },
      invoiceDetails: {
        invoiceNumber: invoiceDetails.invoiceNumber,
        dateOfIssue: invoiceDetails.dateOfIssue,
        dateOfTaxEvent: invoiceDetails.dateOfTaxEvent,
        paymentMethod: invoiceDetails.paymentMethod,
      },
      lineItems: lineItems.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitOfMeasure: item.unitOfMeasure,
        lineTotal: item.lineTotal,
      })),
    },
    mode: "onChange",
  });

  useEffect(() => {
    const subscription = form.watch((values) => {
      if (values.company) {
        setCompany(values.company as Partial<typeof company>);
      }
      if (values.client) {
        setClient(values.client as Partial<typeof client>);
      }
      if (values.invoiceDetails) {
        setInvoiceDetails(values.invoiceDetails as Partial<typeof invoiceDetails>);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, setCompany, setClient, setInvoiceDetails]);

  const formContent = (
    <div className="space-y-4">
      <AnimatedSection delay={0}>
        <CompanySection />
      </AnimatedSection>
      <AnimatedSection delay={0.05}>
        <ClientSection />
      </AnimatedSection>
      <AnimatedSection delay={0.1}>
        <InvoiceDetailsSection />
      </AnimatedSection>
      <AnimatedSection delay={0.15}>
        <LineItemsSection />
      </AnimatedSection>
      <AnimatedSection delay={0.2}>
        <TotalsDisplay />
      </AnimatedSection>
      <AnimatedSection delay={0.25}>
        <ActionButtons />
      </AnimatedSection>
      <AnimatedSection delay={0.3}>
        <CsvExport />
      </AnimatedSection>
      <div className="flex items-center justify-between pt-1">
        <AutoSaveIndicator />
        <DraftsList />
      </div>
    </div>
  );

  const previewContent = (
    <PreviewPanel label={label} onLabelChange={setLabel} />
  );

  return (
    <Toaster>
    <FormProvider {...form}>
      <div className="flex flex-col min-h-screen">
        {/* Header / Nav Bar */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.back}
          </Link>
          <h1 className="text-sm font-semibold text-foreground">
            {t.invoiceCreator}
          </h1>
          <div className="flex items-center gap-1">
            <LocaleToggle />
            <ThemeToggle />
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {/* ≥1024px: Side-by-side grid */}
          <div className="hidden lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">
            <div>{formContent}</div>
            <div className="sticky top-20">{previewContent}</div>
          </div>

          {/* 768–1023px: Stacked vertically */}
          <div className="hidden md:flex md:flex-col md:gap-6 lg:hidden">
            <div>{formContent}</div>
            <div>{previewContent}</div>
          </div>

          {/* <768px: Tabbed interface */}
          <div className="md:hidden">
            <Tabs defaultValue="form">
              <TabsList className="w-full">
                <TabsTrigger value="form">{t.formTab}</TabsTrigger>
                <TabsTrigger value="preview">{t.previewTab}</TabsTrigger>
              </TabsList>
              <TabsContent value="form" className="mt-4">
                {formContent}
              </TabsContent>
              <TabsContent value="preview" className="mt-4">
                {previewContent}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </FormProvider>
    </Toaster>
  );
}
