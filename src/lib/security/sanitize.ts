/**
 * Sanitizes user input by stripping potentially dangerous HTML content.
 * Uses regex-based approach to:
 * - Remove <script>...</script> tags and their content
 * - Remove on* event handler attributes (onclick, onerror, etc.)
 * - Remove javascript: URLs
 * - Strip remaining HTML tags (keeps text content)
 *
 * @param input - The user-provided string to sanitize
 * @returns Sanitized string safe for display
 */
export function sanitizeUserInput(input: string): string {
  if (!input) return input;

  let sanitized = input;

  // 1. Remove <script>...</script> tags and their content (case-insensitive, multiline)
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // 2. Remove on* event handler attributes (e.g., onclick="...", onerror='...')
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "");

  // 3. Remove javascript: URLs (in href, src, action, etc.)
  sanitized = sanitized.replace(
    /(?:href|src|action)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi,
    "",
  );
  // Also handle standalone javascript: protocol references
  sanitized = sanitized.replace(/javascript\s*:/gi, "");

  // 4. Strip remaining HTML tags but keep text content
  sanitized = sanitized.replace(/<[^>]*>/g, "");

  // 5. Trim excessive whitespace that may result from tag removal
  sanitized = sanitized.replace(/\s{2,}/g, " ").trim();

  return sanitized;
}
