---
description: Rebase the current ebox-app branch onto the latest origin/master (or origin/R15), reinstall when the lockfile moved, run the lint/format/typecheck gate, and ask before the force push
argument-hint: [master | R15]
---

Bring the current branch up to date with its base. This is the "rebasni s aktuálnym mastrom" routine.

> Rebase and the gate run without asking. The **push** always waits for an explicit yes — this command never pushes on its own.

Arguments: `$ARGUMENTS` — the base branch name. Empty → `master`. `R15` (or any `R<n>`) → that release branch.

## 1. Say where we are

Before touching anything, print one line: `Branch <name> · worktree <path or "main tree"> · base origin/<base>`.

- On `master` or `R<n>` directly → stop. Nothing to rebase; say so.
- Dirty tree (`git status --porcelain` non-empty) → stop and list the files. Do not stash, do not commit — the user decides.
- If the branch already has an MR, its target is the base. When the user did not name a base and the branch's last commits mention R15, or the branch was cut from `origin/R15` (`git merge-base --is-ancestor origin/R15 HEAD` true while `origin/master` is not), ask which base before rebasing — a rebase onto the wrong release branch is the incident this command exists to prevent.

## 2. Rebase

```sh
git fetch origin <base>
OLD=$(git rev-parse HEAD)
git rebase origin/<base>
```

Conflicts: resolve only the two mechanical ones, everything else stops for the user.

- `vitest.config.ts` `include` list → keep **both** sides' spec entries.
- `CHANGELOG.md` under `## [Unreleased]` → keep **both** sides' entries; ours stays in the subsection it was written in.
- Anything else → `git rebase --abort`, list the conflicting files and the commits on both sides, and ask how to proceed.

## 3. Reinstall when the lockfile moved

```sh
git diff --quiet "$OLD" HEAD -- pnpm-lock.yaml || pnpm install --frozen-lockfile
```

`@efabrica/player` and other deps get bumped on master and R15 often; a stale `node_modules` fails typecheck with errors that look like ours but are not.

## 4. Gate

```sh
pnpm lint && pnpm format && pnpm typecheck
```

Add `pnpm test:run <spec…>` for the spec files this branch touches (`git diff --name-only origin/<base>...HEAD -- '*.spec.ts'`). Run those with `NODE_ENV=production` too — that is how the CI unit-test job runs them, and `wrapper.emitted()` / `global.stubs` behave differently there.

Failures: report as `file:line: message`, fix only what the rebase itself broke (a renamed import, a moved include entry). A failure that existed before the rebase is reported, not fixed here.

## 5. Push — ask first

Report: rebased `<n>` commits onto `origin/<base>` at `<short sha>`, reinstall yes/no, gate green/red. Then ask exactly:

`Push with --force-with-lease?`

On yes: `git push --force-with-lease --no-verify`. Never `--force`, never without `--no-verify` (the pre-push hook hangs on an interactive prompt).

## Rules

- Never rebase `master` or a release branch itself.
- Never push without the explicit yes from step 5, and never push to a branch other than the current one.
- Do not "clean up" commits while here — no squash, no reword. Rebase only moves the base.
