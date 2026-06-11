# Dense Vercel-Inspired UI Design System

This guide defines the theme, layout, and component rules for building a compact, Vercel-style dashboard UI like the reference screens: neutral surfaces, sharp hierarchy, subtle borders, compact controls, an orange brand accent, and high-density data pages.

## Design direction

The UI should feel like a production SaaS dashboard: minimal, fast, precise, and information dense.

Use Vercel as the baseline visual language:

- Border-first surfaces instead of heavy shadows.
- Small type, tight spacing, compact controls.
- Neutral background with elevated cards.
- Strong contrast for titles, totals, and active navigation.
- A single warm orange brand color for primary actions, selected states, badges, and chart emphasis.
- Dense tables and dashboard grids that expose more data above the fold.
- Dark mode must be first-class, not an afterthought.

Avoid soft consumer-app styling: no large rounded cards, excessive whitespace, saturated gradients, large shadows, oversized typography, or decorative illustrations.

## Core tokens

Use CSS variables as the source of truth. Prefer `rem` for spacing and radius. Prefer OKLCH tokens where supported because they preserve perceptual consistency across light and dark themes.

### Typography

```css
--font-sans: "Geist", "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--font-serif: "Source Serif 4", Georgia, serif;
--font-mono: "Geist Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace;
```

Guidelines:

- Default body size: `12px` to `13px` for dense dashboards.
- Main page headings: `18px` to `22px`.
- Card metric values: `22px` to `28px`.
- Table body: `12px`.
- Labels, helper text, badges, and navigation items: `11px` to `12px`.
- Use font weight `500` or `600` for labels and table headers.
- Use `700` only for key metrics and page titles.

Recommended type scale:

```css
--text-2xs: 0.625rem;  /* 10px */
--text-xs: 0.6875rem;  /* 11px */
--text-sm: 0.75rem;    /* 12px */
--text-base: 0.8125rem;/* 13px */
--text-md: 0.875rem;   /* 14px */
--text-lg: 1rem;       /* 16px */
--text-xl: 1.25rem;    /* 20px */
--text-metric: 1.5rem; /* 24px */
```

### Radius and shadow

```css
--radius: 0.5rem;
--shadow-xs: 0 1px 2px 0 #0000000d;
--shadow-sm: 0 1px 2px 0 #00000014;
```

Use radius sparingly:

- Cards: `var(--radius)`.
- Buttons, inputs, badges: `calc(var(--radius) - 2px)`.
- Small icon buttons and table pills: `0.375rem`.
- Avoid pill-shaped controls unless representing a status badge or tag.

