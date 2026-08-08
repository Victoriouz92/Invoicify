/**
 * EIK-9 Validation Module
 *
 * WHAT IT IS: A function that checks if a Bulgarian company ID number (EIK) is valid.
 * WHY IT EXISTS: Bulgarian law requires valid EIK numbers on every invoice.
 *   The checksum catches typos before an invoice is generated.
 * REAL WORLD ANALOGY: Like the last digit of a credit card number — it's
 *   mathematically derived from the other digits to catch entry errors.
 */

import type { EIKValidationResult } from "./types";

/**
 * Validates a 9-digit Bulgarian EIK (Единен идентификационен код) number.
 *
 * The algorithm uses a two-pass weighted checksum:
 * - Pass 1: weights [1,2,3,4,5,6,7,8] → sum % 11
 * - Pass 2 (only if Pass 1 remainder = 10): weights [3,4,5,6,7,8,9,10] → sum % 11
 *
 * @param eik - The EIK string to validate
 * @returns An object with `valid: true` or `valid: false` with an error code
 */
export function validateEIK(eik: string): EIKValidationResult {
  // Step 1: Check for non-digit characters
  if (!/^\d+$/.test(eik)) {
    return { valid: false, error: "non_digits" };
  }

  // Step 2: Check length (exactly 9 digits)
  if (eik.length !== 9) {
    return { valid: false, error: "wrong_length" };
  }

  // Convert string to array of numbers for math operations
  const digits = eik.split("").map(Number);
  const checkDigit = digits[8];

  // Step 3: Pass 1 — multiply first 8 digits by weights [1,2,3,4,5,6,7,8]
  const weights1 = [1, 2, 3, 4, 5, 6, 7, 8];
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += digits[i] * weights1[i];
  }
  let remainder = sum % 11;

  // If remainder < 10, it IS the expected check digit
  if (remainder < 10) {
    return {
      valid: remainder === checkDigit,
      error: remainder !== checkDigit ? "invalid_checksum" : undefined,
    };
  }

  // Step 4: Pass 2 — only runs when Pass 1 gives remainder = 10
  // Multiply first 8 digits by weights [3,4,5,6,7,8,9,10]
  const weights2 = [3, 4, 5, 6, 7, 8, 9, 10];
  sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += digits[i] * weights2[i];
  }
  remainder = sum % 11;

  // If remainder < 10, it's the expected check digit; if 10, check digit is 0
  const expectedCheckDigit = remainder < 10 ? remainder : 0;

  return {
    valid: expectedCheckDigit === checkDigit,
    error: expectedCheckDigit !== checkDigit ? "invalid_checksum" : undefined,
  };
}
