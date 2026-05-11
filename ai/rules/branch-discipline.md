---
description: Before starting new work, check the current branch and working-tree state; warn if on main/master or if uncommitted changes exist
---

## Branch discipline

- **At the start of a new task, check the current git branch.** Before writing any code for an approved task, run `git branch --show-current` (or equivalent). If the branch is `main` or `master`, stop and tell the user before doing anything else.
  - **Why:** committing directly to `main`/`master` is hard to undo and bypasses review. Catching it before the first edit costs one sentence; catching it after a multi-file change costs a branch-and-cherry-pick.
  - **How to apply:** say something like *"You're on `main` — want me to create a feature branch first, or is this intentional?"* and wait for an answer before editing.

- **Also check for existing uncommitted changes in the working tree.** Run `git status --short` at the same time. If there are staged or unstaged changes that don't belong to the new task, surface them before starting.
  - **Why:** mixing unrelated work into one diff makes review painful and increases the chance of an accidental commit of half-finished work.
  - **How to apply:** *"There are uncommitted changes in `<files>` — are those part of this task, or should I leave them alone / ask you to stash first?"*

- **Only run this check at task boundaries, not mid-conversation.** The trigger is "new context of work is about to begin" — a fresh task description, an approved plan, a `/clear`-style reset. Do not re-check the branch after every message or between sub-steps of the same task.
  - **Why:** repeatedly announcing the branch state during an active task is noise. The check is a gate at the start, not a heartbeat.
  - **How to apply:** check once when the user approves new work. After that, assume the branch is correct until the next task boundary.

- **A non-`main`/`master` branch with a sensible name is fine — don't ask.** If the user is already on a feature branch (e.g. `feat/foo`, `claude/bar`, `username/baz`), proceed silently. The warning is specifically for `main`/`master`, not for "any branch I haven't seen before."
  - **Why:** asking on every unfamiliar branch name turns a useful guardrail into a tax.
  - **How to apply:** only speak up for `main`, `master`, or an obvious dirty-state problem. Otherwise, get to work.
