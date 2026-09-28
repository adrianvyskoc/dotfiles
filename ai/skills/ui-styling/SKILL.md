---
name: ui-styling
description: How to style UI components against a design system — token tiers (primitive → semantic → component) and where to find the project's tokens, spacing and type scales, the interactive state matrix every component must cover (hover, active, focus-visible, disabled, loading, selected, invalid), variants via CVA-style `variant × size × tone`, dark mode through semantic tokens, contrast and "never color alone", mobile-first responsive + touch targets, motion tokens + reduced motion, skeletons without layout shift. Use when writing or changing the visual side of a component, view or page (Tailwind, CSS modules, scoped CSS, styled objects), when adding a variant or a theme, or when a component "works but looks off".
user_invocable: true
---

# UI Styling

How to give a component its visual side so it fits the project's design system on the first pass. `frontend-development` says tokens are mandatory and every interactive element needs focus and semantics; this skill is the **how**: which token, which states, which variant shape, which breakpoints. Examples use Tailwind + CVA and CSS custom properties; the rules map 1:1 to CSS modules, scoped CSS or a theme object.

## Core Rules

1. **Find the tokens before writing a class.** Every project has one token source (`@theme` block, `tailwind.config`, `tokens.css`, a theme object). Read it first; style only with what it defines.
2. **Semantic over primitive.** `bg-surface-raised` / `var(--color-surface-raised)`, not `bg-gray-100` / `#f3f4f6`. Primitive tokens exist to define semantic ones, not to be used in components.
3. **Scale steps only.** Spacing, radius, font size, shadow and z-index come from the scale. A value between two steps is a design decision, not a CSS tweak — report it, don't invent it.
4. **Every interactive component covers the state matrix.** Default, hover, active, focus-visible, disabled, loading, selected/checked, invalid. A component missing a state it can be in is not done.
5. **Variants are a closed set, declared in one place.** `variant × size × tone` through CVA (or the project's equivalent), with defaults and compound variants. No `class` passthrough as the primary API.
6. **Dark mode lives in the tokens.** Components use semantic tokens that already switch; `dark:` sprinkled per element is a smell that means a token is missing.
7. **Never meaning by color alone.** Error, success, selected and disabled also differ by icon, text, weight, border or opacity.
8. **Mobile-first, content-sized.** Base styles for the smallest screen, breakpoints add. No fixed widths on content; minimum interactive target 44×44 CSS px.
9. **Motion from tokens, and optional.** Durations and easings are tokens; animate only `transform` and `opacity`; respect `prefers-reduced-motion`.
10. **Loading looks like loaded.** Skeletons and placeholders take the exact final dimensions. Zero layout shift between states.

---

## 1. Tokens

Three tiers, one direction of reference:

| Tier | Example | Who uses it |
|------|---------|-------------|
| **Primitive** | `--blue-600`, `--space-4`, `--radius-2` | Only semantic tokens |
| **Semantic** | `--color-surface-accent`, `--color-text-muted`, `--space-inset-md` | Components, layouts |
| **Component** | `--button-bg`, `--input-border` (optional tier) | One component, defined from semantic |

**Where to look, in order:** `@theme` / `tailwind.config.*` → `tokens.css` / `theme.ts` / `variables.scss` → the `ui/` Button or Input (whatever the library's base component uses is the de-facto set). If two components disagree, the token file wins.

```css
/* ❌ BAD — primitive in a component, raw values, one-off number */
.card { background: var(--gray-50); border: 1px solid #e5e7eb; padding: 14px; }

/* ✅ GOOD — semantic tokens, scale steps */
.card {
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border-subtle);
  padding: var(--space-4);
}
```

**Missing token?** Do not add a primitive and do not hard-code. Use the closest semantic token and report the gap as an open question ("needs `--color-surface-warning`, used `--color-surface-accent`"). Adding tokens is a design-system change, not a feature-task side effect.

## 2. Spacing and typography scales

- **Layout spacing via `gap`**, not margins on children. Margins leak; gap is owned by the parent.
- **Inset (padding) and stack (gap) use the same scale.** A component with `p-4` and `gap-3` inside is fine; `p-[14px]` is not.
- **Type roles, not sizes.** `heading-lg`, `body`, `label`, `caption` (or the project's names). A role fixes size, line-height, weight and letter-spacing together — never set `font-size` alone.
- **Line length** for reading text: `max-w-prose` or the project's measure token, never unlimited.

```tsx
// ❌ BAD — arbitrary values, margin soup, size without role
<h2 class="text-[17px] font-semibold mb-[6px]">…</h2>
<p class="text-sm mb-3">…</p>

// ✅ GOOD — roles + gap
<div class="flex flex-col gap-2">
  <h2 class="text-heading-sm">…</h2>
  <p class="text-body-muted">…</p>
</div>
```

## 3. The state matrix

Every interactive component declares what it does in each state. Use this table in the component (comment or docs) and in review:

| State | Must change | Typical token |
|-------|------------|---------------|
| default | — | `--*-bg`, `--*-fg` |
| hover | surface or fg | `--color-surface-accent-hover` |
| active / pressed | surface, slight scale or inset | `--color-surface-accent-active` |
| focus-visible | ring, never removed | `--ring-focus` (`focus-visible:ring-2 ring-focus`) |
| disabled | opacity + cursor + no hover | `--opacity-disabled`, `cursor-not-allowed` |
| loading | spinner/skeleton, pointer-events off, **same size** | `aria-busy`, `--*-fg-muted` |
| selected / checked | surface + icon or weight | `--color-surface-selected` + check icon |
| invalid | border + message + icon | `--color-border-danger`, `aria-invalid` |

- `focus-visible`, not `focus`: mouse users don't get a ring, keyboard users always do. `outline: none` without a replacement ring is a bug.
- `disabled` also kills `hover` and `active`; check the cascade order.
- `loading` must not change the element's box. Reserve the spinner's space or overlay it.

```tsx
// ❌ BAD — hover only, focus ring removed, disabled still hovers
<button class="bg-primary hover:bg-primary-hover outline-none disabled:opacity-50">

// ✅ GOOD — full matrix, disabled cancels hover, visible focus
<button class="bg-primary text-on-primary
  hover:bg-primary-hover active:bg-primary-active
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2
  disabled:opacity-disabled disabled:cursor-not-allowed disabled:hover:bg-primary
  aria-busy:pointer-events-none">
```

## 4. Variants

One component, closed axes, one definition:

```ts
// ✅ GOOD — ui/Button/button.variants.ts
export const button = cva(
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ' +
  'disabled:opacity-disabled disabled:pointer-events-none',
  {
    variants: {
      variant: { solid: '', outline: 'border', ghost: 'bg-transparent' },
      tone:    { neutral: '', primary: '', danger: '' },
      size:    { sm: 'h-8 px-3 text-label-sm', md: 'h-10 px-4 text-label', lg: 'h-12 px-6 text-label-lg' },
    },
    compoundVariants: [
      { variant: 'solid',   tone: 'primary', class: 'bg-primary text-on-primary hover:bg-primary-hover' },
      { variant: 'solid',   tone: 'danger',  class: 'bg-danger text-on-danger hover:bg-danger-hover' },
      { variant: 'outline', tone: 'primary', class: 'border-primary text-primary hover:bg-primary-subtle' },
    ],
    defaultVariants: { variant: 'solid', tone: 'neutral', size: 'md' },
  },
);
```

- **Axes are orthogonal.** `variant` = shape (solid/outline/ghost), `tone` = meaning (neutral/primary/danger), `size` = scale. Colors for a combination go in `compoundVariants`, never in the consumer.
- **Defaults declared**, so `<Button>` with no props renders the common case.
- **`class` passthrough is for layout only** (`class="w-full"`), never for recoloring. If a consumer needs a new look, that's a new variant in the library.
- **Same axes across the library.** If Button has `tone`, Badge and Alert use `tone` with the same values, not `color` or `intent`.

```tsx
// ❌ BAD — consumer re-skins via class, invents a look the library doesn't have
<Button class="bg-orange-500 text-white hover:bg-orange-600">Warn</Button>

// ✅ GOOD — a `warning` tone added to the library, then used
<Button tone="warning">Warn</Button>
```

## 5. Color, contrast, dark mode

- **Text ≥ 4.5:1** against its surface, large text and UI borders ≥ 3:1. Semantic pairs guarantee this: `text-on-primary` on `bg-primary`, never `text-white` on whatever.
- **Pair tokens, don't mix tiers.** A surface token always has a matching foreground token (`surface-accent` ↔ `text-on-accent`).
- **Dark mode = token swap.** Semantic tokens change value under `[data-theme="dark"]` / `prefers-color-scheme`; components stay untouched. `dark:bg-gray-800` in a component means the surface token is wrong or missing.
- **Never color alone.** Invalid input: red border **and** message **and** icon. Selected row: tinted surface **and** check/weight. Disabled: opacity **and** cursor **and** `aria-disabled`.

```tsx
// ❌ BAD — raw colors, per-element dark variants, meaning by color only
<span class="text-red-500 dark:text-red-400">Required</span>

// ✅ GOOD — semantic tokens (already dark-aware), icon carries the meaning too
<span class="text-danger inline-flex items-center gap-1"><AlertIcon aria-hidden /> Required</span>
```

## 6. Layout and responsive

- **Mobile-first:** unprefixed classes are the small-screen truth; `md:` / `lg:` add.
- **Content decides width.** `max-w-*`, `min-w-0` on flex children, `w-full` on inputs. Fixed `w-[320px]` only on things that are genuinely fixed (avatars, icons).
- **Overflow is handled, not hoped.** Long text: `truncate` or `line-clamp-*` with `title`; tables: horizontal scroll container; never `overflow: hidden` on something that must be readable.
- **Touch targets 44×44 min.** Pad the hit area (`p-2 -m-2`), keep the icon size.
- **Container queries** (`@container`) for components reused in sidebars and main areas; viewport breakpoints for page layout.
- **Check the extremes before finishing:** 320 px wide, 200 % zoom, a 3-line title, an empty list, an RTL locale if the project ships one.

## 7. Motion

- Durations and easings from tokens: `duration-fast` / `duration-base`, `ease-out` / `ease-emphasized`. No `duration-[230ms]`.
- Animate `transform` and `opacity` only. Height/width animations need a measured technique (grid `0fr→1fr`), not `transition: height`.
- Every animation has a `motion-reduce:` fallback, at minimum `motion-reduce:transition-none`.
- Enter faster than exit? No: enter ≈ 150–250 ms, exit shorter than enter. Hover feedback ≤ 150 ms.

```tsx
// ✅ GOOD
<div class="transition-[opacity,transform] duration-base ease-out motion-reduce:transition-none
            data-[state=open]:opacity-100 data-[state=closed]:opacity-0 data-[state=closed]:translate-y-1">
```

## 8. Loading, empty, error — visually

- **Skeleton = final layout.** Same heights, same gaps, same count of rows as a typical response. Reuse the real component with a `skeleton` prop where possible.
- **No layout shift.** Reserve image aspect ratios (`aspect-[4/3]`), fixed row height for lists, min-height on async containers.
- **Empty and error states are components in `ui/`** (`EmptyState`, `ErrorState`) with icon + title + optional action, consistent across the app. Features pass text, never restyle.
- **Inline over modal.** Field errors under the field, list errors in the list area, toast only for things unrelated to what the user is looking at.

## Definition of done — styled

- [ ] Only tokens and scale steps; no hex, no `[13px]`, no `dark:` on components
- [ ] Every state in the matrix visibly handled; `focus-visible` ring present
- [ ] Variants declared in the library with defaults; consumer passes props, not classes
- [ ] Contrast pairs used (`surface-x` ↔ `on-x`); meaning never by color alone
- [ ] Renders at 320 px, with 3-line text, with an empty list; touch targets ≥ 44 px
- [ ] Motion tokens + `motion-reduce` fallback
- [ ] Skeleton matches final dimensions; no layout shift

## Common Mistakes to Avoid

| Wrong | Right |
|-------|-------|
| `bg-gray-100`, `#e5e7eb`, `p-[14px]` | Semantic token, scale step |
| `dark:bg-gray-800` on a component | Surface token that switches under the theme |
| `hover:` only | Full state matrix incl. `active`, `focus-visible`, `disabled` |
| `outline-none` | `focus-visible:outline-none focus-visible:ring-2 ring-focus` |
| Spinner replaces button label, button shrinks | Reserve space; `aria-busy`, same box |
| `<Button class="bg-orange-500">` | New `tone` in the library |
| `color`, `intent`, `kind` across components | One axis name (`tone`) with the same values everywhere |
| `w-[320px]` on a card | `max-w-*` / `w-full`, content decides |
| Red border as the only error signal | Border + message + icon + `aria-invalid` |
| `transition-all duration-[230ms]` | `transition-[opacity,transform] duration-base motion-reduce:transition-none` |
| Skeleton with 3 generic bars | Skeleton with the final layout's rows and heights |
| Adding a primitive token to fix one screen | Use the closest semantic token, report the gap |
