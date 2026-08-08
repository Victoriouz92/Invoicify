"use client";

/**
 * AnimatedSection — a wrapper that applies fade-in + slide-up animation to page sections.
 *
 * WHAT IT IS: A motion.div wrapper applying consistent section entry animations.
 * WHY IT EXISTS: Requirement 16.1 requires page sections to animate in with fade + slide-up
 * (200–400ms, 10–20px offset). The landing page uses Framer Motion directly; this component
 * standardizes the same pattern for the create page's form sections.
 * REAL WORLD ANALOGY: Like a curtain slowly rising on each section of a page as you scroll.
 */

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

interface AnimatedSectionProps {
  children: ReactNode;
  /** Delay in seconds before this section animates in (for staggering) */
  delay?: number;
  className?: string;
}

export function AnimatedSection({ children, delay = 0, className }: AnimatedSectionProps) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReduced ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: prefersReduced ? 0 : 0.3,
        delay: prefersReduced ? 0 : delay,
        ease: [0, 0, 0.2, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