### Light theme tokens

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.1450 0 0);

  --card: oklch(1 0 0);
  --card-foreground: oklch(0.1450 0 0);

  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.1450 0 0);

  --primary: #d38738;
  --primary-foreground: oklch(0.9850 0 0);

  --secondary: oklch(0.9700 0 0);
  --secondary-foreground: oklch(0.2050 0 0);

  --accent: oklch(0.9700 0 0);
  --accent-foreground: oklch(0.2050 0 0);

  --muted: oklch(0.9700 0 0);
  --muted-foreground: oklch(0.5560 0 0);

  --destructive: oklch(0.5770 0.2450 27.3250);
  --destructive-foreground: oklch(1 0 0);

  --border: oklch(0.9220 0 0);
  --input: oklch(0.9220 0 0);
  --ring: oklch(0.7080 0 0);

  --chart-1: #cab0b0;
  --chart-2: oklch(0.6200 0.1900 260);
  --chart-3: oklch(0.5500 0.2200 263);
  --chart-4: oklch(0.4900 0.2200 264);
  --chart-5: oklch(0.4200 0.1800 266);

  --sidebar: oklch(0.9850 0 0);
  --sidebar-foreground: oklch(0.1450 0 0);
  --sidebar-primary: oklch(0.2050 0 0);
  --sidebar-primary-foreground: oklch(0.9850 0 0);
  --sidebar-accent: oklch(0.9700 0 0);
  --sidebar-accent-foreground: oklch(0.2050 0 0);
  --sidebar-border: oklch(0.9220 0 0);
  --sidebar-ring: oklch(0.7080 0 0);
}
```

### Dark theme tokens

```css
.dark {
  --background: oklch(0.1450 0 0);
  --foreground: oklch(0.9850 0 0);

  --card: oklch(0.2050 0 0);
  --card-foreground: oklch(0.9850 0 0);

  --popover: oklch(0.2690 0 0);
  --popover-foreground: oklch(0.9850 0 0);

  --primary: #d38738;
  --primary-foreground: oklch(0.2050 0 0);

  --secondary: oklch(0.2690 0 0);
  --secondary-foreground: oklch(0.9850 0 0);

  --accent: oklch(0.3710 0 0);
  --accent-foreground: oklch(0.9850 0 0);

  --muted: oklch(0.2690 0 0);
  --muted-foreground: oklch(0.7080 0 0);

  --destructive: oklch(0.7040 0.1910 22.2160);
  --destructive-foreground: oklch(0.9850 0 0);

  --border: oklch(0.2750 0 0);
  --input: oklch(0.3250 0 0);
  --ring: oklch(0.5560 0 0);

  --chart-1: oklch(0.8100 0.1000 252);
  --chart-2: oklch(0.6200 0.1900 260);
  --chart-3: oklch(0.5500 0.2200 263);
  --chart-4: oklch(0.4900 0.2200 264);
  --chart-5: oklch(0.4200 0.1800 266);

  --sidebar: oklch(0.2050 0 0);
  --sidebar-foreground: oklch(0.9850 0 0);
  --sidebar-primary: oklch(0.4880 0.2430 264.3760);
  --sidebar-primary-foreground: oklch(0.9850 0 0);
  --sidebar-accent: oklch(0.2690 0 0);
  --sidebar-accent-foreground: oklch(0.9850 0 0);
  --sidebar-border: oklch(0.2750 0 0);
  --sidebar-ring: oklch(0.4390 0 0);
}
```

## Layout system

### App shell

Use a fixed-height shell with a compact top bar and a narrow sidebar.

Recommended structure:

```text
.app
  .topbar        height: 44px
  .shell
    .sidebar    width: 220px desktop, 64px collapsed
    .main       flexible, scrollable
```

Rules:

- Top bar height: `40px` to `48px`.
- Sidebar width: `220px` to `240px`.
- Page horizontal padding: `16px` to `20px`.
- Dashboard grid gap: `12px` to `16px`.
- Prefer full-width sections over floating centered containers.
- Keep the first useful data visible above the fold.

### Density scale

Use density deliberately. Dashboards should default to compact.

```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
```

Recommended spacing:

- Card padding: `12px` to `16px`.
- Table cell padding: `8px 10px`.
- Button height: `28px` to `32px`.
- Input height: `30px` to `34px`.
- Nav item height: `28px` to `32px`.
- Badge height: `18px` to `22px`.

## Components

### Cards

Cards should be border-led and compact.

```css
.card {
  background: var(--card);
  color: var(--card-foreground);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-xs);
}
```

Guidelines:

- Use a single-pixel border for structure.
- Use `box-shadow` only for tiny separation.
- Metrics cards should include a small label, large metric, short context line, and optional delta badge.
- For dense dashboards, card headers should usually be `12px` to `13px`, not large section headers.

### Buttons

Button hierarchy:

1. Primary: orange fill, for the main action only.
2. Secondary: muted fill or transparent with border.
3. Ghost: navigation or low-emphasis actions.
4. Icon button: topbar actions and table menus.

Rules:

- Button height: `30px` default.
- Horizontal padding: `10px` to `12px`.
- Font size: `12px`.
- Use primary sparingly. Too many orange buttons dilute the brand action.

### Forms and inputs

Inputs should feel like tools, not landing-page forms.

Rules:

- Height: `32px`.
- Border: `1px solid var(--input)`.
- Background: `var(--background)` in light mode, `var(--card)` or `var(--secondary)` in dark mode.
- Label size: `11px` or `12px`, weight `600`.
- Helper text: muted, `11px`.
- Focus ring: `2px solid color-mix(in oklab, var(--ring), transparent 55%)` or an equivalent subtle outline.

### Sidebar

Sidebar should provide fast scanning and compact navigation.

Rules:

- Keep items left-aligned with small icons.
- Use an orange background or orange accent only for the strongest selected/primary item.
- Section labels should be muted and tiny.
- Bottom utility links belong at the bottom: settings, help, search.
- The sidebar background should be slightly separated from the main canvas using `--sidebar` and `--sidebar-border`.

### Tables

Tables are core to this UI. Prioritize legibility and density.

Rules:

- Header height: `32px` to `36px`.
- Row height: `36px` to `44px`.
- Cell padding: `8px 10px`.
- Use sticky headers for long tables.
- Use checkboxes, drag handles, compact status badges, and overflow menus.
- Keep numbers tabular using `font-variant-numeric: tabular-nums`.
- Use a subtle hover background: `var(--accent)`.
- Avoid zebra striping unless the table is extremely wide.

### Status badges

Use small, readable badges.

Recommended states:

- Done / Success: green dot and neutral badge.
- In process: spinner or neutral dot and muted badge.
- Failed: destructive text or dot, not a full red row.
- Pending: neutral badge.

Badge CSS pattern:

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  height: 1.25rem;
  padding: 0 0.375rem;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--secondary);
  color: var(--secondary-foreground);
  font-size: var(--text-2xs);
  font-weight: 600;
}
```

