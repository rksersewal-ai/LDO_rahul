/**
 * Escapes special characters in a string before using it in a SQL LIKE/ILIKE pattern.
 * Prevents wildcard injection where user input containing % or _ can craft
 * expensive or unintended LIKE patterns.
 *
 * @param str - The raw user input string
 * @returns The escaped string safe for use in LIKE patterns
 */
export function escapeLikePattern(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}
