---
name: frontend-stack
description: The default frontend tech stack — Vue 3 + Nuxt (Vite SPA for small tools), TypeScript, Tailwind CSS + CVA, custom ui/ components with headless primitives when needed, Pinia + TanStack Query, thin fetch wrapper, VeeValidate + Zod, VueUse, vue-i18n, Vitest + Playwright, pnpm, ESLint + Prettier. Use when scaffolding a frontend project, adding a frontend dependency, or choosing a library/tool for frontend work.
user_invocable: true
---

# Frontend Stack

This skill pins **what** to use. **How** to build with it (component layers, ui/ library discipline, design tokens, async states, naming, a11y) lives in the `frontend-development` skill — follow both, and never restate its rules here.

## Defaults

| Area | Choice | Notes |
|------|--------|-------|
| Framework | Vue 3 | Composition API + `<script setup>`, TypeScript everywhere, `strict: true` |
| App shell | Nuxt | Default for applications; small SPAs/tools use plain Vue + Vite |
| Styling | Tailwind CSS | v4 CSS-first config; design tokens as CSS custom properties in `@theme` |
| Variants | CVA (class-variance-authority) | Component variants defined with CVA, exposed as a closed set of props |
| Components | Custom `ui/` library | No component kit. Headless primitives (Reka UI / Ark UI) allowed for hard widgets: dialog, combobox, popover |
| Client state | Pinia | Only for genuinely app-wide state — auth/session, theme, feature flags |
| Server state | TanStack Query (Vue) | Cache, retries, invalidation; never mirrored into Pinia |
| HTTP | Thin typed `fetch` wrapper | No axios. In Nuxt it may delegate to the built-in `$fetch`; either way it lives in the API layer only |
| Forms | VeeValidate + Zod | `@vee-validate/zod` `toTypedSchema`; the Zod schema is the single source of truth |
| Composables | VueUse | Check VueUse before writing a custom composable |
| i18n | vue-i18n | `@nuxtjs/i18n` in Nuxt; user-facing strings go through i18n from day one |
| Unit/component tests | Vitest + Vue Test Utils | Pure logic and component behavior |
| E2E tests | Playwright | Critical user flows |
| Package manager | pnpm | |
| Lint/format | ESLint + Prettier | Flat config |

## Nuxt vs Vite SPA

- **Nuxt** is the default for applications: anything with pages/routing, auth, or room to grow. File-based routing, modules, and auto-imports pay off quickly.
- **Plain Vue + Vite** for small SPAs, internal tools, and widgets where SSR and the Nuxt module system add nothing — don't drag Nuxt in.

## How this maps to `frontend-development`

That skill leaves tool slots open on purpose; this stack fills them:

- "hooks/composables" → Vue composables (`use*`)
- "TanStack Query or the project's equivalent" → TanStack Query (Vue)
- "Zod/Valibot/Yup style schema" → Zod, wired to the UI via VeeValidate
- "styling tool per-project" → Tailwind; tokens live in the Tailwind theme as CSS variables
- "variants via props" → implemented with CVA
- "typed API layer" → the fetch wrapper + one typed function per endpoint

## Rules

- **Don't add stack alternatives silently.** If a task seems to need something outside this list (axios, a component kit, another form library), propose it with a reason instead of just installing it.
- **Scaffold lean.** New projects start with pnpm + Nuxt/Vite + TypeScript strict + ESLint/Prettier + Tailwind. Add Pinia, TanStack Query, and VeeValidate when first needed, not preemptively.
- **Latest stable majors.** No legacy patterns in new code: no Options API, no Webpack, no Tailwind ≤3 JS config files.
