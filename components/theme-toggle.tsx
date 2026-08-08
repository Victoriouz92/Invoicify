"use client";

/**
 * ThemeToggle — a button that switches between dark and light themes.
 *
 * WHAT IT IS: A simple icon button (Sun/Moon) that toggles the app theme.
 * WHY IT EXISTS: Users need a way to switch themes (Requirement 15.2, 15.3).
 * HOW IT WORKS:
 *   - Uses the useTheme hook from next-themes to read/set the current theme
 *   - Shows a Moon icon in light mode (click to go dark)
 *   - Shows a Sun icon in dark mode (click to go light)
 *   - The actual theme change + localStorage persist is handled by next-themes
 */

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — only render the icon after mounting on the client
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder with same size to avoid layout shift
    return (
      <button
        className="inline-flex items-center justify-center rounded-md p-2 w-9 h-9"
        aria-label="Toggle theme"
        disabled
      />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex items-center justify-center rounded-md p-2 w-9 h-9
        hover:bg-muted transition-colors duration-200
        text-foreground"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
