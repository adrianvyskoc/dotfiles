---
name: annotated-screenshots
description: Produce review screenshots with a red arrow, outline and numbered badge pointing at the exact element that is off — the way colleagues mark design mismatches in code review. Works on a live page (CSS selector → pixel-exact box from the DOM) or on an existing image such as a Figma export (explicit box). Use during a design/UI review, when verifying a frontend change against a design, or when the user asks to "show where it's wrong", "mark it on a screenshot", "pridaj šípku".
user_invocable: true
---

# Annotated screenshots

Visual evidence for a UI finding: one PNG per finding (or per group of findings on the same screen), with a red arrow, an outline around the offending element and a numbered badge that matches the finding in the report.

The script draws from the **DOM**, not from eyeballed pixel coordinates — a selector gives the exact bounding box, so the arrow lands on the element every time. Never guess coordinates on a live page; use a selector.

## Prerequisites

- **A running page URL.** The user usually gives it in the task / MR description (`localhost:3000/...`, a review app, staging). Look there first. No URL → skip screenshots and say so in one line; do not start a dev server on your own.
- **Playwright.** The script uses the project's own `playwright` if installed, otherwise the pinned copy in `~/.cache/annotate-shots`. If neither exists, it prints the one-time install command — show it to the user, don't install silently.

## Output location — NEVER commit

- Write every PNG and spec to **`.review-shots/`** at the repo root.
- `.review-shots/` is **never committed**, never staged, never pushed — not even when the user approves a commit of other files. It is in the global git ignore (`~/.config/git/ignore`); if `git status` ever shows it, stop and tell the user instead of adding it.
- Name files `NN-<short-slug>.png` (`01-trial-card-spacing.png`), numbered in report order.

## How to run

1. Pick the selector for each finding. Prefer stable hooks: `data-testid`, a component class, a role (`[role="dialog"] button`). Check it matches exactly one element.
2. Write a spec to `.review-shots/specs/NN-<slug>.json`:

   ```json
   {
     "url": "http://localhost:3000/pricing",
     "out": ".review-shots/01-trial-card-spacing.png",
     "viewport": { "width": 390, "height": 844 },
     "colorScheme": "dark",
     "waitFor": ".trial-card",
     "marks": [
       { "label": "1", "selector": ".trial-card", "from": "top-right" },
       { "label": "2", "selector": ".trial-card button", "from": "bottom-left" }
     ]
   }
   ```

3. Run it:

   ```bash
   node ~/.ai/skills/annotated-screenshots/scripts/annotate.mjs .review-shots/specs/01-trial-card-spacing.json
   ```

4. **Look at the PNG** (Read it) before citing it. If the arrow covers the problem or points at the wrong element, change `from` or the selector and rerun.
5. Cite it in the finding: `**Card.vue:42** — gap above trial card 8 px, design 16 px. [shot: .review-shots/01-trial-card-spacing.png #1]`.

## Spec reference

| Field | Meaning |
|---|---|
| `url` / `image` | live page, or absolute path to an existing PNG/JPG (Figma export, a colleague's screenshot) |
| `out` | output PNG path |
| `viewport` | default `1440×900`; use `390×844` for mobile findings — match the breakpoint where the bug shows |
| `colorScheme` | `light` / `dark`, when the bug is theme-specific |
| `storageState` | Playwright auth state JSON for pages behind login |
| `waitFor` | selector to await before drawing |
| `crop` | `marks` (default — crop around marks + padding), `viewport`, `full` |
| `marks[].selector` | live page: CSS selector of the element |
| `marks[].box` | image mode: `{x, y, width, height}` in image pixels |
| `marks[].from` | side the arrow comes from: `top-left` · `top-right` (default) · `bottom-left` · `bottom-right` — pick the side with empty space |
| `marks[].label` | badge text, matches the finding number |

Stdout is JSON: the output path and per-mark `ok` / `error`. A missing selector is reported, not fatal — fix it, don't ship a shot with a missing mark.

## Rules

- **One screen per shot.** Several marks on one PNG are fine when they are on the same screen; findings on different screens get separate files.
- **Only real findings.** A screenshot illustrates a finding that stands on its own in text; it never replaces `file:line` and the reason.
- **Design comparison needs the design.** "Doesn't match Figma" requires the Figma node (export or `get_screenshot`). Annotate the Figma image too (`image` mode) when the difference is not obvious from the live shot alone.
- **Read-only for the app.** The script only injects an overlay into its own headless browser — it never changes app code or state. Don't click through flows that mutate data to reach a screen.
