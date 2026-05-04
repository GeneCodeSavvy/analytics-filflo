# Filflo Web — Design System

This is the single source of truth for visual language across `apps/web`. Every page must consume tokens from this system. New hex codes, ad-hoc oklch values, and per-page font/radius/shadow choices are forbidden.

Today's CSS is incoherent: notifications hardcodes `oklch()` everywhere, dashboard hardcodes hex (`#FAFAF8`, `#E8E6E0`), tickets uses `var(--primary)` properly, teams uses Tailwind arbitrary hex. Three font stacks, two radius scales, no shared status palette. This document defines the target.

---

## 1. Aesthetic

**Paper + terminal.** Warm off-white surfaces, sand/stone neutrals, a single burnt-orange accent for action, monospace-forward typography. Low chroma. Quiet shadows. Sharp 6–8px radii. The vibe is a well-bound paperback printed on a dot-matrix printer — utilitarian, calm, considered.

Principles:

- **One accent, used sparingly.** Burnt orange marks the single primary action on screen. Status colors (success/warn/error/info) are muted and never compete with the accent.
- **Mono is the body voice.** Geist Mono carries 13px UI text. Sans (Inter) is reserved for marketing-density surfaces (dashboard hero figures). Never mix at random.
- **Surfaces are warm white, not cold.** `#FAFAF8` page background, `#FFFFFF` card, `#F5F4F0` hover. Never pure `#F5F5F5` cool grey.
- **Borders do the heavy lifting.** Shadows stay near-invisible. A 1px `#E8E6E1` line separates almost everything.
- **Density is monospace-grid.** 13px / 1.45 line-height baseline. Everything aligns to a 4px sub-grid.

### 1.1 Page Shell And Heading Contract

Every authenticated page uses the same shell rhythm:

- Outer page: `app-page-frame bg-[--surface-page] text-[--ink-1] font-mono`.
- Inner page: `app-page-frame-content max-w-[1440px]`.
- Header: first visible row inside the content, `min-h-16`, `border-b border-[--border-default]`, and enough horizontal breathing room for tools.
- H1: `text-[30px] leading-none font-bold text-[--ink-1]`. Do not use oversized pale headings or page-specific color opacity.
- Header actions sit on the right in the same row. If a page has both view tabs and filters, tabs and filters are two separate rows below the heading.
- Empty states sit inside the page content grid, not floating in large unbounded whitespace. Use `text-[--ink-3]` for body copy and `text-[--ink-1]` for the empty-state title.

The current target pages apply these specific corrections:

- **Dashboard:** card/chart surfaces must read at normal contrast. Metrics may use `font-[--font-sans]`; everything else stays mono. Trend and donut charts use the shared chart/status tokens instead of pale ad-hoc lines.
- **Tickets:** view tabs and filters are two rows. Table header and cells share the same column template. Priority/status strips are at least 4px wide and use status tokens.
- **Messages:** treat as a ticket-context work queue, not a consumer chat app. It uses the same page header and table/inbox density as tickets.
- **Notifications:** no raw `oklch()` utilities. Use tokenized warm stone and ember states.
- **Teams:** one page background only. Org/member cards are card surfaces on that page background, with reduced top whitespace.

---

## 2. Tokens

All tokens live as CSS custom properties on `:root` in `apps/web/src/index.css` and are exposed to Tailwind via `@theme inline`. Components reference them as `var(--token)` or Tailwind utility (`bg-surface`, `text-ink-2`, etc.). **Never hardcode raw values in components.**

### 2.1 Color — raw palette

The palette is closed. If a color you need isn't here, the answer is "use the closest token", not "add a new hex."

