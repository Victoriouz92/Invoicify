/**
 * PreviewPanel — the live preview side of the Invoice Creator page.
 *
 * WHAT IT IS: An A4-proportioned panel showing a real-time preview of the invoice.
 * WHY IT EXISTS: Users see exactly how their invoice looks while typing.
 * REAL WORLD ANALOGY: Like the live preview in a word processor.
 */

"use client";

import { InvoicePreview } from "./invoice-preview";
import { useTranslations } from "@/lib/i18n";

interface PreviewPanelProps {
  label: "original" | "copy";
  onLabelChange: (label: "original" | "copy") => void;
}

export function PreviewPanel({ label, onLabelChange }: PreviewPanelProps) {
  const { t } = useTranslations();

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Original / Copy toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{t.documentLabel}</span>
        <button
          type="button"
          onClick={() => onLabelChange("original")}
          className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
            label === "original"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          {t.original}
        </button>
        <button
          type="button"
          onClick={() => onLabelChange("copy")}
          className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
            label === "copy"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          {t.copy}
        </button>
      </div>

      {/* A4-proportioned preview area — scales to fit mobile viewports (Req 17.1) */}
      <div
        className="w-full max-w-full border border-border rounded-lg shadow-sm overflow-hidden"
        style={{ aspectRatio: "1 / 1.414" }}
      >
        <InvoicePreview />
      </div>
    </div>
  );
}
