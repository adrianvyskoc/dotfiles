---
name: self-review
description: Produce a high-signal, adversarial code review of the current change plus a short reviewer guide — run on your own work before opening a PR, or whenever a review is asked for. Catches duplication, over-specific code, and decision logic that will sprawl, not just typos.
user_invocable: true
---

# Self-review

A recipe for reviewing a change **as a demanding senior reviewer would** — the kind
of review that catches duplication, over-specific code, and decision logic that will
sprawl, not just typos. It produces two things: a list of **findings** and a short
**reviewer guide** the human can follow.

Use it on your **own** diff before opening a PR, and any time someone asks for a
review. It is read-only — it proposes, it does not edit or commit.

## 1. Get the change

```bash
git fetch origin --quiet
git diff origin/main...HEAD        # whole branch vs the base (use the PR base if not main)
git diff                           # plus uncommitted work, if reviewing pre-commit
git diff --stat origin/main...HEAD # scope at a glance
```

Read the **full** changed files, not just the hunks — a hunk can look fine while the
file around it tells a different story. For anything the change references (a type, a
constant, a sibling module), open it too.

## 2. Review against the lens

Go file by file, but judge against these — in roughly this priority. For each, ask
"what's the strongest objection?", not "does it look ok?".

1. **Spec / intent is king.** Does the change match the request and any design doc or
   spec the project keeps (e.g. a `docs/` spec, an ADR, the task file)? A behaviour
   change without the matching doc update in the *same* change is a finding.
2. **Single source of truth / no duplication.** Does a new constant, list, type, or
   block of logic duplicate something that already exists? Is the *same data* carried
   in two places? (If two fields can drift apart, that's the smell.) Name the one
   place it should live.
3. **One place for decisions that will grow.** Capability/dispatch logic ("can this
   role do X", "how do we handle format Y") tends to sprawl as cases are added. Is it
   centralised so adding a case is a *one-line* change, or is it an if-chain that will
   grow in the call site? Push it into a named helper/table.
4. **Right altitude — not too specific.** A hardcoded `=== 'application/pdf'` (or one
   `if` per case) is a flag: will we add an `if` per future case? Is the per-case
   specificity *real* (call it out) or accidental (generalise it)?
5. **Layering discipline.** Entry points stay thin (no DB/business logic in
   routes/handlers); data access lives only in the data layer; external clients are
   **injected** at construction, not imported ad-hoc; no `db` import outside the data
   layer.
6. **Types at the boundary.** Public/service/module boundaries have explicit input +
   return types. No `any`; `unknown` is narrowed explicitly. Factory **and**
   `ReturnType` exported where that's the pattern.
7. **Fail-soft where it must be.** IO / outbound / external failures that must not
   break the flow are caught and degraded (logged, noted) — but real errors are
   surfaced, not silently swallowed. Side effects are obvious from the name.
8. **Validation & safety.** External input validated at the edge (e.g. with a schema
   validator); secrets never logged; mutating/outbound actions are gated where the
   project requires it.
9. **Consistency.** Matches the naming, structure, and idioms of the surrounding
   code. A new pattern should be proposed, not slipped in.
10. **No dead weight.** No commented-out code, context-free TODOs, or unused exports.
11. **Scope.** The diff matches the request — no silent scope creep, no bundled
    refactor that should be its own change. A big tree is itself a finding.
12. **Tests.** Not added proactively. If present: behaviour over implementation, no
    mocks where an integration test would be honest.

Verify the gate where relevant, adapting to the project's package manager
(`npm`/`pnpm`/`bun`/`yarn`): `typecheck && lint && build`.

## 3. Write the findings

One finding per issue, ordered by severity. Make each **actionable** — the reader
should know exactly what to change:

- **Severity:** `blocker` (don't merge) · `should-fix` · `nit`.
- **Location:** `path:line`.
- **The problem** in one sentence, then **the concrete suggestion** (or a question if
  it's genuinely a judgement call — phrase it so they can answer in a sentence).

> Example — `src/handlers/upload.ts:69` · should-fix — the `=== 'application/pdf'`
> check won't scale as formats are added; extract an `isReadable(file)` helper so a new
> readable format is one place to change.

Do **not** rubber-stamp. If you find nothing of substance, say so plainly and name the
two or three things you specifically checked and why they're fine.

## 4. Write the reviewer guide

A few lines so the human can review efficiently:

- **Read order** (dependency order beats GitHub's alphabetical): spec → types/contracts
  → core logic → edges (handlers/routes/integrations) → docs.
- **Focus areas:** the 2–3 files or decisions that carry the real risk.
- **How to verify:** the gate command, and the one real-world check that proves it
  works (e.g. "do X in the UI, expect Y") — static review rarely proves behaviour.
- **Open questions / things to sign off on knowingly.**

## Output shape

```
## Findings
- [blocker] path:line — problem → suggestion
- [should-fix] path:line — problem → suggestion
- [nit] path:line — problem → suggestion

## Reviewer guide
Read order: …
Focus: …
Verify: …
Open questions: …
```

## Principles this enforces

Spec-first · single source of truth · centralise growing decision logic · explicit
boundary types, no `any` · fail-soft IO · validate at the edge · adversarial, not a
rubber-stamp · read-only (never edits/commits).