```css
/* Stone — neutral surfaces and text */
--stone-50:  #FAFAF8;   /* page background */
--stone-100: #F5F4F0;   /* hover, subtle fill */
--stone-150: #F0EEE9;   /* row separator, inset */
--stone-200: #E8E6E1;   /* border default */
--stone-300: #D1CEC7;   /* border strong, scrollbar */
--stone-400: #A8A49C;   /* placeholder, disabled */
--stone-500: #78756E;   /* muted text */
--stone-600: #5A574F;   /* secondary text */
--stone-700: #3A3833;   /* (reserved) */
--stone-900: #1A1917;   /* primary text */

/* Ember — single accent (burnt orange) */
--ember-50:  #FBF1E8;   /* accent tint background */
--ember-100: #F5E0CC;
--ember-300: #E8A876;
--ember-500: #C4642A;   /* accent default */
--ember-600: #A8521E;   /* accent hover */
--ember-700: #8B4218;   /* accent pressed */

/* Sand — warning / highlight (for amber pills, callouts) */
--sand-50:  #F5F0E6;
--sand-100: #E8DCC0;
--sand-500: #B8941E;
--sand-700: #6B5B3E;

/* Moss — success */
--moss-50:  #ECF0E8;
--moss-500: #5A7A3E;
--moss-700: #3E5728;

/* Brick — destructive / error */
--brick-50:  #F5E8E5;
--brick-100: #EDD5D0;
--brick-500: #B83A2A;
--brick-700: #8B2A1E;

/* Slate — info / secondary chip (cool desaturated teal) */
--slate-50:  #E8EEF0;
--slate-500: #4A6B7A;
--slate-700: #2E4654;
```

### 2.2 Color — semantic tokens

Components use these. Raw palette tokens are an implementation detail.

```css
/* Surfaces */
--surface-page:    var(--stone-50);     /* outer page bg */
--surface-card:    #FFFFFF;             /* card / panel bg */
--surface-sunken:  var(--stone-100);    /* nested fill, hover row */
--surface-overlay: rgba(26, 25, 23, 0.22); /* modal backdrop */

/* Ink (text) */
--ink-1: var(--stone-900);   /* primary headings, body */
--ink-2: var(--stone-600);   /* secondary text */
--ink-3: var(--stone-500);   /* muted labels, captions */
--ink-4: var(--stone-400);   /* placeholder, disabled */
--ink-on-accent: #FFFFFF;

/* Borders */
--border-subtle: var(--stone-150);  /* row separator */
--border-default: var(--stone-200); /* card, input */
--border-strong: var(--stone-300);  /* hover input */
--border-focus:  var(--ember-500);

/* Action */
--action-bg:        var(--ember-500);
--action-bg-hover:  var(--ember-600);
--action-bg-press:  var(--ember-700);
--action-fg:        var(--ink-on-accent);
--action-tint-bg:   var(--ember-50);     /* ghost button hover */
--action-tint-fg:   var(--ember-500);    /* link, ghost button text */

/* Status (pills, badges, callouts) */
--status-success-bg:     var(--moss-50);
--status-success-fg:     var(--moss-700);
--status-success-border: rgba(90, 122, 62, 0.25);

--status-warn-bg:        var(--sand-50);
--status-warn-fg:        var(--sand-700);
--status-warn-border:    rgba(184, 148, 30, 0.25);

--status-danger-bg:      var(--brick-50);
--status-danger-fg:      var(--brick-700);
--status-danger-border:  rgba(184, 58, 42, 0.25);

--status-info-bg:        var(--slate-50);
--status-info-fg:        var(--slate-700);
--status-info-border:    rgba(74, 107, 122, 0.25);

--status-neutral-bg:     var(--stone-100);
--status-neutral-fg:     var(--ink-2);
--status-neutral-border: var(--border-default);

/* Role pills (Teams) — semantic mapping */
--role-super-admin-bg:     var(--sand-50);
--role-super-admin-fg:     var(--sand-700);
--role-super-admin-border: var(--sand-100);

--role-admin-bg:     var(--ember-50);
--role-admin-fg:     var(--ember-700);
--role-admin-border: var(--ember-100);

--role-moderator-bg:     var(--slate-50);
--role-moderator-fg:     var(--slate-700);
--role-moderator-border: rgba(74, 107, 122, 0.2);

--role-user-bg:     var(--stone-100);
--role-user-fg:     var(--ink-2);
--role-user-border: var(--border-default);
```

