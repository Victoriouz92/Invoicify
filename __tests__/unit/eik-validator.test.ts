/**
 * Property-Based Tests for EIK-9 Validation
 *
 * WHAT IT IS: Tests that verify the EIK validator works correctly for ALL possible inputs,
 * not just a few hand-picked examples.
 * WHY IT EXISTS: The EIK checksum algorithm must never let invalid numbers through —
 * these tests generate hundreds of random inputs to find edge cases we might miss.
 * REAL WORLD ANALOGY: Instead of testing a lock with 3 keys, we test it with 100 random keys
 * to make sure only valid ones open it.
 *
 * Feature: faktura-invoice-generator
 * Property 1: EIK Checksum Validation
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { validateEIK } from "../../lib/eik-validator";

/**
 * Computes the valid check digit for an 8-digit EIK prefix.
 * This mirrors the algorithm in the implementation so we can generate known-valid EIKs.
 */
function computeCheckDigit(digits: number[]): number {
  // Pass 1: weights [1,2,3,4,5,6,7,8]
  const weights1 = [1, 2, 3, 4, 5, 6, 7, 8];
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += digits[i] * weights1[i];
  }
  let remainder = sum % 11;

  if (remainder < 10) {
    return remainder;
  }

  // Pass 2: weights [3,4,5,6,7,8,9,10]
  const weights2 = [3, 4, 5, 6, 7, 8, 9, 10];
  sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += digits[i] * weights2[i];
  }
  remainder = sum % 11;

  return remainder < 10 ? remainder : 0;
}

/** Generates an array of exactly 8 random digits (0-9) */
const eightDigitsArb = fc.array(fc.integer({ min: 0, max: 9 }), {
  minLength: 8,
  maxLength: 8,
});

describe("Property 1: EIK Checksum Validation", () => {
  // --- Sub-property: Valid EIKs are accepted ---
  it("should return valid for any 8-digit prefix with correct check digit", () => {
    fc.assert(
      fc.property(eightDigitsArb, (prefix) => {
        const checkDigit = computeCheckDigit(prefix);
        const validEIK = prefix.join("") + checkDigit.toString();
        const result = validateEIK(validEIK);

        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      }),
      { numRuns: 200 }
    );
  });

  // --- Sub-property: Invalid check digits are rejected ---
  it("should return invalid_checksum when 9th digit does not match computed check digit", () => {
    fc.assert(
      fc.property(
        eightDigitsArb,
        fc.integer({ min: 0, max: 9 }),
        (prefix, wrongDigit) => {
          const correctCheckDigit = computeCheckDigit(prefix);

          // Skip if the random digit happens to be the correct one
          fc.pre(wrongDigit !== correctCheckDigit);

          const invalidEIK = prefix.join("") + wrongDigit.toString();
          const result = validateEIK(invalidEIK);

          expect(result.valid).toBe(false);
          expect(result.error).toBe("invalid_checksum");
        }
      ),
      { numRuns: 200 }
    );
  });

  // --- Sub-property: Non-digit characters are rejected ---
  it('should return "non_digits" error for strings containing non-digit characters', () => {
    fc.assert(
      fc.property(
        // Generate a string that contains at least one non-digit character
        fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /[^0-9]/.test(s)),
        (input) => {
          const result = validateEIK(input);

          expect(result.valid).toBe(false);
          expect(result.error).toBe("non_digits");
        }
      ),
      { numRuns: 200 }
    );
  });

  // --- Sub-property: Wrong length digit strings are rejected ---
  it('should return "wrong_length" error for digit strings with length ≠ 9', () => {
    fc.assert(
      fc.property(
        // Generate a length that is NOT 9 (between 1 and 20)
        fc.integer({ min: 1, max: 20 }).filter((len) => len !== 9),
        (length) => {
          // Build a digit-only string of the generated length
          const digits = Array.from({ length }, (_, i) => (i % 10).toString()).join("");
          const result = validateEIK(digits);

          expect(result.valid).toBe(false);
          expect(result.error).toBe("wrong_length");
        }
      ),
      { numRuns: 200 }
    );
  });
});
