/**
 * HeroInvoice — animated invoice card stack for the landing page hero section.
 *
 * WHAT IT IS: A decorative floating invoice card with background blobs and particles.
 * WHY IT EXISTS: Makes the hero section visually striking and shows users
 * what Invoicify produces (a real-looking Bulgarian invoice).
 * HOW IT WORKS:
 *   - 3 stacked cards (back2, back1, front) with CSS transforms
 *   - The wrapper gently floats up and down (CSS animation)
 *   - Background gradient blobs move slowly (CSS animation)
 *   - Small particles float around (CSS animation)
 *   - A "seal" badge with a pulsing ring
 *   - A flash animation on the total row
 *   - All animations use CSS keyframes for performance
 */

export function HeroInvoice() {
  return (
    <div className="relative w-[320px] sm:w-[360px] h-[380px] sm:h-[420px] mx-auto mb-10">
      {/* Background blobs */}
      <div
        className="absolute -inset-12 rounded-full bg-indigo-500/15 dark:bg-indigo-400/10 blur-3xl"
        style={{ animation: "ih-blob1 12s ease-in-out infinite" }}
      />
      <div
        className="absolute -inset-8 rounded-full bg-purple-500/10 dark:bg-purple-400/8 blur-3xl"
        style={{ animation: "ih-blob2 14s ease-in-out infinite" }}
      />

      {/* Floating particles */}
      {PARTICLES.map((p) => (
        <div
          key={p.id}
          className="absolute w-1.5 h-1.5 rounded-full bg-primary/40"
          style={{
            top: p.top,
            left: p.left,
            animation: `ih-particle ${p.duration}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* Card area — gentle idle float, no mouse interaction */}
      <div
        className="relative w-full h-full flex items-center justify-center"
        style={{ animation: "ih-idle-float 4s ease-in-out infinite" }}
      >
        <div className="relative">
          {/* Back card 2 (smallest, most offset) */}
          <div className="absolute inset-0 -translate-y-4 scale-[0.88] rotate-[-3deg] rounded-2xl bg-card border border-border opacity-40 shadow-lg" />

          {/* Back card 1 (medium) */}
          <div className="absolute inset-0 -translate-y-2 scale-[0.94] rotate-[-1.5deg] rounded-2xl bg-card border border-border opacity-60 shadow-lg" />

          {/* Front card — the visible invoice */}
          <div className="relative w-[270px] sm:w-[300px] rounded-2xl bg-card border border-border shadow-2xl p-5 sm:p-6 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                Фактура
              </span>
              {/* Seal badge */}
              <div className="relative flex items-center justify-center">
                <span className="absolute w-8 h-8 rounded-full border-2 border-primary/30 animate-pulse" />
                <span className="text-[9px] font-bold text-primary font-mono">
                  №42
                </span>
              </div>
            </div>

            {/* Supplier / Client */}
            <div className="grid grid-cols-2 gap-3 text-[9px] text-muted-foreground">
              <div>
                <p className="font-semibold text-foreground text-[10px]">Кодекс ООД</p>
                <p>ЕИК: 204517839</p>
                <p>гр. София</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground text-[10px]">Клиент АД</p>
                <p>ЕИК: 831642181</p>
                <p>гр. Пловдив</p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Line items */}
            <div className="space-y-1.5 text-[9px]">
              <div className="flex justify-between text-muted-foreground">
                <span>Уеб дизайн услуги</span>
                <span className="font-mono">1,200.00</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>SEO оптимизация</span>
                <span className="font-mono">480.00</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Поддръжка (3 мес.)</span>
                <span className="font-mono">360.00</span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Total with flash animation */}
            <div
              className="flex justify-between items-center rounded-md px-2 py-1"
              style={{ animation: "ih-flash 4s ease-in-out infinite" }}
            >
              <span className="text-[10px] font-semibold text-foreground">Общо</span>
              <span className="text-sm font-bold font-mono bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                2,040.00 EUR
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Particle positions (static, defined outside component) ────────────────────

const PARTICLES = [
  { id: 1, top: "12%", left: "8%", duration: 3, delay: 0 },
  { id: 2, top: "25%", left: "85%", duration: 3.5, delay: 0.5 },
  { id: 3, top: "70%", left: "10%", duration: 4, delay: 1 },
  { id: 4, top: "80%", left: "90%", duration: 3.2, delay: 1.5 },
  { id: 5, top: "45%", left: "5%", duration: 3.8, delay: 0.8 },
  { id: 6, top: "55%", left: "92%", duration: 4.2, delay: 2 },
];
