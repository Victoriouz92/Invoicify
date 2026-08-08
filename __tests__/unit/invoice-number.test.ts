/**
 * Property-Based Tests for Invoice Number Management
 *
 * WHAT IT IS: Tests that verify invoice numbering works correctly for ALL possible inputs,
 * not just a few hand-picked examples.
 * WHY IT EXISTS: Bulgarian law requires sequential invoice numbers with no gaps.
 * These tests generate hundreds of random numbers to ensure the auto-increment
 * and gap detection logic never fails.
 * REAL WORLD ANALOGY: Like testing a ticket dispenser with hundreds of random starting numbers
 * to make sure it always gives the correct next ticket.
 *
 * Feature: faktura-invoice-generator
 * Property 9: Invoice Number Auto-Increment
 * Property 10: Sequence Gap Detection
 * Validates: Requirements 5.4, 11.1, 11.3
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  getNextInvoiceNumber,
  checkSequenceGap,
} from "../../lib/invoice-number";

describe("Property 9: Invoice Number Auto-Increment", () => {
  /**
   * For any numeric suffix N (within a safe range), the next invoice number
   * should have a numeric value of N + 1, zero-padded to 10 digits.
   */
  it("should return N+1 zero-padded to 10 digits for any numeric suffix N", () => {
    fc.assert(
      fc.property(
        // Generate a number N in a safe range (1 to 9,999,999,998)
        // Upper bound ensures N+1 still fits in 10 digits (max 9999999999)
        fc.integer({ min: 1, max: 9_999_999_998 }),
        (n) => {
          // Create a 10-digit zero-padded string as the "last number"
          const lastNumber = n.toString().padStart(10, "0");

          const nextNumber = getNextInvoiceNumber(lastNumber);

          // The next number should be N+1, zero-padded to 10 digits
          const expected = (n + 1).toString().padStart(10, "0");
          expect(nextNumber).toBe(expected);
        }
      ),
      { numRuns: 200 }
    );
  });

  /**
   * For any numeric suffix N embedded in a prefixed string (e.g., "INV-0005"),
   * the next invoice number should still extract N, increment, and zero-pad.
   */
  it("should extract numeric suffix from prefixed numbers and increment correctly", () => {
    fc.assert(
      fc.property(
        // Generate a prefix of 1-5 uppercase letters
        fc.array(fc.constantFrom("A", "B", "C", "I", "N", "V"), {
          minLength: 1,
          maxLength: 5,
        }),
        // Generate a number N
        fc.integer({ min: 1, max: 999_999 }),
        (prefixChars, n) => {
          const prefix = prefixChars.join("");
          // Create something like "INV-0042"
          const lastNumber = `${prefix}-${n.toString().padStart(4, "0")}`;

          const nextNumber = getNextInvoiceNumber(lastNumber);

          // The function extracts the numeric suffix and increments it
          const expected = (n + 1).toString().padStart(10, "0");
          expect(nextNumber).toBe(expected);
        }
      ),
      { numRuns: 200 }
    );
  });

  /**
   * When lastNumber is null, the function should return the default "0000000001".
   */
  it("should return 0000000001 when lastNumber is null", () => {
    const result = getNextInvoiceNumber(null);
    expect(result).toBe("0000000001");
  });

  /**
   * When lastNumber has no numeric suffix, the function should return "0000000001".
   */
  it("should return 0000000001 when lastNumber has no numeric suffix", () => {
    fc.assert(
      fc.property(
        // Generate strings with only letters (no digits at all)
        fc.array(fc.constantFrom("a", "b", "c", "x", "y", "z"), {
          minLength: 1,
          maxLength: 10,
        }),
        (chars) => {
          const nonNumericString = chars.join("");
          const result = getNextInvoiceNumber(nonNumericString);
          expect(result).toBe("0000000001");
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Property 10: Sequence Gap Detection", () => {
  /**
   * For any last number N and entered number M where M > N+1,
   * a gap warning should be detected (returns true).
   */
  it("should detect a gap when entered number M > last number N + 1", () => {
    fc.assert(
      fc.property(
        // Generate N (last used number)
        fc.integer({ min: 1, max: 999_999 }),
        // Generate a gap size (at least 1, so M = N + 1 + gap > N + 1)
        fc.integer({ min: 1, max: 1000 }),
        (n, gap) => {
          const lastUsed = n.toString().padStart(10, "0");
          const current = (n + 1 + gap).toString().padStart(10, "0");

          const hasGap = checkSequenceGap(current, lastUsed);

          expect(hasGap).toBe(true);
        }
      ),
      { numRuns: 200 }
    );
  });

  /**
   * For any last number N, when the entered number M = N+1 (the next sequential),
   * no gap warning should appear (returns false).
   */
  it("should NOT detect a gap when entered number M = N + 1", () => {
    fc.assert(
      fc.property(
        // Generate N (last used number)
        fc.integer({ min: 1, max: 9_999_999_998 }),
        (n) => {
          const lastUsed = n.toString().padStart(10, "0");
          const current = (n + 1).toString().padStart(10, "0");

          const hasGap = checkSequenceGap(current, lastUsed);

          expect(hasGap).toBe(false);
        }
      ),
      { numRuns: 200 }
    );
  });

  /**
   * For any last number N and entered number M where M <= N,
   * no gap warning should appear (returns false — going backward is not a "gap").
   */
  it("should NOT detect a gap when entered number M <= N", () => {
    fc.assert(
      fc.property(
        // Generate N (last used number)
        fc.integer({ min: 2, max: 999_999 }),
        // Generate how far back M is (0 = same number, positive = earlier)
        fc.integer({ min: 0, max: 100 }),
        (n, backOffset) => {
          const lastUsed = n.toString().padStart(10, "0");
          const current = Math.max(1, n - backOffset).toString().padStart(10, "0");

          const hasGap = checkSequenceGap(current, lastUsed);

          expect(hasGap).toBe(false);
        }
      ),
      { numRuns: 200 }
    );
  });

  /**
   * When lastUsed is null (first invoice ever), no gap should be detected
   * regardless of the current number.
   */
  it("should NOT detect a gap when lastUsed is null (first invoice)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9_999_999 }),
        (n) => {
          const current = n.toString().padStart(10, "0");

          const hasGap = checkSequenceGap(current, null);

          expect(hasGap).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
