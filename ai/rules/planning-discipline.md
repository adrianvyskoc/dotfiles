---
description: Every feature plan must lead with the goal, show a file tree with line deltas, call out type/scope changes, list risks and follow-ups, and surface open questions before execution
---

## Planning discipline

When producing a feature plan (e.g. via ExitPlanMode, `tasks/<slug>.md`, or any "here's the plan" response), follow the structure below. Three sections are **required** on every plan; the rest are **conditional** with a clear trigger. Use the section headings literally so plans look consistent across the repo.

### Required sections

- **`## Goal` — lead with it.** The very first section is one short paragraph stating what the user gets when this plan is executed, in user-facing terms.
  - **Why:** without a goal anchored at the top, the rest of the plan reads as a pile of steps with no shared "done" condition.
  - **How to apply:** write the goal as an outcome, not a task list ("Users can filter the inbox by label" — not "add a filter dropdown to InboxView"). One paragraph max. Mention ancillary benefits here too if they're part of the value; don't repeat them in a separate "improvements" section.

- **`## File changes` — show the tree with deltas.** Tree of every file that is **new**, **modified**, or **deleted**, annotated with line counts: `+N / ~N / -N`. Mark each file with `[new]`, `[mod]`, or `[del]` so it's scannable.
  - **Why:** the tree is the single best signal of scope. It catches "this plan touches 14 files" before execution, not after.
  - **How to apply:** use a real tree, not a flat list. Line counts pre-execution are estimates — mark them as such (e.g. "~est"). After execution, reconcile against the actual diff. Example:
    ```
    src/
      features/
        inbox/
          InboxView.tsx       [mod]  ~40 / -5     (est)
          InboxFilters.tsx    [new]  +120         (est)
          useInboxFilter.ts   [new]  +60          (est)
        legacy/
          OldFilter.tsx       [del]  -180
    ```

- **`## Totals` — one-glance scope number.** Summarize the whole plan: `+<added> / ~<modified> / -<deleted>` lines, and the count of files in each bucket.
  - **Why:** lets the user gut-check scope at a glance — "is this a 200-line change or a 2000-line one?"
  - **How to apply:** the file tree is the source of truth; Totals is a derived summary. If they disagree, fix the tree first, then re-sum. Mark as `(est)` pre-execution; update with actuals after.

### Conditional sections

Include these only when their trigger fires. If you skip one, you don't need to write "N/A" — the absence is the signal.

- **`## Open questions` — include when anything is unresolved.** Things the planner is unsure about and needs the user to answer *before* execution: library choice, naming, edge-case behavior, scope boundaries.
  - **Why:** without this section, ambiguity gets resolved silently mid-execution and only surfaces in the diff. Better to block on the question now than rewrite later.
  - **How to apply:** one line per question, phrased so the user can answer in one word or sentence. Do not start execution until they're answered (or explicitly deferred).

- **`## Out of scope` — include when there's a likely "I assumed this was included" surprise.** Explicit non-goals — things the reader might reasonably expect to be in this plan but aren't.
  - **Why:** different from Follow-ups (deferred work that will happen later). Out of scope is "we're not doing this here, period — it's a separate decision."
  - **How to apply:** one line per item. If nothing comes to mind, skip the section.

- **`## Types` — include when any type is added, modified, or removed.** For each **new** type: name, destination file, one-sentence purpose. For each **modified** type: name, file, explicit before/after note ("adds `archivedAt?: Date`", "renames `status` → `state`"). Call out modifications loudly.
  - **Why:** type changes propagate. A renamed field can cascade through dozens of call sites; the user wants to see that risk before approving the plan.
  - **How to apply:** never bury a type change inside a prose paragraph. If types don't change, omit the section.

- **`## Execution order` — include when sequencing matters.** Numbered phases for plans where steps have ordering constraints (migration before deploy, deploy before flag flip, type change before consumer updates, etc.).
  - **Why:** small plans don't need this; non-trivial ones break in production when steps run out of order.
  - **How to apply:** skip for small or order-independent plans. When included, each phase is one line: what + why it comes before the next.

- **`## Risks & gotchas` — include when there's a non-obvious failure mode.** Things that could break, edge cases to watch, migration sequencing, concurrency, anything the user should sign off on knowingly.
  - **Why:** plans that only describe steps hide the trade-offs. This forces the "what could go wrong" question.
  - **How to apply:** short bulleted list. Skip the section if there's genuinely nothing — but think twice before skipping.

- **`## Follow-ups` — include when work is intentionally deferred.** Things that are NOT in this plan but should happen after: cleanups deferred to a later PR, related improvements, tech-debt the work surfaced, doc updates.
  - **Why:** keeps the current plan focused while making sure next-step ideas are captured instead of silently pulled into scope.
  - **How to apply:** each follow-up is one line: what + why it's deferred. Do not implement these in the same plan — that's how a 200-line change becomes 2000.

### Suggested order

`Goal` → `Open questions` → `Out of scope` → `File changes` → `Types` → `Execution order` → `Totals` → `Risks & gotchas` → `Follow-ups`. Open questions and out-of-scope go near the top so the user can redirect before reading the detailed plan; totals come after the tree so the number is grounded in the file list it summarizes.
