---
description: Create a new planning task file under tasks/ with the standard template.
argument-hint: [task title]
---

Create a new task file in `tasks/` following the standard shape.

Arguments: `$ARGUMENTS` — may be the task title, empty, or a longer sentence.

## How to do it

1. **Figure out the title.**
   - If `$ARGUMENTS` is non-empty, treat it as the task title (trim whitespace, strip surrounding quotes).
   - If `$ARGUMENTS` is empty, ask the user for the title and wait for their reply before continuing.

2. **Derive the filename.** Slugify the title to kebab-case: lowercase, ASCII only, words separated by `-`, drop punctuation, collapse repeats. Append `.md`. Example: `"Wire up third-party API"` → `wire-up-third-party-api.md`.

3. **Check for collisions.** Use `Glob` with `tasks/*.md`. If a file with the derived name already exists, stop and tell the user — ask whether to overwrite, pick a different name, or open the existing one. Do **not** silently overwrite.

4. **Gather the essentials from the user.** In one message, ask for:
   - A one-sentence **goal** (what does "done" look like?).
   - Any **known context** (links to related files, spec sections, existing code that's relevant) — optional, user can say "none".

   Wait for the reply. Do not invent these — if the user gives short answers, use them as-is rather than padding.

5. **Write the file** to `tasks/<slug>.md` using the template below. Leave sections empty with a short `_TBD_` placeholder when the user didn't provide content; don't fabricate.

6. **Confirm** in one short sentence: `Created tasks/<slug>.md.` No further commentary. Do not offer to commit — committing is the user's call.

## Template

```markdown
# <Title>

**Status:** Planned
**Source:** <spec section / issue / conversation context, or _TBD_>

## Goal

<one-sentence goal from the user>

## Current state

_TBD_

## Scope

### In

- _TBD_

### Out (explicitly not this task)

- _TBD_

## Implementation notes

_TBD_

## Acceptance criteria

- [ ] _TBD_

## Open questions

- _TBD_
```

## Rules

- Never write outside the `tasks/` folder.
- Never overwrite an existing task file without explicit user confirmation.
- Do not stage or commit the file — just create it and report the path.
- Keep the new file minimal. A short, honest task file is better than a long speculative one.