### 2.3 Typography

```css
--font-mono: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
--font-sans: "Inter Variable", Inter, system-ui, sans-serif;
--font-numeric: "JetBrains Mono", "Geist Mono", ui-monospace, monospace;
```

**Usage rule:** Default to `--font-mono` for all UI surfaces (tables, navs, drawers, forms). Use `--font-sans` only on dashboard hero metrics and marketing-density displays. Use `--font-numeric` for ticket IDs, kbd, code chips, fixed-width tabular numbers.

Type scale (mono baseline = 13px):

| Token             | Size    | Line   | Tracking   | Weight | Use                                      |
|-------------------|---------|--------|------------|--------|------------------------------------------|
| `--text-display`  | 30px    | 1.0    | -0.01em    | 700    | Page H1 (`Teams`, `Tickets`)             |
| `--text-h2`       | 20px    | 1.2    | -0.005em   | 600    | Section heads, modal titles              |
| `--text-h3`       | 16px    | 1.3    | 0          | 600    | Card titles, drawer section heads        |
| `--text-body`     | 13px    | 1.45   | 0          | 400    | Default UI text (tables, forms)          |
| `--text-body-strong` | 13px | 1.45   | 0          | 500    | Buttons, active tabs                     |
| `--text-meta`     | 12px    | 1.4    | 0          | 400    | Secondary metadata, captions             |
| `--text-micro`    | 11px    | 1.4    | 0.04em     | 500    | Pills, badges, chip labels               |
| `--text-eyebrow`  | 10px    | 1.4    | 0.08em     | 600    | UPPERCASE section labels                 |

**No new sizes.** If you need 14px, use `--text-body`. If you need 18px, use `--text-h3`.

### 2.4 Spacing

4px sub-grid. Tailwind's default scale (`p-1` = 4px, `p-2` = 8px, etc.) is the system. Below are named aliases for layout-level values where naming aids intent:

```css
--space-row-y:    10px;  /* table row vertical padding */
--space-row-x:    12px;  /* table row horizontal padding */
--space-card:     20px;  /* card interior padding */
--space-section:  24px;  /* gap between sections */
--space-page-x:   24px;  /* page outer horizontal padding */
```

### 2.5 Radii

```css
--radius-xs: 4px;   /* kbd, micro chip */
--radius-sm: 6px;   /* button, input, popover item */
--radius-md: 8px;   /* card, table container, modal */
--radius-lg: 12px;  /* drawer, large panel, bulk bar */
--radius-pill: 999px;
```

**No 0.375rem / 0.75rem ad-hoc values.** Pick from this scale.

### 2.6 Shadows / elevation

Five steps. Stay quiet — borders are doing most of the work.

```css
--elev-0: none;
--elev-1: 0 1px 2px rgba(26, 25, 23, 0.04), 0 1px 3px rgba(26, 25, 23, 0.06);
--elev-2: 0 2px 4px rgba(26, 25, 23, 0.05), 0 4px 8px rgba(26, 25, 23, 0.06);
--elev-3: 0 4px 12px rgba(26, 25, 23, 0.08), 0 8px 24px rgba(26, 25, 23, 0.06);
--elev-4: 0 12px 32px rgba(26, 25, 23, 0.14), 0 24px 70px rgba(26, 25, 23, 0.18);
--elev-drawer: -18px 0 40px rgba(26, 25, 23, 0.14);
```

| Use case                       | Token         |
|--------------------------------|---------------|
| Card / panel resting           | `--elev-1`    |
| Card hover, popover            | `--elev-2`    |
| Toast, floating bulk bar       | `--elev-3`    |
| Modal dialog                   | `--elev-4`    |
| Right-side drawer              | `--elev-drawer` |

### 2.7 Motion

