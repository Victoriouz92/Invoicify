/**
 * Bulgarian Amount-in-Words Converter.
 *
 * WHAT IT IS: A pure function that converts a numeric amount (e.g. 1234.56)
 * into Bulgarian text (e.g. "хиляда двеста тридесет и четири лева и петдесет и шест стотинки").
 *
 * WHY IT EXISTS: Bulgarian law requires the grand total on every invoice to be
 * written out in words. This module handles the conversion with proper grammatical
 * gender (masculine for лев, feminine for стотинка) and conjunction "и" placement.
 *
 * REAL WORLD ANALOGY: Like writing a check — the bank needs the amount both as
 * a number and spelled out in words to prevent tampering.
 */

// ─── Number Word Tables ──────────────────────────────────────────────────────

/** Ones (1-9) in masculine form */
const ONES_MASCULINE = [
  "", "един", "два", "три", "четири", "пет", "шест", "седем", "осем", "девет",
];

/** Ones (1-9) in feminine form */
const ONES_FEMININE = [
  "", "една", "две", "три", "четири", "пет", "шест", "седем", "осем", "девет",
];

/** Ones (1-9) in neuter form (used for "евро") */
const ONES_NEUTER = [
  "", "едно", "две", "три", "четири", "пет", "шест", "седем", "осем", "девет",
];

/** Teens (10-19) */
const TEENS = [
  "десет", "единадесет", "дванадесет", "тринадесет", "четиринадесет",
  "петнадесет", "шестнадесет", "седемнадесет", "осемнадесет", "деветнадесет",
];

/** Tens (20, 30, ..., 90) — index 2 = двадесет, index 3 = тридесет, etc. */
const TENS = [
  "", "", "двадесет", "тридесет", "четиридесет",
  "петдесет", "шестдесет", "седемдесет", "осемдесет", "деветдесет",
];

/** Hundreds (100, 200, ..., 900) */
const HUNDREDS = [
  "", "сто", "двеста", "триста", "четиристотин",
  "петстотин", "шестстотин", "седемстотин", "осемстотин", "деветстотин",
];

// ─── Helper: Convert a number (1–999) to Bulgarian words ─────────────────────

/**
 * Converts a number from 1 to 999 into Bulgarian words.
 * Handles conjunction "и" placement between hundreds and the rest,
 * or between tens and ones.
 */
function groupToWords(n: number, gender: "masculine" | "feminine" | "neuter"): string {
  if (n === 0) return "";

  const ones = gender === "masculine" ? ONES_MASCULINE : gender === "feminine" ? ONES_FEMININE : ONES_NEUTER;
  const h = Math.floor(n / 100);
  const remainder = n % 100;
  const t = Math.floor(remainder / 10);
  const o = remainder % 10;

  const parts: string[] = [];

  // Hundreds part
  if (h > 0) {
    parts.push(HUNDREDS[h]);
  }

  // Tens and ones part
  if (remainder >= 10 && remainder <= 19) {
    // Teens: единадесет, дванадесет, etc.
    parts.push(TEENS[remainder - 10]);
  } else {
    if (t >= 2) {
      parts.push(TENS[t]);
    }
    if (o > 0) {
      parts.push(ones[o]);
    }
  }

  // Join with "и" between the last two non-empty parts
  if (parts.length === 1) {
    return parts[0];
  }

  // In Bulgarian, "и" is placed between the last two parts of a group
  // e.g. "сто двадесет и три", "двадесет и пет"
  if (h > 0 && remainder > 0 && remainder < 10) {
    // Hundreds + single digit: "сто и пет"
    return `${parts[0]} и ${parts[1]}`;
  }
  if (h > 0 && remainder >= 10 && remainder <= 19) {
    // Hundreds + teen: "сто и тринадесет"
    return `${parts[0]} и ${parts[1]}`;
  }
  if (h > 0 && t >= 2 && o > 0) {
    // Hundreds + tens + ones: "двеста тридесет и четири"
    return `${parts[0]} ${parts[1]} и ${parts[2]}`;
  }
  if (h > 0 && t >= 2 && o === 0) {
    // Hundreds + tens only: "сто двадесет"
    return `${parts[0]} ${parts[1]}`;
  }
  if (h === 0 && t >= 2 && o > 0) {
    // Tens + ones: "двадесет и три"
    return `${parts[0]} и ${parts[1]}`;
  }

  // Fallback: join with spaces
  return parts.join(" ");
}

// ─── Main: Convert number to Bulgarian words ─────────────────────────────────

/**
 * Converts a number (1–9,999,999) to Bulgarian words with proper grammatical gender.
 *
 * @param n - the number to convert (must be 1–9,999,999)
 * @param gender - "masculine" for цент, "feminine" for стотинка, "neuter" for евро
 * @returns Bulgarian words for the number
 */
