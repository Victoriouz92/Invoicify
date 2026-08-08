"use client";

/**
 * CsvExport — A collapsible section that lets users export invoices as CSV.
 *
 * WHAT IT IS: A UI component with a month/year selector and an "Export" button.
 * WHY IT EXISTS: Freelancers need to send monthly invoice summaries to their accountants.
 * REAL WORLD ANALOGY: Like the "Export to spreadsheet" button in your banking app.
 *
 * HOW IT WORKS:
 * 1. User picks a month and year
 * 2. Clicks "Експортирай" (Export)
 * 3. If invoices exist for that month → downloads a CSV file
 * 4. If none exist → shows a helpful message
 */

import { useState, useCallback } from "react";
import { Download, ChevronDown, ChevronUp } from "lucide-react";

import { useInvoiceStore } from "@/lib/store";
import { useTranslations } from "@/lib/i18n";
import { filterDraftsByMonth, generateCsv, downloadCsv } from "@/lib/csv-export";
import { Button } from "@/components/ui/button";

export function CsvExport() {
  const { t } = useTranslations();
  const drafts = useInvoiceStore((s) => s.drafts);

  // Collapsible state
  const [isOpen, setIsOpen] = useState(false);

  // Selected month/year — default to current month
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  // Message shown when no invoices exist for selected month
  const [noDataMessage, setNoDataMessage] = useState("");

  const handleExport = useCallback(() => {
    setNoDataMessage("");

    const filtered = filterDraftsByMonth(drafts, selectedYear, selectedMonth);

    if (filtered.length === 0) {
      setNoDataMessage(t.csvNoInvoices);
      return;
    }

    const { content, filename } = generateCsv(filtered, selectedYear, selectedMonth);
    downloadCsv(content, filename);
  }, [drafts, selectedYear, selectedMonth, t]);

  // Generate year options (current year and 2 years back)
  const currentYear = now.getFullYear();
  const yearOptions = [currentYear - 2, currentYear - 1, currentYear];

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-sm font-medium text-foreground hover:text-foreground/80 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          {t.csvExportTitle}
        </span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {/* Collapsible content */}
      {isOpen && (
        <div className="mt-3 space-y-3">
          {/* Month and year selectors */}
          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(Number(e.target.value));
                setNoDataMessage("");
              }}
              className="rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {String(m).padStart(2, "0")}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(Number(e.target.value));
                setNoDataMessage("");
              }}
              className="rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="ml-auto gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              {t.csvExportButton}
            </Button>
          </div>

          {/* No data message */}
          {noDataMessage && (
            <p className="text-xs text-muted-foreground">{noDataMessage}</p>
          )}
        </div>
      )}
    </div>
  );
}
