---
description: Triage every multi-part task before code — scout + spec-analyst in parallel, a plan with an explicit split decision against fixed criteria, a human-approved contract before any parallel work, deterministic gates before LLM review, at most two blocking-only review rounds, and a retro log row per task
---

## Triage discipline

Triage is the orchestrator's job, not a subagent's. Subagents feed it compressed input; the orchestrator alone decides split/no-split, approves the contract (with the human) and owns the definition of done. Default is **one agent**; splitting must be justified in writing.

- **Run the triage flow before any implementation.** `codebase-scout` and `spec-analyst` in parallel (one message, two agents) → the plan → the split decision. Skip `spec-analyst` when there is no spec or design to read; never skip the scout.
  - **Why:** parallel implementers each building their own field/validation wrapper is a triage failure — nobody looked for what already exists or what several parts will share.
  - **How to apply:** the scout's `Reuse` and `Shared candidates` and the analyst's `Repeated components` and `Ambiguities` go into the plan verbatim. Any `Ambiguities` item goes to the human **before** code; do not resolve it yourself.

- **Split only if ALL four criteria hold.** (1) ≥3 work units touching disjoint files, (2) the contract between them can be written as code before implementation, (3) each unit needs only the contract, not another unit's implementation, (4) each unit is non-trivial. **Never split** bugfixes, cross-codebase refactors, discovery-heavy tasks or small tasks.
  - **Why:** every split costs a contract, a brief per unit, an integration step and a consistency risk. Below these criteria that overhead buys nothing and parallel parts drift apart.
  - **How to apply:** one failed criterion → single agent. Bulk-input and adversarial delegation (orchestration-discipline (b)/(c)) are not splits and stay allowed.

- **Write the plan to `tasks/<slug>.md` with the triage sections.** Planning-discipline still applies (Goal, File changes, Totals, Open questions for unknowns). Add these headings literally:
  - **Why:** a written split decision with per-criterion results is what makes the retro log tunable — "we split" without "because" teaches nothing.
  - **How to apply:**

    ```markdown
    ## Work units
    - <unit> — files: <paths> — reuses: <scout entries>

    ## Shared
    <components, state, types, schemas ≥2 units need — existing (path) or to create (→ contract)>

    ## Split decision: single | split
    - ≥3 units, disjoint files: ✅/❌ <why>
    - contract expressible as code: ✅/❌ <why>
    - units need only the contract: ✅/❌ <why>
    - each unit non-trivial: ✅/❌ <why>

    ## Contract
    <split only: exact paths contract-architect may write>

    ## Definition of done
    <runnable commands, e.g. `pnpm typecheck`, `pnpm lint`, `pnpm vitest run src/features/x`>
    ```

- **Split → contract-architect → human approval → implementation.** The orchestrator briefs `contract-architect` with the plan path; it writes only the `## Contract` paths, gets typecheck green and stops. Show the human the contract diff and wait for an explicit yes before spawning implementers.
  - **Why:** a wrong contract multiplies across every parallel unit; one human look at a short diff is the cheapest checkpoint in the whole flow.
  - **How to apply:** the approval is per task. A requested change goes back to `contract-architect` (or the orchestrator), then to the human again.

- **Implementers stay in their files; contract changes are escalated.** Each brief's `May edit` is that unit's file list from the plan; `Conventions` lists the scout's `Reuse` entries for that unit. An implementer that needs a contract change returns `blocked` with the gap — it never edits the contract.
  - **Why:** a unilateral contract edit silently breaks every sibling building against it.
  - **How to apply:** on `blocked`, the orchestrator decides: amend the contract (contract-architect, then human approval again if the shape changed) or re-scope the unit. Never forward a contract edit to an implementer.

- **Deterministic checks first, LLM review after.** Run the plan's definition-of-done commands (via `verifier`) until green, then spawn reviewers. Tell reviewers the gate is green so they don't re-run it.
  - **Why:** a reviewer reading a tree that doesn't typecheck spends its budget on what a compiler finds for free.
  - **How to apply:** gate → fix → gate, max two rounds (orchestration-discipline); only then review.

- **Review loop: only BLOCKERs trigger another round; max 2 fix rounds.** Round = fix → gate → re-review. Re-reviews receive the previous findings and check only those plus the fix diff. `IMPORTANT`/`MINOR` may be fixed in the same pass at the orchestrator's discretion; they never start a round.
  - **Why:** without an exit, every re-review surfaces fresh nits and the loop never ends.
  - **How to apply:** BLOCKERs still open after round 2 go to the human as open questions — no third round.

- **Append one row to the retro log after every triaged task.** File: `~/.ai/retro/triage-log.md`. Columns: date, project, task, split (yes/no + failed criteria), units, review rounds, manual fixes.
  - **Why:** the split criteria are a guess until data says otherwise; the log is what tunes them.
  - **How to apply:** at wrap-up, ask the human how many manual fixes they made or requested after "done" — your own count misses the ones they did outside the session. One row, no prose.