```css
--ease-standard: cubic-bezier(0.2, 0.8, 0.2, 1);
--ease-out:      cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-out:   cubic-bezier(0.32, 0.72, 0, 1);

--dur-instant: 80ms;   /* hover bg, opacity flicks */
--dur-fast:    150ms;  /* default UI transition */
--dur-medium:  220ms;  /* drawer, modal, tab underline */
--dur-slow:    320ms;  /* page-level reveals */
```

**Reduce-motion respect is mandatory.** Wrap all transform/animation in `@media (prefers-reduced-motion: no-preference)` or provide a `prefers-reduced-motion: reduce` override that disables animation.

### 2.8 Z-index scale

Closed scale. No `z-99`, no `z-9999`.

```css
--z-base:     0;
--z-sticky:   10;   /* sticky table header, sticky nav */
--z-overlay:  20;   /* sticky page header above content */
--z-drawer:   30;
--z-popover:  40;
--z-modal:    50;
--z-toast:    80;
```

---

## 3. Component conventions

These are the recurring primitives across the app. Build new pages by composing these.

### 3.1 Surface

- **Page** — `bg-[--surface-page]`, no border, page-level padding `--space-page-x`.
- **Card / panel** — `bg-[--surface-card] border-[--border-default] rounded-[--radius-md] shadow-[--elev-1]`.
- **Sunken row hover** — `bg-[--surface-sunken]` on `:hover`.

### 3.2 Status pill

```
inline-flex items-center gap-1
border rounded-[--radius-xs]
px-[6px] py-[2px]
text-[11px] font-medium tracking-[0.04em]
```

Color: `bg-[--status-{tone}-bg] text-[--status-{tone}-fg] border-[--status-{tone}-border]`.

### 3.3 Button

| Variant     | Bg                       | Fg                | Border                       | Hover                        |
|-------------|--------------------------|-------------------|------------------------------|------------------------------|
| Primary     | `--action-bg`            | `--action-fg`     | transparent                  | bg → `--action-bg-hover`     |
| Secondary   | `--surface-card`         | `--ink-1`         | `--border-default`           | bg → `--surface-sunken`      |
| Ghost       | transparent              | `--ink-1`         | transparent                  | bg → `--surface-sunken`      |
| Ghost-action| transparent              | `--action-tint-fg`| transparent                  | bg → `--action-tint-bg`      |
| Destructive | transparent              | `--brick-500`     | transparent                  | bg → `--brick-50`            |

Sizes (height, x-padding):
- `sm`: 28px / 8px
- `md`: 32px / 12px (default)
- `lg`: 36px / 16px

All buttons: `rounded-[--radius-sm] text-[13px] font-medium` mono.

### 3.4 Input / select

```
h-[32px] px-[10px]
bg-[--surface-card]
border border-[--border-default] rounded-[--radius-sm]
text-[13px] text-[--ink-1] placeholder:text-[--ink-4]
focus:border-[--border-focus] focus:outline-none
```

### 3.5 Table

- Header: `h-[32px] bg-[--surface-card] sticky top-0 z-[--z-sticky] border-b border-[--border-default]`, label `text-[11px] tracking-[0.04em] uppercase text-[--ink-3]`.
- Body row: `border-b border-[--border-subtle]`, `:hover` → `bg-[--surface-sunken]`.
- Cell: `px-[12px] py-[10px] align-middle text-[13px]`.

### 3.6 Modal

- Backdrop: `fixed inset-0 z-[--z-modal] bg-[--surface-overlay] backdrop-blur-[4px]`.
- Dialog: `bg-[--surface-card] border-[--border-default] rounded-[--radius-md] shadow-[--elev-4] p-[20px]`, width `min(480px, calc(100vw - 32px))`.

### 3.7 Drawer (right-side)

- Width `min(560px, calc(100% - 382px))`, `min-w-[360px]`.
- `border-l border-[--border-default] bg-[--surface-card] shadow-[--elev-drawer]`.
- Enter: `translateX(100%) → 0` over `--dur-medium` `--ease-out`.

