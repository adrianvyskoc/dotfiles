---
description: When more than one agent works the same repo, isolate each in its own git worktree — and remove the worktree automatically once the work is merged or done, so they don't pile up
---

## Worktree discipline

- **Reach for a git worktree when more than one agent (or session) is working the same repo and must not share working-tree state.** A worktree gives each agent its own checked-out directory backed by the same `.git`, so two tasks can sit on different branches without stepping on each other's files, stashes, or in-progress edits.
  - **Why:** running two agents in one working tree means one agent's checkout, edit, or branch switch silently changes the ground under the other. Isolating each in a worktree is the difference between two clean parallel diffs and one corrupted mess that has to be untangled by hand.
  - **How to apply:** only create a worktree when the user is actually running parallel work — a single agent on a single task does **not** need one. When asked (or when you spot two agents racing on the same repo), propose it: *"You've got two tasks on this repo — want me to spin up a worktree for this one so they don't collide?"*

- **Create worktrees at a predictable sibling path, named after the branch.** Use `git worktree add ../<repo>-worktrees/<branch> -b <branch>` (drop `-b` to check out an existing branch). The sibling location keeps the worktree outside the repo's own tree so git, linters, and file scans never recurse into it.
  - **Why:** a consistent location means worktrees are findable and prunable later; putting them *inside* the repo pollutes status, search, and tooling. One folder per repo (`../<repo>-worktrees/`) keeps them grouped and obvious.
  - **How to apply:** for a repo at `~/dev/foo` on branch `feature-x`, the worktree path is `~/dev/foo-worktrees/feature-x`. Tell the user the exact path you created and `cd` there before doing the task's work.

- **Track every worktree you create — and remove it automatically once its work concludes.** This is the point of the rule: worktrees are easy to spawn and easy to forget. When the branch is merged, the PR is closed, or the user says the task is done, tear it down without being asked: `git worktree remove ../<repo>-worktrees/<branch>` then `git worktree prune`.
  - **Why:** orphaned worktrees accumulate, hold stale checkouts, and clutter the filesystem — the user has stated they forget to clean these up, so the agent owns it. "Work is done" is the natural cleanup boundary; don't leave it to a future session that won't remember the worktree existed.
  - **How to apply:** remember the path you created at the start of the task. At the end-of-work signal (merge / PR close / "we're done here"), say *"Cleaning up the `<branch>` worktree at `<path>`"* and remove it. If the user ends the session without a clear signal, ask: *"Should I remove the `<branch>` worktree now, or keep it around?"*

- **Never remove a worktree that still holds uncommitted or unpushed work — check first.** Before `git worktree remove`, run `git -C <worktree-path> status --porcelain` and `git -C <worktree-path> log @{upstream}.. --oneline` (or check for an upstream at all). If either shows pending work, stop and surface it.
  - **Why:** `git worktree remove` on a dirty tree either refuses (`--force` needed) or, if forced, throws away work that was never saved anywhere. Cleanup must never be destructive — the whole value of the worktree is the work inside it.
  - **How to apply:** if the tree is dirty or has unpushed commits, do **not** force-remove. Report it: *"The `<branch>` worktree has uncommitted changes / N unpushed commits — commit and push first, or tell me to discard them before I remove it."* Only delete the branch itself (`git branch -d <branch>`) if it's merged and the user agrees.
