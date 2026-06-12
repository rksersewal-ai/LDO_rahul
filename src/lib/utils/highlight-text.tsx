import type { ReactNode } from "react";

/**
 * Wraps matched substrings of `text` in a teal <mark> element.
 * Returns a React node array suitable for inline rendering.
 */
export function highlightText(text: string, query: string): ReactNode {
  if (!query || query.length < 2 || !text) {
    return text;
  }

  const parts: ReactNode[] = [];
  const lower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  let lastIndex = 0;
  let idx = lower.indexOf(queryLower);

  while (idx !== -1) {
    if (idx > lastIndex) {
      parts.push(text.slice(lastIndex, idx));
    }
    parts.push(
      <mark key={idx} className="bg-teal-500/25 text-primary/90 rounded px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>,
    );
    lastIndex = idx + query.length;
    idx = lower.indexOf(queryLower, lastIndex);
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}
