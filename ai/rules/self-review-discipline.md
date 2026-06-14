---
description: Before opening a PR, adversarially self-review your own diff for duplication, over-specific code, and sprawling decision logic — not just typos. Propose, don't rubber-stamp; read-only.
---

## Self-review discipline

- **Review your own change before handing it off.** Before opening a PR (or asking for review), do a demanding senior-reviewer pass over your full diff — `git diff <base>...HEAD` plus any uncommitted work.
  - **Why:** the cheapest place to catch duplication, wrong-altitude code, and sprawling logic is before anyone else spends attention on it. A self-review that finds the obvious things lets the human review focus on judgement calls.
  - **How to apply:** read the **full** changed files, not just the hunks — and open anything the change references (a type, a constant, a sibling module). A hunk can look fine while the file around it tells a different story.

- **Judge against substance, not surface.** Look past typos for the things that actually rot a codebase, in roughly this priority: spec/intent match · single source of truth (no duplication) · decision logic centralised so a new case is a one-line change · right altitude (not one `if` per case) · layering (thin entry points, data access in the data layer, injected clients) · explicit boundary types and no `any` · fail-soft IO that still surfaces real errors · input validated at the edge · consistency with surrounding idioms · no dead weight · scope matches the request · tests test behaviour, not implementation.
  - **Why:** a clean-looking diff can still duplicate a constant, hardcode a case that will multiply, or smuggle business logic into a route. Those are the findings that matter.
  - **How to apply:** for each file ask "what's the strongest objection?", not "does it look ok?". When you see a hardcoded `=== 'specific-value'` or an if-chain that grows per case, propose the helper/table that makes the next case a one-line change.

- **Make every finding actionable, ordered by severity.** State `blocker` / `should-fix` / `nit`, give `path:line`, the problem in one sentence, then the concrete suggestion (or a sharp question if it's a genuine judgement call).
  - **Why:** a vague "this feels off" wastes the reader's time; "extract `isReadable(file)` so a new format is one place to change" can be acted on immediately.
  - **How to apply:** pair the review with a short reviewer guide — read order (dependency order, not alphabetical), the 2–3 files carrying real risk, the gate command, and the one real-world check that proves behaviour.

- **Never rubber-stamp, never silently edit.** If you find nothing of substance, say so plainly and name the two or three things you checked and why they're fine. The review proposes — it does not edit, commit, or push.
  - **Why:** an approval with no scrutiny is worse than no review; and a review that quietly rewrites the code takes the decision away from the author.
  - **How to apply:** output findings + reviewer guide and stop. Let the author decide what to change.
