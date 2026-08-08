"use client";

/**
 * TotalsDisplay — shows calculated invoice totals with animated transitions.
 *
 * WHAT IT IS: A live-updating summary showing tax base, VAT (if applicable),
 * grand total, and the grand total written in Bulgarian words.
 * WHY IT EXISTS: Bulgarian invoices require totals and amount-in-words by law.
 * REAL WORLD ANALOGY: Like a cash register display that smoothly rolls to the
 * new total every time you scan an item.
 */

import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";
import { useInvoiceStore } from "@/lib/store";
import { useTranslations } from "@/lib/i18n";

// ─── Reduced Motion Hook ─────────────────────────────────────────────────────

function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return prefersReduced;
}

// ─── Animated Number Hook ────────────────────────────────────────────────────

function useAnimatedNumber(targetValue: number, skipAnimation: boolean): string {
  const [displayValue, setDisplayValue] = useState(targetValue);
  const previousValue = useRef(targetValue);

  useEffect(() => {
    const from = previousValue.current;
    const to = targetValue;
    previousValue.current = to;

    if (skipAnimation || from === to) {
      setDisplayValue(to);
      return;
    }

    const controls = animate(from, to, {
      duration: 0.4,
      ease: "easeOut",
      onUpdate: (latest) => setDisplayValue(latest),
    });

    return () => controls.stop();
  }, [targetValue, skipAnimation]);

  return displayValue.toFixed(2);
}

// ─── TotalsDisplay Component ─────────────────────────────────────────────────

export function TotalsDisplay() {
  const { t } = useTranslations();
  const totals = useInvoiceStore((s) => s.totals);
  const company = useInvoiceStore((s) => s.company);
  const prefersReducedMotion = usePrefersReducedMotion();

  const isVATRegistered = company.vatNumber !== "";

  const animatedTaxBase = useAnimatedNumber(totals.taxBase, prefersReducedMotion);
  const animatedVAT = useAnimatedNumber(totals.vatAmount, prefersReducedMotion);
  const animatedGrandTotal = useAnimatedNumber(totals.grandTotal, prefersReducedMotion);

  const amountInWords = totals.grandTotal > 0 ? totals.amountInWords : "—";

  return (
    <section
      className="rounded-lg border border-border p-4 space-y-3"
      aria-label="Invoice totals"
    >
      <h3 className="text-sm font-semibold text-foreground">
        {t.totalsHeading}
      </h3>

      {/* Tax Base Row */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{t.taxBase}</span>
        <span className="font-mono text-sm text-foreground">
          {animatedTaxBase} лв.
        </span>
      </div>

      {/* VAT Row — only shown if company is VAT-registered */}
      {isVATRegistered && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t.vat20}</span>
          <span className="font-mono text-sm text-foreground">
            {animatedVAT} лв.
          </span>
        </div>
      )}

      {/* Grand Total Row */}
      <div className="flex items-center justify-between border-t border-border pt-2">
        <span className="text-sm font-semibold text-foreground">{t.grandTotal}</span>
        <span className="font-mono text-base font-bold text-foreground">
          {animatedGrandTotal} лв.
        </span>
      </div>

      {/* Amount in Words */}
      <p className="text-xs italic text-muted-foreground pt-1">
        {t.amountInWords} {amountInWords}
      </p>
    </section>
  );
}