### Charts

Charts should be quiet and embedded into cards.

Rules:

- Use thin strokes and low-opacity area fills.
- Orange is for primary trend emphasis.
- Blue or slate chart colors can support secondary series.
- Keep grid lines faint.
- Avoid legends when labels or context make the chart obvious.
- Use compact range selectors in the chart header.

### Tabs and segmented controls

Tabs should feel like small toolbar controls.

Rules:

- Height: `28px` to `32px`.
- Active tab: elevated or filled with `var(--background)`/`var(--card)` and border.
- Include tiny count badges when useful.
- Keep tab labels short.

### Empty states

Dense apps still need useful empty states.

Rules:

- Keep empty states small and actionable.
- Use a title, one short sentence, and one action.
- Avoid large illustration blocks.

## Page patterns

### Dashboard page

Recommended composition:

1. Topbar with breadcrumb, theme toggle, and save/action button.
2. Sidebar with compact navigation.
3. KPI row of 3 to 5 cards.
4. Main chart card.
5. Tabs or section selector.
6. Dense table or document list.

### Cards page

Recommended composition:

- Use a masonry-like grid of compact cards.
- Mix metrics, forms, payments, charts, calendar, and settings cards.
- Keep card heights variable but align the grid with consistent gaps.
- For forms, keep labels and controls compact.

### Settings/theme editor page

Recommended composition:

- Left panel for editable tokens.
- Right panel for live preview.
- Preview should show real components, not abstract swatches only.
- Keep token inputs small and organized by section: colors, typography, other.

## Interaction states

Every interactive component needs visible states.

```css
.interactive:hover {
  background: var(--accent);
  color: var(--accent-foreground);
}

.interactive:focus-visible {
  outline: 2px solid color-mix(in oklab, var(--ring), transparent 45%);
  outline-offset: 2px;
}

.interactive:disabled {
  opacity: 0.5;
  pointer-events: none;
}
```

Rules:

- Hover should be subtle.
- Focus must be visible.
- Active navigation should be unmistakable.
- Disabled controls should remain legible.

## Accessibility

- Maintain WCAG AA contrast for text and controls.
- Do not rely on color alone for state; use text, icons, or dots.
- Keep focus states visible in both light and dark themes.
- Use semantic HTML for tables, forms, navigation, and buttons.
- Ensure hit targets are at least `28px` in dense desktop contexts and larger on touch devices.
- Use `prefers-reduced-motion` to disable nonessential animation.

## Implementation checklist

Use this checklist when building pages:

- [ ] All surfaces use `--background`, `--card`, `--border`, and `--foreground` tokens.
- [ ] Primary orange appears only for important actions, selected state, or primary chart emphasis.
- [ ] Dashboard content is visible above the fold without oversized headers.
- [ ] Tables use compact rows, tabular numbers, sticky headers, and subtle hover state.
- [ ] Forms use small labels, compact inputs, clear focus rings, and muted helper text.
- [ ] Dark mode uses separate tokens and does not simply invert light mode.
- [ ] Spacing follows the density scale.
- [ ] Component states are defined: hover, focus-visible, active, disabled, loading.
- [ ] Charts are quiet, low-ink, and embedded inside cards.
- [ ] The sample page looks complete using only these tokens.