export function numberToWordsBg(n: number, gender: "masculine" | "feminine" | "neuter"): string {
  if (n === 0) return "нула";
  if (n < 0 || n > 9999999 || !Number.isInteger(n)) {
    throw new Error("Number outside supported range (0 - 9,999,999)");
  }

  const millions = Math.floor(n / 1000000);
  const thousands = Math.floor((n % 1000000) / 1000);
  const units = n % 1000;

  const groups: string[] = [];

  // Millions group
  if (millions > 0) {
    if (millions === 1) {
      groups.push("един милион");
    } else {
      // Millions use masculine gender for the count word
      groups.push(`${groupToWords(millions, "masculine")} милиона`);
    }
  }

  // Thousands group
  if (thousands > 0) {
    if (thousands === 1) {
      groups.push("хиляда");
    } else {
      // Thousands use feminine gender for the count word (една хиляди, две хиляди)
      groups.push(`${groupToWords(thousands, "feminine")} хиляди`);
    }
  }

  // Units group (uses the gender specified by the caller)
  if (units > 0) {
    groups.push(groupToWords(units, gender));
  }

  // Join groups with "и" between the last two
  if (groups.length === 1) {
    return groups[0];
  }

  if (groups.length === 2) {
    // If the last group is a small number (< 100 for units), use "и"
    // Otherwise join with space
    if (units > 0 && units < 100) {
      return `${groups[0]} и ${groups[1]}`;
    }
    // If there are no units but thousands < 100, use "и"
    if (units === 0 && thousands > 0 && thousands < 100) {
      return `${groups[0]} и ${groups[1]}`;
    }
    return groups.join(" ");
  }

  if (groups.length === 3) {
    // millions + thousands + units
    // "и" goes before the last group if it's < 100
    if (units > 0 && units < 100) {
      return `${groups[0]} ${groups[1]} и ${groups[2]}`;
    }
    return groups.join(" ");
  }

  return groups.join(" ");
}

// ─── Public API: Convert monetary amount to Bulgarian words ──────────────────

/**
 * Converts a monetary amount to Bulgarian words with Euro currency.
 * Bulgaria's official currency is the Euro (adopted 2024).
 *
 * "евро" is neuter gender and does not change form (no singular/plural distinction).
 * "цент" is masculine: 1 = "цент", 2+ = "цента".
 *
 * Examples:
 * - 1.00 → "едно евро"
 * - 2.50 → "две евро и петдесет цента"
 * - 100.01 → "сто евро и един цент"
 * - 1234.56 → "хиляда двеста тридесет и четири евро и петдесет и шест цента"
 *
 * @param amount - the monetary amount (0.01 to 9,999,999.99)
 * @returns Bulgarian text representation of the amount in Euro
 * @throws Error if amount is ≤ 0 or > 9,999,999.99
 */
export function amountToWords(amount: number): string {
  if (amount <= 0 || amount > 9999999.99) {
    throw new Error("Amount outside supported range (0.01 - 9,999,999.99)");
  }

  const wholePart = Math.floor(amount);
  const fractionalPart = Math.round((amount - wholePart) * 100);

  // "евро" is neuter gender — numbers use neuter/neutral forms:
  // 1 = "едно", 2 = "две" (same as feminine for 2, neuter for 1)
  // For simplicity, we use neuter form: "едно евро", "две евро"
  const wholeWords = numberToWordsBg(wholePart, "neuter");
  const currencyWord = "евро"; // Does not change for singular/plural

  // If no cents, return just the whole part
  if (fractionalPart === 0) {
    return `${wholeWords} ${currencyWord}`;
  }

  // "цент" is masculine: 1 = "цент", 2+ = "цента"
  const fractionalWords = numberToWordsBg(fractionalPart, "masculine");
  const centWord = fractionalPart === 1 ? "цент" : "цента";

  return `${wholeWords} ${currencyWord} и ${fractionalWords} ${centWord}`;
}

/**
 * Legacy: Converts amount to Bulgarian words with BGN (лев) currency.
 * Kept for reference — Bulgaria used лев until Euro adoption.
 *
 * @param amount - the monetary amount (0.01 to 9,999,999.99)
 * @returns Bulgarian text representation in лева
 * @throws Error if amount is ≤ 0 or > 9,999,999.99
 */
export function amountToWordsBGN(amount: number): string {
  if (amount <= 0 || amount > 9999999.99) {
    throw new Error("Amount outside supported range (0.01 - 9,999,999.99)");
  }

  const wholePart = Math.floor(amount);
  const fractionalPart = Math.round((amount - wholePart) * 100);

  const wholeWords = numberToWordsBg(wholePart, "masculine");
  const currencyWord = wholePart === 1 ? "лев" : "лева";

  if (fractionalPart === 0) {
    return `${wholeWords} ${currencyWord}`;
  }

  const fractionalWords = numberToWordsBg(fractionalPart, "feminine");
  const stotinkiWord = fractionalPart === 1 ? "стотинка" : "стотинки";

  return `${wholeWords} ${currencyWord} и ${fractionalWords} ${stotinkiWord}`;
}
