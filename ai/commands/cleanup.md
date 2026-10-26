---
description: Run one small batch of code cleanup — find candidates with deterministic tools, verify each claim, then let one subagent per finding fix it in its own worktree and commit it locally. Never pushes.
argument-hint: [path | scope] [limit N]
---

Run one cleanup batch on the current repo: dead code, unused exports and dependencies, stale flags, simple lint debt. Scope is `$ARGUMENTS` (a path or package), or — if empty — ask once which directory to start with. Default batch limit is **5 findings**, hard maximum 5.

**Invoking this command is the explicit approval to create local commits for this batch** (see the `/cleanup` exception in commit-discipline). It is not approval to push, open a PR, or touch `main`.

## 1. Discover — read-only, deterministic tools first

Do not write anything in the repo in this phase. Run only what the repo already has; never install a tool to find candidates (report it as missing instead).

- Type-level: `tsc --noEmit` with `--noUnusedLocals --noUnusedParameters` passed as flags (do not edit `tsconfig`), `vue-tsc` / `svelte-check` when the project uses them.
- Lint: the project's `lint` script, filtered to unused-code rules.
- Unused exports, files, dependencies: `knip` if it is already a dependency or configured.
- Flaky tests are a different queue (CI history, not static analysis) — out of scope for this command.

Write the candidate list to `<wt_dir>/cleanup-findings.json` (outside the repo tree; `wt_dir` as in `/worktree`). Fields per finding: `id`, `tool`, `file`, `symbol`, `kind`, `risk`, `size`.

## 2. Triage — humans keep the risky ones

Remove from the batch and list separately as "needs a human":

- anything exported from a package entry or barrel (`index.ts`) — public API;
- database migrations and Drizzle schema files;
- feature flags marked permanent, killswitches, anything touching live config;
- findings in files with uncommitted changes in the main working tree.

Rank the rest by estimated impact (largest dead file or dependency first), take the top N, print the batch as a table, and continue.

## 3. Verify the claim — separate from the worker

For each finding, a fresh agent (sonnet, read-only) tries to **disprove** the claim, e.g. "this export is unused". It checks dynamic and indirect use: string references and dynamic `import()`, Vue/Svelte templates and dynamic components, auto-imports, route and plugin registration (Hono routes), schema use by migrations, tests, docs and scripts. Output: `confirmed | doubtful` with the evidence it looked at. `doubtful` goes to "needs a human" and gets no worker.

## 4. Fix — one subagent per confirmed finding

- Worktree per finding at `../<repo>-worktrees/cleanup-<slug>`, branch `cleanup/<slug>` from the repo's default branch (worktree-discipline applies, including install in the worktree). Findings that touch the same file run one after another, never in parallel.
- Brief every worker with the orchestration-discipline template: `May edit` is the finding's file(s) only, `Definition of done` is a green gate, `Report back` is the fixed format.
- The worker makes the **smallest** change that resolves the finding. No refactoring beyond it, no new abstractions, no tests (testing-discipline), no formatting churn. If the diff exceeds ~40 changed lines, stop and report `partial` without committing.
- The worker runs the gate through the `verifier` agent (typecheck → lint → tests). Green: **one local commit** in the worktree, one-line Conventional Commit (`refactor(scope): remove unused X`, `chore(deps): drop unused Y`), no body. Red: no commit, report `blocked` with the condensed failure.
- The worker may run `git add` on its own files and `git commit` on its `cleanup/*` branch. Nothing else in git.

## 5. Report

One table, nothing after it except the next step:

| id | claim | evidence | files | diff lines | gate | result |
|----|-------|----------|-------|------------|------|--------|

Below it: **needs a human** (with the reason each was held back) and **misses** — findings where the verifier or the gate disagreed with the audit, so the triage rules and prompts can be adjusted. End with how to review: `git -C <worktree> show` per branch.

## Hard limits — this command does NOT override these

- Never `git push`, never open a PR, never touch `main` or the branch the user has checked out.
- Commits only on `cleanup/*` branches inside their own worktrees, only after a green gate, one per finding.
- Never `--amend`, rebase, force anything, or remove a worktree that holds uncommitted work.
- Never run a destructive command outside the finding's files. Deleting a file is allowed only when that file **is** the finding.
- Merging a branch, pushing it and removing its worktree afterwards are separate asks, made by the user.
