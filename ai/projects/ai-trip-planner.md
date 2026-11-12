---
description: Personal (non-team) instructions for ai-trip-planner (Reelsinary) — every PR ships annotated before/after screenshots (or an explicit "no visible change" line) and a product-vs-dev code split table; loaded via a gitignored CLAUDE.local.md stub, never checked into the repo
---

## ai-trip-planner — personal notes

Repo: `~/Documents/development/ai-trip-planner` · remote `https://github.com/matejkepes/ai-trip-planner.git` · SvelteKit + Supabase edge fns · npm · PRs into `master`, Matej reviews and merges.

These are **my** rules. The team's rules live in the repo's `CLAUDE.md` and `.claude/rules/` — do not restate them here.

### Every PR description carries annotated screenshots — or says why it has none

Every PR I open here has a `## Screenshots` section. A PR with any visible change fills it with annotated before/after pairs per the global `pr-screenshots` rule. A PR with no visible change still gets the section, with one line: `No visible change — <why: edge fn only / refactor / tests>.`

- **Why:** Matej reviews every PR alone, often on a phone. A pair with numbered marks lets him check the UI without checking out the branch. The explicit "no visible change" line tells him the screenshots were not forgotten.
- **How to apply:**
  1. Take two pairs per screen: **1440px and 390px**. That is the repo's own screenshot width rule (`.claude/rules/screenshot-harness.md`). It is stricter than the global "≥ 1280px".
  2. Seed the data with the throwaway-map harness from that same file (`tests/e2e/helpers/supabase.js`, `E2E—` title prefix, `cleanup()` afterwards). Use the same map for "before" (detached `origin/master`) and "after".
  3. A component that only changed inside Storybook (`npm run storybook`, port 6006) can be shot from its story instead of the app.
  4. Annotate with the `annotated-screenshots` skill. Upload as GitHub PR attachments. Specs and PNGs stay in `.review-shots/` and are never committed.

### Every PR description carries a product-vs-dev code split

Every PR I open here has a `## Code split` table. It shows how many changed lines are product code (what ships) and how many are dev code (tests, stories, mocks, tooling). Generate it, never count it by hand:

```sh
~/.ai/projects/ai-trip-planner/pr-code-split.sh            # base: origin/master
~/.ai/projects/ai-trip-planner/pr-code-split.sh origin/<base>   # PR into another branch
```

- **Why:** this repo writes a story and play tests for most components. A "+1800 lines" PR is often half Storybook and tests. The split shows the reviewer how much real product logic to read.
- **How to apply:**
  1. Run it from the branch, after `git fetch`, right before `gh pr create`. Paste its output verbatim as the `## Code split` section, below the summary and above `## Screenshots`.
  2. Re-run it and update the PR body when commits are pushed after the PR is open (`gh pr edit <n> --body-file`).
  3. Buckets, by path (the `classify()` case in the script is the source of truth):
     - **tests:** `*.test.*`, `*.spec.*`, `*.itest.*`, `tests/`, `supabase/itests/`, vitest/playwright config
     - **stories:** `*.stories.svelte`, `.storybook/`
     - **mocks:** `__mocks__/`, `mock/`, `*fixture*`, `public/mockServiceWorker.js`
     - **tooling:** `scripts/`, `tools/`
     - **product:** everything else
  4. Docs (`docs/`, `design/`, `*.md`) and lockfiles are listed under the table but left out of the percentage.
  5. If a file lands in the wrong bucket, fix `classify()` in the script, not the numbers in the PR.
