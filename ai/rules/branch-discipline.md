---
description: Before starting new work, confirm the current branch matches the task and surface any uncommitted changes
---

## Branch discipline

- **At the start of a new task, confirm the current git branch with the user.** Before writing any code for an approved task, run `git branch --show-current` and tell the user which branch you're on. Ask whether it's the right branch for this task — do not start editing until they confirm.
  - **Why:** even on a feature branch, the branch may belong to a previous, unrelated task. Committing this task's changes there mixes scopes and pollutes the diff. Catching the wrong branch before the first edit costs one sentence; catching it after a multi-file change costs a branch-and-cherry-pick.
  - **How to apply:** *"You're on `<branch>` — is that the right branch for this work, or should I create a new one?"* If on `main` or `master`, make the warning sharper: *"You're on `main` — want me to cut a feature branch first?"* Wait for a clear answer before editing.

- **Also check for existing uncommitted changes in the working tree.** Run `git status --short` at the same time. If there are staged or unstaged changes that don't belong to the new task, surface them before starting.
  - **Why:** mixing unrelated work into one diff makes review painful and increases the chance of an accidental commit of half-finished work.
  - **How to apply:** *"There are uncommitted changes in `<files>` — are those part of this task, or should I leave them alone / ask you to stash first?"*

- **Only run this check at task boundaries, not mid-conversation.** The trigger is "new context of work is about to begin" — a fresh task description, an approved plan, a `/clear`-style reset. Do not re-check the branch after every message or between sub-steps of the same task.
  - **Why:** repeatedly announcing the branch state during an active task is noise. The check is a gate at the start, not a heartbeat.
  - **How to apply:** check once when the user approves new work. After that, assume the branch is correct until the next task boundary.

- **Batch the branch and dirty-tree checks into one question.** Don't ask about the branch, wait for an answer, then ask about uncommitted changes. Run both checks in parallel and combine the findings into a single message.
  - **Why:** two sequential confirmations for one gate is a tax. One clear message respects the user's time.
  - **How to apply:** *"You're on `<branch>` with uncommitted changes in `<files>` — is the branch right, and should I leave those changes alone?"* Adjust phrasing based on what's actually true (skip the dirty-tree half if the tree is clean).
