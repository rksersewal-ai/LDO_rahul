## 2024-06-13 - Added ARIA labels and focus visibility to Recent Searches
**Learning:** Found that secondary icon actions within list items (like the 'remove search' X) were visually hidden on focus (`opacity-0 group-hover:opacity-100`), making them completely inaccessible to keyboard users tabbing through the interface.
**Action:** Always ensure hidden-by-default secondary actions include `focus-visible:opacity-100` along with `aria-label`s so keyboard users can discover and interact with them.
