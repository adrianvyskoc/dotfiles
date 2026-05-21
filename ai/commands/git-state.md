---
description: Audit (or reset) the git state of every repo under a directory — siblings and their submodules. Reports uncommitted changes, open PRs, and off-main branches; can optionally stash + return everything to main.
argument-hint: [path] [--reset]
---

Audit the git state of every repository found under a root directory — sibling repos sitting side-by-side **and** any submodules nested inside them. By default this is a **read-only report**. With `--reset`, it stashes local changes and returns every repo to its default branch.

Arguments: `$ARGUMENTS` — optional, may contain:

- A path to use as the **scan root** (defaults to the current working directory).
- The flag `--reset` to switch from report mode to reset mode.

Order does not matter. Examples:

- `/git-state` — audit repos under `.`
- `/git-state ~/Documents/development` — audit repos under that path
- `/git-state --reset` — reset every repo under `.`
- `/git-state ~/Documents/development --reset` — both

## How to do it

### 1. Parse arguments

- If `$ARGUMENTS` contains `--reset`, set `MODE=reset`. Otherwise `MODE=check`.
- Treat the remaining (non-flag) token as the scan root. If empty, use `.`.
- Resolve the scan root to an absolute path. If it does not exist or is not a directory, stop and tell the user.

### 2. Discover repositories

Build a list of repo paths to inspect. A "repo" here means any directory containing a `.git` entry (folder **or** file — submodules use a `.git` file pointing at the real gitdir).

1. **Siblings.** List the immediate children of the scan root (one level deep, no recursion). For each child directory, check whether `<child>/.git` exists. Collect every match.
   - If the scan root itself is a git repo (has its own `.git`), include it too — the user may have invoked the command from inside a single repo rather than a parent dir.
2. **Submodules.** For each repo collected above that has a `.gitmodules` file, run `git -C <repo> submodule foreach --quiet --recursive 'echo $displaypath'` and append each submodule path (resolved relative to the parent repo) to the list.
3. Deduplicate the list, preserving discovery order.

If the list is empty, respond exactly: `No git repositories found under <scan root>.` and stop.

### 3. Inspect each repo

For every repo path in the list, gather these facts with `git -C <path>` (do **not** `cd` — keep the working directory stable):

| Fact | How |
| ---- | ---- |
| `branch` | `git rev-parse --abbrev-ref HEAD` |
| `default_branch` | `git symbolic-ref --quiet refs/remotes/origin/HEAD` → strip `refs/remotes/origin/`; if that fails, fall back to `main` if `git show-ref --quiet refs/heads/main` succeeds, else `master`, else `branch` itself |
| `dirty` | `git status --porcelain` — non-empty means dirty |
| `ahead_behind` | `git rev-list --left-right --count @{upstream}...HEAD` if an upstream is configured; otherwise mark as "no upstream" |
| `open_prs` | `gh pr list --state open --json number,title,headRefName,author --limit 20` run inside the repo. If `gh` is not installed, not authenticated, or the repo has no GitHub remote, record "n/a" — do not error out the whole run |

Run these per repo in sequence (parallelism is fine if obviously safe, but correctness first). Never modify anything in check mode.

### 4a. Report (check mode)

Print a single table, one row per repo, with these columns: `repo`, `branch`, `dirty?`, `ahead/behind`, `open PRs`. Use the repo's path **relative to the scan root** so the output stays readable.

- `branch`: show the branch name. If it differs from `default_branch`, prefix with `⚠ ` (single warning marker, no other emoji).
- `dirty?`: `clean` or `dirty (<N> files)`.
- `ahead/behind`: `↑A ↓B` if an upstream exists, else `—`.
- `open PRs`: `0` or `N (#123, #124, …)` — truncate to the first three PR numbers, then `+K more`.

After the table, print a short summary line:

```
<R> repo(s) scanned · <X> dirty · <Y> off default branch · <Z> with open PRs
```

If everything is clean, on default branch, and has no open PRs, end with the single line: `All repos in default state. 🎉` (emoji allowed here only because the user already uses it in the sibling `todos` command).

### 4b. Reset (reset mode)

Before doing anything destructive, print the discovered repo list and explicitly ask the user to confirm: `About to stash + checkout default branch + pull --rebase in <N> repos. Proceed? (y/n)`. Wait for an affirmative reply. On anything other than `y`/`yes`, abort and report `Aborted. Nothing was changed.`

When confirmed, for each repo, in sequence:

1. If `dirty`, run `git -C <repo> stash push -u -m "git-state auto-stash <ISO timestamp>"`. Record the stash ref returned (or note the failure and **skip the rest of this repo** — do not proceed to checkout if the stash failed).
2. Determine `default_branch` as in step 3. If the local branch does not exist, run `git -C <repo> fetch origin <default_branch>:<default_branch>` to materialize it; if that also fails, skip this repo and record the error.
3. Run `git -C <repo> checkout <default_branch>`.
4. Run `git -C <repo> pull --rebase`. If it fails (conflicts, no upstream), record the failure and move on — do not attempt to resolve.

At the end, print a per-repo result table: `repo`, `action` (one of `already clean`, `stashed + reset`, `reset only`, `skipped`, `failed`), and a `notes` column with the stash ref or error message. Then print a footer with totals, and — important — a recovery hint listing the stash refs so the user can recover work: `Stashed work can be recovered with: git -C <repo> stash pop`.

### 5. Common rules

- **Read-only by default.** In check mode, never run anything that mutates state.
- **Never operate outside the scan root.** All `git -C` calls must point at a path discovered in step 2.
- **One repo's failure must not abort the run.** Catch and record errors per repo; continue to the next.
- **Do not commit, push, or create PRs.** Even in reset mode — only stash, checkout, and pull.
- **Do not delete stashes.** The user reviews and pops them manually.
- **Branch detection must respect `origin/HEAD`.** Some repos default to `master`, some to `main`, some to `develop`. Do not hard-code `main`.
- **`gh` is optional.** If it is missing or unauthenticated, mark PR columns as `n/a` and keep going — the rest of the report is still useful.
- **Keep output compact.** No preamble like "Here is the report:" — print the table and the summary line, nothing else.
