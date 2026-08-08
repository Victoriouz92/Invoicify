import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

/**
 * Inter — the main UI font. Clean, readable, modern.
 * Used for all text: headings, labels, paragraphs.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

/**
 * JetBrains Mono — a monospaced font optimized for numbers.
 * Used for invoice numbers, amounts, totals, and EIK fields.
 */
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "Invoicify — Invoice Generator for Bulgarian Freelancers",
  description:
    "Create legally-compliant Bulgarian invoices in seconds. Free, fast, and works offline.",
};

/**
 * Root Layout — wraps the entire app.
 *
 * - suppressHydrationWarning: required by next-themes because it injects a <script>
 *   into <html> before React hydrates to prevent theme flash. This causes a harmless
 *   mismatch warning that we suppress here.
 * - ThemeProvider: manages dark/light mode via the "class" strategy (adds/removes .dark on <html>)
 * - The "dark" class is NO LONGER hardcoded — next-themes handles it dynamically based on
 *   the user's saved preference in localStorage (key: "invoicify_theme"), defaulting to dark.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="bg"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
