"use client";

/**
 * useKeyboardShortcuts — listens for keyboard shortcuts on the invoice form page.
 *
 * WHAT IT IS: A custom React hook that binds Ctrl+N, Ctrl+S, Ctrl+P to invoice actions.
 * WHY IT EXISTS: Power users want to work faster without reaching for the mouse.
 * REAL WORLD ANALOGY: Like the keyboard shortcuts in a word processor (Ctrl+S = Save).
 *
 * BEHAVIOR:
 * - Ctrl+N → reset form (new invoice)
 * - Ctrl+S → save draft
 * - Ctrl+P → trigger PDF generation
 * - Prevents browser defaults (e.g., Ctrl+S won't open the browser save dialog)
 * - Does NOT fire when a modal/dialog is open (checks for [role="dialog"] in the DOM)
 * - Shows a confirmation toast when a shortcut is triggered
 */

import { useEffect, useCallback } from "react";
import { toast } from "@/components/ui/toast";
import { useInvoiceStore } from "@/lib/store";

interface UseKeyboardShortcutsOptions {
  /** Callback to trigger PDF generation (since it depends on form context) */
  onGeneratePdf?: () => void;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const reset = useInvoiceStore((s) => s.reset);
  const saveDraft = useInvoiceStore((s) => s.saveDraft);

  const showConfirmation = useCallback((message: string) => {
    toast.add({
      title: message,
      type: "success",
      timeout: 3000,
    });
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Only respond to Ctrl (or Cmd on Mac) key combos
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      if (!isCtrlOrCmd) return;

      // Ignore if a modal/dialog is open
      const openDialog = document.querySelector("[role='dialog']");
      if (openDialog) return;

      const key = e.key.toLowerCase();

      if (key === "n") {
        e.preventDefault();
        reset();
        showConfirmation("Нова фактура (Ctrl+N)");
      } else if (key === "s") {
        e.preventDefault();
        saveDraft();
        showConfirmation("Чернова запазена (Ctrl+S)");
      } else if (key === "p") {
        e.preventDefault();
        if (options.onGeneratePdf) {
          options.onGeneratePdf();
          showConfirmation("Генериране на PDF (Ctrl+P)");
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [reset, saveDraft, options.onGeneratePdf, showConfirmation]);
}
