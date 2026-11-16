---
description: Work on a task through the normal triage flow while keeping a live checklist file (scouting, implementation, gate, code/security/design review, wrap-up) updated as you go.
argument-hint: [task description or tasks/<slug>.md]
---

Do the task in `$ARGUMENTS` (or the current task in the conversation) the usual way — triage-discipline, orchestration-discipline, commit-discipline all still apply — and keep a **live checklist file** the user can open at any moment to see what is done and what is not.

## Checklist file

- **Path:** `tasks/checklists/<slug>-checklist.md`. `<slug>` is the kebab-case task name (same slug as `tasks/<slug>.md` if it exists). A subfolder keeps `/todos` output clean.
- **Exists already?** Resume from it — read it, continue at the first unchecked item. Never overwrite.
- **Create it first**, before any other work, with every phase below and its items. Phase 3 items are filled in after the plan exists.

## Item states

- `[ ]` not started · `[~]` in progress · `[x]` done · `[!]` blocked (say on what) · `[-]` skipped (say why, one line)
- Phases that do not apply (no UI → design review; no auth/input/data code → security review) stay in the file as `[-] N/A — <reason>`. Never delete a phase silently.

## Update protocol (the point of this command)

1. **Edit the file at every state change** — before starting an item set `[~]`, right after finishing set `[x]`. Not in batches, not at the end.
2. **Keep the header current:** `**Status:**`, `**Current phase:**`, `**Progress:** <done>/<total>` (skipped items count as done).
3. **Findings become items.** Each review finding is added under its review phase as `- [ ] [BLOCKER|IMPORTANT|MINOR] <file:line> — <one line>` and ticked when fixed or `[-]` with reason.
4. **Mention the file path** when you hand a phase over for review; do not paste the whole checklist into chat.

## Template

```markdown
# <Task title> — checklist

**Status:** In progress
**Current phase:** 1 Scouting
**Progress:** 0/<total>
**Plan:** tasks/<slug>.md (or _none_)

## 1. Scouting
- [ ] codebase-scout: reuse + shared candidates collected
- [ ] spec-analyst: screens, states, ambiguities (or `[-]` no spec)
- [ ] Ambiguities resolved with the user

## 2. Plan
- [ ] Plan written (Goal, File changes, Totals)
- [ ] Split decision recorded (single | split)
- [ ] Contract approved by the user (split only, else `[-]`)
- [ ] Definition of done listed (gate commands)

## 3. Implementation
<one item per work unit from the plan — files + what; add items as the plan firms up>

## 4. Gate
- [ ] typecheck · [ ] lint · [ ] tests (use the plan's commands)

## 5. Code review
- [ ] code-reviewer run on a green tree
<findings as items>

## 6. Security review
- [ ] security-reviewer run (or `[-]` N/A — reason)
<findings as items>

## 7. Design review
- [ ] design-reviewer run (or `[-]` N/A — no UI change)
<findings as items>

## 8. Wrap-up
- [ ] Fix rounds done (max 2); open BLOCKERs handed to the user
- [ ] PR screenshots annotated (visible changes only, else `[-]`)
- [ ] Retro row appended to ~/.ai/retro/triage-log.md
- [ ] Asked the user about commit
```

## Flow

Follow triage-discipline in order; each step maps to the phase above.

1. **Scouting** — `codebase-scout` + `spec-analyst` in parallel (skip the analyst when there is no spec).
2. **Plan** — write `tasks/<slug>.md` with the triage sections; fill Phase 3 items from its Work units.
3. **Implementation** — single agent by default; split only if all four criteria hold.
4. **Gate** — `verifier` until green (max 2 rounds).
5. **Reviews** — `code-reviewer`, then `security-reviewer` and `design-reviewer` when relevant, only after the gate is green. Max 2 fix rounds, BLOCKERs only.
6. **Wrap-up** — retro row, then ask about commit.

## Rules

- Never write outside `tasks/checklists/` for the checklist itself.
- The checklist never claims more than is true: do not tick an item that was not actually run or fixed.
- Do not stage or commit the checklist or anything else — ask first (commit-discipline).
- Keep it scannable: one line per item, no prose, no copied logs.