### 3.8 Toast

`fixed bottom-[24px] left-1/2 -translate-x-1/2 z-[--z-toast] bg-[--ink-1] text-white px-[12px] py-[9px] rounded-[--radius-md] shadow-[--elev-3] text-[12px] font-mono`.

### 3.9 Pill / chip family

| Use            | Height | Radius        | Bg                 | Border             | Text size |
|----------------|--------|---------------|--------------------|--------------------|-----------|
| Status pill    | 22px   | `--radius-xs` | status tint        | status border      | 11px      |
| Filter chip    | 26px   | `--radius-sm` | `--surface-card`   | `--border-default` | 12px      |
| Filter active  | 26px   | `--radius-sm` | `--surface-sunken` | `--border-default` | 12px      |
| Count badge    | 18px   | `--radius-pill`| `--surface-card`  | `--border-default` | 10px      |
| Ticket ID code | 20px   | `--radius-xs` | `--stone-100`      | `--border-default` | 11px mono |

---

## 4. Page-by-page migration map

How current files translate. Each page must be reduced to **zero hardcoded colors and zero local font declarations** in a follow-up pass.

### 4.1 `index.css` — global

- Keep `@import "tailwindcss"`, `@import "@fontsource-variable/inter"`, the two `@keyframes` (`teams-drawer-in`, `teams-slide-up`).
- **Replace** the current `:root` block with the token definitions from §2.
- Move all `notifications-*`, `dashboard-*`, `tickets-*` page-scoped CSS into per-component Tailwind utilities consuming the new tokens. (Already done for teams.)
- Preserve `@theme inline { … }` but rewrite to map each Tailwind utility to a semantic token (e.g. `--color-background: var(--surface-page)`, `--color-foreground: var(--ink-1)`, `--color-primary: var(--action-bg)`, `--color-border: var(--border-default)`).

### 4.2 Teams

Replace the hardcoded hex pass it's running on now:

| Current arbitrary class                         | Replace with                  |
|-------------------------------------------------|-------------------------------|
| `bg-[#FAFAF8]`                                  | `bg-[--surface-page]`         |
| `bg-[#F5F4F0]`                                  | `bg-[--surface-sunken]`       |
| `border-[#E8E6E1]`                              | `border-[--border-default]`   |
| `border-[#F0EEE9]`                              | `border-[--border-subtle]`    |
| `text-[#1A1917]`                                | `text-[--ink-1]`              |
| `text-[#78756E]` / `text-[#A8A49C]`             | `text-[--ink-3]` / `text-[--ink-4]` |
| `bg-[#C4642A]` / `hover:bg-[#A8521E]`           | `bg-[--action-bg]` / hover `--action-bg-hover` |
| `text-[#B83A2A]` + brick tints                  | destructive button variant    |
| `bg-[#F5F0E6]` admin info callout               | `bg-[--status-warn-bg] text-[--status-warn-fg]` |
| `bg-[rgba(184,58,42,0.08)] border-[rgba(184,58,42,0.25)] text-[#B83A2A]` (Expired pill) | `bg-[--status-danger-bg] border-[--status-danger-border] text-[--status-danger-fg]` |
| `RolePill` color records in `lib/teamsComponent.ts` | swap to `--role-{role}-{bg/fg/border}` tokens |
| `shadow-[0_1px_3px_rgba(26,25,23,0.06),...]`   | `shadow-[--elev-1]`           |

### 4.3 Tickets

Tickets is a dense operator table, so layout accuracy matters more than decorative cards.

1. Header row: title, search, primary action.
2. View row: saved/default views only.
3. Filter row: status/priority/category/assignee/date/grouping/density controls.
4. Table row template must be shared by header and body. Do not hand-tune header/cell widths separately.
5. Priority strip is a visible left rail (`w-1` minimum), not a hairline.
6. Repeated Tailwind strings live in `apps/web/src/components/tickets/styles.ts`.

