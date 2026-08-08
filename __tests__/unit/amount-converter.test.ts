/**
 * Property-Based Tests for Amount-in-Words Conversion (Bulgarian)
 *
 * WHAT IT IS: Tests that verify the amountToWordsBGN function correctly converts
 * numeric amounts to Bulgarian text with proper grammar rules.
 *
 * WHY IT EXISTS: Bulgarian law requires invoice totals to be written in words.
 * These tests generate thousands of random amounts to ensure the conversion
 * handles all cases correctly — singular/plural, stotinki omission, and error cases.
 *
 * Feature: faktura-invoice-generator
 * Property 3: Amount in Words Round-Trip Correctness
 * Validates: Requirements 19.1, 19.2, 19.3, 19.4, 19.5
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { amountToWordsBGN } from "@/lib/amount-converter";

describe("Feature: faktura-invoice-generator | Property 3: Amount in Words Round-Trip Correctness", () => {
  /**
   * Custom arbitrary: generates valid amounts in [0.01, 9,999,999.99]
   * with exactly 2 decimal places (like real currency amounts).
   */
  const validAmountArb = fc
    .integer({ min: 1, max: 999999999 })
    .map((cents) => cents / 100);

  it("should produce a non-empty string for any valid amount in [0.01, 9,999,999.99]", () => {
    fc.assert(
      fc.property(validAmountArb, (amount) => {
        const result = amountToWordsBGN(amount);
        expect(result).toBeTruthy();
        expect(result.length).toBeGreaterThan(0);
      }),
      { numRuns: 200 }
    );
  });

  it('should output "лев" (singular) when whole part = 1', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 99 }),
        (stotinki) => {
          // amount with whole part = 1, fractional = stotinki/100
          const amount = 1 + stotinki / 100;
          const result = amountToWordsBGN(amount);

          // Should contain "лев" (singular), not "лева" (plural)
          expect(result).toContain("лев");
          // Make sure it's not just matching "лева" (which contains "лев")
          // "лев " or "лев и" should appear (not "лева")
          const levIndex = result.indexOf("лев");
          const nextChar = result[levIndex + 3];
          // After "лев", the next char should be space or "а" (for "лева")
          // We want to confirm it's NOT "лева"
          expect(nextChar).not.toBe("а");
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should output "лева" (plural) when whole part ≥ 2', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 9999999 }),
        fc.integer({ min: 0, max: 99 }),
        (wholePart, stotinki) => {
          const amount = wholePart + stotinki / 100;
          // Guard: ensure we stay in valid range
          if (amount > 9999999.99) return;

          const result = amountToWordsBGN(amount);
          expect(result).toContain("лева");
        }
      ),
      { numRuns: 200 }
    );
  });

  it('should omit stotinki ("стотинка"/"стотинки") when fractional part is 0', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9999999 }),
        (wholePart) => {
          const amount = wholePart; // No fractional part
          const result = amountToWordsBGN(amount);

          expect(result).not.toContain("стотинка");
          expect(result).not.toContain("стотинки");
        }
      ),
      { numRuns: 200 }
    );
  });

  it('should output "стотинка" (singular) when fractional part = 1', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9999999 }),
        (wholePart) => {
          const amount = wholePart + 0.01; // fractional = 1 stotinka
          if (amount > 9999999.99) return;

          const result = amountToWordsBGN(amount);
          // Should contain "стотинка" (singular) — not "стотинки" (plural)
          expect(result).toContain("стотинка");
          // Verify it's singular — check the full word doesn't end with "и"
          const idx = result.indexOf("стотинка");
          const afterWord = result[idx + 8]; // character after "стотинка"
          // Should be undefined (end of string) or space, NOT "и" (which would make "стотинки")
          expect(afterWord === undefined || afterWord === " ").toBe(true);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('should output "стотинки" (plural) when fractional part ≥ 2', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9999999 }),
        fc.integer({ min: 2, max: 99 }),
        (wholePart, stotinki) => {
          const amount = wholePart + stotinki / 100;
          if (amount > 9999999.99) return;

          const result = amountToWordsBGN(amount);
          expect(result).toContain("стотинки");
        }
      ),
      { numRuns: 200 }
    );
  });

  it("should throw an error for amounts ≤ 0", () => {
    fc.assert(
      fc.property(
        fc.double({ min: -9999999, max: 0, noNaN: true }),
        (amount) => {
          expect(() => amountToWordsBGN(amount)).toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should throw an error for amounts > 9,999,999.99", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 9999999.995, max: 99999999, noNaN: true }),
        (amount) => {
          expect(() => amountToWordsBGN(amount)).toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });
});
