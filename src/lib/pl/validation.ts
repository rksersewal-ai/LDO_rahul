import { TRPCError } from "@trpc/server";

/**
 * Normalize a PL number input: trim whitespace, remove non-digit characters.
 * Returns the cleaned numeric string.
 */
export function normalizePlNumber(input: string): string {
  return input.trim().replace(/\D/g, "");
}

/**
 * Check if a string is a valid PL number format (exactly 8 numeric digits).
 */
export function isValidPlFormat(input: string): boolean {
  const normalized = normalizePlNumber(input);
  return /^\d{8}$/.test(normalized);
}

/**
 * Validate using Indian Railways Modulo-11 check.
 * Weights: [8, 7, 6, 5, 4, 3, 2, 1]
 * Sum of (digit * weight) mod 11 must equal 0.
 */
export function isValidModulo11(input: string): boolean {
  const normalized = normalizePlNumber(input);
  if (normalized.length !== 8) return false;

  const weights = [8, 7, 6, 5, 4, 3, 2, 1];
  let sum = 0;

  for (let i = 0; i < 8; i++) {
    sum += parseInt(normalized[i], 10) * weights[i];
  }

  return sum % 11 === 0;
}

/**
 * Assert that the input is a valid PL number format.
 * Throws a TRPCError with BAD_REQUEST code if invalid.
 */
export function assertValidPl(input: string): void {
  if (!isValidPlFormat(input)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Invalid PL number format: "${input}". Must be exactly 8 numeric digits.`,
    });
  }
}

/**
 * Extract all 8-digit PL number candidates from a text string.
 * Returns deduplicated array of valid format PL numbers.
 */
export function extractPlCandidates(text: string): string[] {
  const matches = text.match(/\b\d{8}\b/g);
  if (!matches) return [];

  const valid = matches.filter((m) => isValidPlFormat(m));
  return [...new Set(valid)];
}
