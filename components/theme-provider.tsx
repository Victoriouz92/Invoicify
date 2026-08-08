"use client";

/**
 * ThemeProvider — wraps the app with next-themes to handle dark/light mode.
 *
 * WHAT IT IS: A wrapper component that manages which theme (dark or light) is active.
 * WHY IT EXISTS: Next.js renders on the server first, which can cause a "flash" of the wrong theme.
 *   next-themes handles this by injecting a script that applies the theme before React hydrates.
 * HOW IT WORKS:
 *   - Reads the saved theme from localStorage (key: "invoicify_theme")
 *   - If nothing is saved or the value is invalid, defaults to "dark"
 *   - Adds/removes the "dark" class on <html> to switch themes
 *   - Persists the user's choice to localStorage automatically
 */

import { ThemeProvider as NextThemesProvider } from "next-themes";

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class" // Toggles the "dark" class on <html> (matches Tailwind's dark mode strategy)
      defaultTheme="dark" // Dark theme is the default when no preference exists (Req 15.1)
      storageKey="invoicify_theme" // localStorage key for persisting user's choice (Req 15.3, 15.4)
      disableTransitionOnChange={false} // Allow CSS transitions during theme switch (Req 15.2)
    >
      {children}
    </NextThemesProvider>
  );
}