### 4.4 Notifications

Heaviest lift. Currently 600+ lines of hand-rolled CSS with inline `oklch()` and pixel rems mixed.

- Rewrite component as Tailwind utilities (mirror the Teams pattern from earlier work).
- Map every `oklch(0.55 0.023 264)` → `--ink-3`, `oklch(0.18 0 0)` → `--ink-1`, `oklch(0.93 0.006 264)` → `--border-default`, `oklch(0.967 0.003 264)` → `--surface-sunken`, `oklch(0.67 0.14 48.5)` → `--action-bg`, etc.
- The cool blue-gray cast (`oklch(... 264)`) must shift to warm stone — that is a deliberate aesthetic correction.
- Replace `font-family: "Geist Mono", ...` declarations with the global mono default.

### 4.5 Dashboard

- Page bg `#FAFAF8` → `--surface-page`. Card border `#E8E6E0` → `--border-default`.
- Keep Inter Variable as the *opt-in* font for dashboard hero metrics only — wrap the metric numbers in `font-[--font-sans]`. Default the rest of the page to mono so it stops looking like a different app.
- Donut/sparkline accents → `--action-bg` for primary, `--slate-500` for secondary, status tokens for state-coded slices.
- Scrollbar custom colors → `--border-default` track / `--border-strong` thumb.

### 4.6 Messages

Messages is an operational inbox:

- Left pane uses the same header contract, filter-chip style, and row density as tickets.
- Right pane is a ticket conversation workspace. Empty state should be quiet but bounded by the same page surface, not a blank consumer-chat canvas.
- Conversation bubbles may exist, but they should be restrained, rectangular, and metadata-forward.
- Keep composer controls compact and ticket-context oriented.

### 4.7 `App.css`

This is Vite scaffolding (`.hero`, `#center`, `#docs`, `#next-steps`). It is unused by the actual app shell. **Delete in the migration pass** unless something still imports it (verify with grep). If it stays, replace `var(--accent)` etc. with `--action-bg` / `--action-tint-bg`.

---

## 5. Implementation rules (linting checklist)

Treat these as hard rules. A PR violating any of them should be sent back.

1. **No hex codes in components.** Tailwind arbitrary values like `bg-[#1A1917]` are banned outside `index.css`.
2. **No `oklch(...)` literals in components.** Same reason.
3. **No new font-family declarations.** Default mono is set globally; opt into sans via `font-[--font-sans]` only.
4. **No new border-radius values outside §2.5.** Use the named scale.
5. **No `style={{ ... }}` for visual properties** — Tailwind utility consuming a token, or a token directly.
6. **No `box-shadow` literals** — use `--elev-{n}`.
7. **Status-coded UI consults the status token map.** No reinventing red/green per page.
8. **Z-index uses the §2.8 scale.** No magic numbers.
9. **Animations gate on `prefers-reduced-motion`.**
10. **Page-scoped CSS classes (`.tickets-*`, `.notifications-*`) are deprecated.** New work uses Tailwind utilities. Old pages migrate page-by-page.

---

## 6. Out of scope (future)

- Dark mode token set. The current `.dark` block in `index.css` is shadcn-default and incoherent with this system. Will be redesigned as a separate pass once the light system is migrated everywhere.
- Density modes (comfortable / compact). Tickets has the hooks for it; design pass deferred until two pages need it.
- Charts color ramp. The `--chart-1..5` set will be reworked to a deliberate sequential + categorical pair when the dashboard migration starts.

---

## 7. Single-page Claude reading order

When Claude needs to understand styling for a task, read in this order, then stop:

1. `docs/web/design.md` (this file) — vocabulary and rules.
2. `apps/web/src/index.css` — token definitions and `@theme inline` mapping.
3. The specific component file under `apps/web/src/components/...` you're touching.

You do **not** need to read `App.css`, the per-page CSS prefixes, or the shadcn primitives unless the task specifically targets them.
