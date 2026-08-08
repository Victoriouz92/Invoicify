"use client";

/**
 * Landing Page — the marketing page visitors see at the root URL.
 *
 * WHAT IT IS: A single-page layout with Hero, How It Works, Social Proof,
 * Pricing, FAQ, and Footer sections.
 * WHY IT EXISTS: Requirement 1 — give visitors a clear overview and CTA.
 * ANIMATIONS: Uses Framer Motion fade-in + slide-up. Respects reduced-motion
 * via the useReducedMotion hook (Requirement 16.7).
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Zap,
  Download,
  ChevronDown,
  Check,
  Lock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { STORAGE_KEYS } from "@/lib/constants";

// ─── Animation Helpers ─────────────────────────────────────────────────────────

/** Creates a fade-in + slide-up variant, disabled when user prefers reduced motion */
function useSectionAnimation() {
  const prefersReduced = useReducedMotion();
  return {
    hidden: { opacity: 0, y: prefersReduced ? 0 : 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReduced ? 0 : 0.4, ease: [0, 0, 0.2, 1] as const },
    },
  };
}

// ─── FAQ Data ──────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    question: "What makes a Bulgarian invoice legally compliant?",
    answer:
      "A valid Bulgarian invoice must include: sequential invoice number, date of issue, date of tax event, supplier and client details (name, EIK, address, MOL), line items with quantities and prices, tax base, VAT (if registered), and total amount in words.",
  },
  {
    question: "Do I need to be VAT-registered to use Invoicify?",
    answer:
      "No. Invoicify supports both VAT-registered and non-VAT-registered freelancers. If you're not registered, VAT is set to 0% and you can specify the legal reason (e.g., чл. 113, ал. 9 от ЗДДС).",
  },
  {
    question: "Where is my data stored?",
    answer:
      "All data stays in your browser's localStorage. Nothing is sent to a server. Your invoices, client list, and company info never leave your device.",
  },
  {
    question: "Can I use Invoicify offline?",
    answer:
      "Yes. Since everything runs client-side, you can create and download invoices without an internet connection after the initial page load.",
  },
  {
    question: "What is EIK and how is it validated?",
    answer:
      "EIK (Единен идентификационен код) is a 9-digit Bulgarian company ID number with a built-in checksum. Invoicify validates it automatically using the official two-pass weighted algorithm to prevent typos.",
  },
];

// ─── FAQ Accordion Item ────────────────────────────────────────────────────────

function FAQItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);
  const prefersReduced = useReducedMotion();

  return (
    <div className="border-b border-border">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-4 text-left text-base font-medium hover:text-primary transition-colors"
        aria-expanded={open}
      >
        {question}
        <ChevronDown
          className={`h-5 w-5 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.25 }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-muted-foreground">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Landing Page ─────────────────────────────────────────────────────────

export default function LandingPage() {
  const sectionAnim = useSectionAnimation();
  const prefersReduced = useReducedMotion();
  const [invoiceCount, setInvoiceCount] = useState(0);

  // Read invoice count from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.invoiceCount);
      if (stored) setInvoiceCount(parseInt(stored, 10) || 0);
    } catch {
      // localStorage unavailable — ignore
    }
  }, []);

  return (
    <main className="flex-1 flex flex-col">
      {/* ── Navbar (theme toggle) ── */}
      <nav className="fixed top-0 right-0 z-50 p-4">
        <ThemeToggle />
      </nav>

      {/* ── Section 1: Hero ── */}
      <motion.section
        variants={sectionAnim}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center"
      >
        {/* Animated floating realistic invoice */}
        <motion.div
          animate={
            prefersReduced
              ? {}
              : { y: [0, -10, 0], rotateX: [0, 1.5, 0], rotateY: [-1, 1, -1] }
          }
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="mb-12 relative"
          style={{ perspective: 1000 }}
        >
          {/* Glow effect behind the card */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/10 blur-3xl rounded-3xl scale-110" />
          
          {/* The invoice card */}
          <div className="relative w-64 sm:w-72 rounded-2xl bg-white dark:bg-zinc-900 border border-white/20 dark:border-zinc-700/50 shadow-2xl shadow-indigo-500/10 dark:shadow-indigo-500/5 backdrop-blur-sm p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Фактура</span>
              <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono">№ 0000000042</span>
            </div>

            {/* Supplier / Client */}
            <div className="grid grid-cols-2 gap-3 text-[8px] text-zinc-500 dark:text-zinc-400">
              <div>
                <p className="font-semibold text-zinc-700 dark:text-zinc-200 text-[9px]">Кодекс ООД</p>
                <p>ЕИК: 204517839</p>
                <p>гр. София</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-zinc-700 dark:text-zinc-200 text-[9px]">Клиент АД</p>
                <p>ЕИК: 831642181</p>
                <p>гр. Пловдив</p>
              </div>
            </div>

            {/* Mini line items table */}
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 space-y-1.5 text-[8px]">
              <div className="flex justify-between text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-[7px]">
                <span>Описание</span>
                <span>Сума</span>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-300">
                <span>Уеб дизайн услуги</span>
                <span className="font-mono">1,200.00</span>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-300">
                <span>SEO оптимизация</span>
                <span className="font-mono">480.00</span>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-300">
                <span>Поддръжка (3 мес.)</span>
                <span className="font-mono">360.00</span>
              </div>
            </div>

            {/* Total */}
            <div className="border-t border-zinc-200 dark:border-zinc-700 pt-3 flex justify-between items-center">
              <span className="text-[9px] font-semibold text-zinc-700 dark:text-zinc-200">Общо</span>
              <span className="text-sm font-bold font-mono bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                2,040.00 EUR
              </span>
            </div>

            {/* Stamp-like "Original" badge */}
            <div className="absolute top-4 right-4 rotate-[-8deg]">
              <span className="text-[7px] font-bold text-indigo-500/40 dark:text-indigo-400/30 uppercase border border-indigo-500/30 dark:border-indigo-400/20 rounded px-1.5 py-0.5 tracking-wider">
                Оригинал
              </span>
            </div>
          </div>
        </motion.div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] bg-clip-text text-transparent">
          Invoicify
        </h1>
        <p className="mt-4 text-base sm:text-lg md:text-xl text-muted-foreground max-w-md px-2">
          Създавайте легално валидни фактури за секунди. Безплатно, бързо и без регистрация.
        </p>
        <Link
          href="/create"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
        >
          Създай фактура за 10 секунди
        </Link>
      </motion.section>

      {/* ── Section 2: How It Works ── */}
      <motion.section
        variants={sectionAnim}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="py-20 px-6"
      >
        <h2 className="text-center text-2xl font-bold mb-12">How It Works</h2>
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 max-w-3xl mx-auto">
          {[
            { icon: FileText, label: "Fill", desc: "Enter your invoice details" },
            { icon: Zap, label: "Generate", desc: "Preview in real-time" },
            { icon: Download, label: "Download", desc: "Get your PDF instantly" },
          ].map((step, i) => (
            <div key={step.label} className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <span className="font-semibold">{step.label}</span>
              <span className="text-sm text-muted-foreground">{step.desc}</span>
              {i < 2 && (
                <span className="hidden md:block absolute translate-x-[120px] text-muted-foreground/50 text-xl">
                  →
                </span>
              )}
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── Section 3: Social Proof ── */}
      {invoiceCount > 0 && (
        <motion.section
          variants={sectionAnim}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="py-12 px-6 text-center"
        >
          <p className="text-3xl font-bold text-primary">
            {invoiceCount.toLocaleString()}
          </p>
          <p className="text-muted-foreground mt-1">invoices generated</p>
        </motion.section>
      )}

      {/* ── Section 4: Pricing ── */}
      <motion.section
        variants={sectionAnim}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="py-20 px-6"
      >
        <h2 className="text-center text-2xl font-bold mb-12">Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free Tier */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Free</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-3xl font-bold">0 лв<span className="text-sm font-normal text-muted-foreground">/month</span></p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {["Unlimited invoices", "PDF download", "EIK validation", "Amount in words", "Dark & light theme", "Offline support"].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-accent" /> {f}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Pro Tier */}
          <Card className="ring-primary/50 ring-2 relative">
            <div className="absolute top-3 right-3 text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              Coming Soon
            </div>
            <CardHeader>
              <CardTitle className="text-lg">Pro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-3xl font-bold">TBD<span className="text-sm font-normal text-muted-foreground">/month</span></p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {["Everything in Free", "Cloud sync & backups", "Multi-device access", "Invoice analytics", "Priority support", "Custom branding"].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground/50" /> {f}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </motion.section>

      {/* ── Section 5: FAQ ── */}
      <motion.section
        variants={sectionAnim}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="py-20 px-6 max-w-2xl mx-auto w-full"
      >
        <h2 className="text-center text-2xl font-bold mb-10">Frequently Asked Questions</h2>
        <div>
          {FAQ_ITEMS.map((item) => (
            <FAQItem key={item.question} question={item.question} answer={item.answer} />
          ))}
        </div>
      </motion.section>

      {/* ── Section 6: Footer ── */}
      <footer className="border-t border-border py-8 px-6 mt-auto">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Invoicify. All rights reserved.</span>
          <nav className="flex gap-6">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">
              Contact
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
