---
description: Spin up and tear down git worktrees at a predictable sibling path, with a dirty/unpushed safety check before any removal. Automates the worktree-discipline rule.
argument-hint: [list | <branch> | remove <branch> | clean]
---

Manage git worktrees for the current repo, following the **worktree-discipline** rule: create them at a predictable sibling path named after the branch, track them, and never remove one that still holds uncommitted or unpushed work.

Arguments: `$ARGUMENTS` — selects the action. The first token is the verb; what follows is its operand.

- _(empty)_ or `list` / `ls` — list this repo's worktrees with their state. **Read-only.**
- `<branch>` or `add <branch>` — create a worktree for `<branch>` at `../<repo>-worktrees/<branch>`.
- `remove <branch>` / `rm <branch>` — remove that branch's worktree, after a safety check.
- `clean` — remove every worktree whose branch is already merged, after confirmation.

Examples:

- `/worktree` — list worktrees
- `/worktree feature-x` — create `../<repo>-worktrees/feature-x`
- `/worktree remove feature-x` — tear down that worktree
- `/worktree clean` — prune all merged worktrees

## Setup (do this first, for every action)

Resolve these once with `git -C .` (do **not** `cd` — keep the working directory stable). If the current directory is not inside a git repo, stop and tell the user.

| Fact | How |
| ---- | ---- |
| `main_root` | `git worktree list --porcelain` → the **first** `worktree ` line is the main working tree's absolute path |
| `repo` | the basename of `main_root` (e.g. `/Users/x/dev/foo` → `foo`) |
| `wt_dir` | the sibling folder `<dirname(main_root)>/<repo>-worktrees` (e.g. `/Users/x/dev/foo-worktrees`) |

The sibling location keeps worktrees **outside** the repo tree so git, linters, and file scans never recurse into them. One `<repo>-worktrees/` folder per repo keeps them grouped and prunable.

## How to do it

### list (default)

1. Run `git worktree list --porcelain` and parse the entries (path, branch, HEAD).
2. For each worktree **other than `main_root`**, gather with `git -C <path>`:
   - `dirty` — `git status --porcelain` (non-empty → dirty).
   - `ahead/behind` — `git rev-list --left-right --count @{upstream}...HEAD` if an upstream exists, else `—`.
3. Print one compact table: `branch`, `path` (relative to `dirname(main_root)`), `dirty?` (`clean` / `dirty (N files)`), `ahead/behind` (`↑A ↓B` or `—`).
4. If there are no worktrees besides the main one, respond exactly: `No worktrees for <repo>.` and stop. No preamble.

### add `<branch>` (also the bare `/worktree <branch>` form)

1. The operand is the branch name. If missing, ask the user for it and wait.
2. Target path is `<wt_dir>/<branch>`. If a worktree already exists at that path (check `git worktree list`), stop and report it — do not recreate.
3. Decide new-vs-existing branch: if `git show-ref --verify --quiet refs/heads/<branch>` succeeds, the branch exists.
   - Existing branch: `git worktree add <wt_dir>/<branch> <branch>`
   - New branch: `git worktree add <wt_dir>/<branch> -b <branch>`
4. Report the **exact path** created: `Created worktree for <branch> at <wt_dir>/<branch>.` Tell the user to `cd` there to work on it. Do not `cd` for them, and do not start the task's work — this command only provisions the worktree.

### remove `<branch>` / rm `<branch>`

1. The operand is the branch name. If missing, ask and wait. Resolve its path from `git worktree list` (do **not** assume `<wt_dir>/<branch>` — honor where it actually lives). If no such worktree, stop and say so.
2. **Safety check — never skip this.** With `git -C <path>`:
   - `git status --porcelain` — any output means **uncommitted** work.
   - `git log @{upstream}.. --oneline` — any output means **unpushed** commits. If there is no upstream at all, treat that as "unpushed" too (the work exists only here).
3. If either check shows pending work, **stop** and report it — do not force-remove:
   `The <branch> worktree has <uncommitted changes / N unpushed commits>. Commit and push first, or tell me to discard them before I remove it.`
4. If clean and pushed, remove it: `git worktree remove <path>` then `git worktree prune`. Report: `Removed the <branch> worktree at <path>.`
5. Only delete the branch itself (`git branch -d <branch>`) if it is merged **and** the user explicitly agrees — ask, don't assume.

### clean

1. List all worktrees except `main_root`.
2. For each, determine whether its branch is merged into the repo's default branch (`git branch --merged <default>` contains it). Determine `default` via `git symbolic-ref --quiet refs/remotes/origin/HEAD` (strip `refs/remotes/origin/`), falling back to `main` then `master`.
3. Run the **same safety check** as `remove` on every merged candidate. Drop any that are dirty or have unpushed commits from the removal list and note why.
4. Print the candidates you intend to remove and ask: `Remove these N merged worktrees? (y/n)`. Wait for an affirmative reply.
5. On `y`, remove each (`git worktree remove <path>`), then `git worktree prune` once. Report a short per-worktree result. On anything else: `Aborted. Nothing was changed.`

## Rules

- **Read-only by default.** Bare `/worktree` and `list` never mutate anything.
- **Never remove a worktree with uncommitted or unpushed work.** The safety check in `remove`/`clean` is mandatory and must run before any `git worktree remove`. Never pass `--force` to discard work without explicit user instruction.
- **Always create at the predictable sibling path** `<repo>-worktrees/<branch>` — never inside the repo tree, never a one-off location.
- **Report the exact path** on create and remove so the user (and future sessions) can find or prune it.
- **Don't `cd` and don't start the task.** This command provisions and tears down worktrees; the actual work happens separately.
- **One worktree's failure must not abort a batch.** In `clean`, catch per-worktree errors and continue.
- **Keep output compact.** No "Here is…" preamble — print the table or the one-line result.
