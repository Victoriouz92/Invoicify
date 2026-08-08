"use client";

/**
 * DraftsList — a dropdown button that shows saved drafts and lets users load them.
 *
 * WHAT IT IS: A small dropdown displaying "Чернови (N)" that lists draft titles.
 * WHY IT EXISTS: Users need an easy way to switch between their saved drafts.
 * REAL WORLD ANALOGY: Like the "Recent Documents" menu in a word processor.
 */

import { useState, useCallback } from "react";
import { FileStack } from "lucide-react";

import { useInvoiceStore } from "@/lib/store";
import { useTranslations } from "@/lib/i18n";
import { useToastManager } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";

export function DraftsList() {
  const { t } = useTranslations();
  const drafts = useInvoiceStore((s) => s.drafts);
  const loadDraft = useInvoiceStore((s) => s.loadDraft);
  const toastManager = useToastManager();
  const [open, setOpen] = useState(false);

  const handleLoadDraft = useCallback(
    (draftId: string) => {
      const success = loadDraft(draftId);
      if (success) {
        toastManager.add({
          title: t.draftRestored,
          type: "success",
          timeout: 4000,
        });
      }
      setOpen(false);
    },
    [loadDraft, toastManager, t]
  );

  if (drafts.length === 0) return null;

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        className="text-xs gap-1.5"
      >
        <FileStack className="h-3.5 w-3.5" />
        {t.draftsLabel} ({drafts.length})
      </Button>

      {open && (
        <>
          {/* Backdrop to close dropdown on click outside */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute top-full left-0 z-50 mt-1 w-64 rounded-lg border border-border bg-popover p-2 shadow-lg">
            {drafts.length === 0 ? (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">
                {t.noDrafts}
              </p>
            ) : (
              <ul className="space-y-1">
                {[...drafts]
                  .sort(
                    (a, b) =>
                      new Date(b.lastModified).getTime() -
                      new Date(a.lastModified).getTime()
                  )
                  .map((draft) => {
                    const date = new Date(draft.lastModified);
                    const dateStr = date.toLocaleDateString([], {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    });
                    const timeStr = date.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const title =
                      draft.client.name || draft.invoiceDetails.invoiceNumber || "—";

                    return (
                      <li key={draft.id}>
                        <button
                          type="button"
                          onClick={() => handleLoadDraft(draft.id)}
                          className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent transition-colors"
                        >
                          <span className="truncate font-medium">{title}</span>
                          <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                            {dateStr} {timeStr}
                          </span>
                        </button>
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
