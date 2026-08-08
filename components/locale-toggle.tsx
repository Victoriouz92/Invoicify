/**
 * LocaleToggle — a button that switches between Bulgarian and English UI.
 *
 * WHAT IT IS: A small toggle button showing "BG" or "EN" for language switching.
 * WHY IT EXISTS: Users need a way to switch the interface language.
 * HOW IT WORKS: Reads/writes the locale via the useLocale hook (persisted in localStorage).
 */

"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n";

export function LocaleToggle() {
  const { locale, setLocale } = useLocale();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="inline-flex items-center justify-center rounded-md px-2 py-1 w-9 h-9 text-xs font-semibold"
        aria-label="Toggle language"
        disabled
      />
    );
  }

  const nextLocale = locale === "bg" ? "en" : "bg";
  const label = locale === "bg" ? "EN" : "BG";

  return (
    <button
      onClick={() => setLocale(nextLocale)}
      className="inline-flex items-center justify-center rounded-md px-2 py-1 h-9
        hover:bg-muted transition-colors duration-200
        text-xs font-semibold text-foreground border border-border"
      aria-label={`Switch to ${nextLocale === "bg" ? "Bulgarian" : "English"}`}
      title={`Switch to ${nextLocale === "bg" ? "Български" : "English"}`}
    >
      {label}
    </button>
  );
}
