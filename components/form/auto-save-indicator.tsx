"use client";

/**
 * AutoSaveIndicator — shows a small "Автоматично запазено" text with timestamp.
 *
 * WHAT IT IS: A subtle indicator that tells the user their work was auto-saved.
 * WHY IT EXISTS: Users need reassurance that their data is safe without big intrusive alerts.
 * REAL WORLD ANALOGY: Like the "All changes saved" text in Google Docs.
 */

import { useInvoiceStore } from "@/lib/store";
import { useTranslations } from "@/lib/i18n";

export function AutoSaveIndicator() {
  const { t } = useTranslations();
  const lastAutoSaveAt = useInvoiceStore((s) => s.lastAutoSaveAt);

  if (!lastAutoSaveAt) return null;

  const time = new Date(lastAutoSaveAt);
  const timeStr = time.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <p className="text-xs text-muted-foreground" aria-live="polite">
      {t.autoSaved} — {timeStr}
    </p>
  );
}
