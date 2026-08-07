Do your work step by step. When u finish some important part, notify me for a review.

At the end of each coding session (when wrapping up a task, or when I signal we're done), tell me which subagents you used and what each one was for — e.g. "Subagents used: code-reviewer (reviewed the branch), Explore (located the auth code)." If you didn't use any, say "No subagents used this session." This is a wrap-up habit you follow, not a harness hook, so it's on you to remember it.

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

---
description: Never commit or push without explicit approval; propose one-line Conventional Commits messages with no body
---

## Commit discipline

- **Never run `git commit` on your own.** Always ask first. This applies even when the task obviously ends in a commit — finish the work, summarize what changed, and wait for a clear "yes" before committing.
  - **Why:** the user wants to review diffs and control commit boundaries themselves. An unprompted commit takes that decision away and is annoying to undo.
  - **How to apply:** after finishing edits, report what changed and ask "Want me to commit this?" Draft a message if helpful, but do not run the command until explicitly approved.

- **Never `git push` on your own.** Same rule as commits — ask every time.
  - **Why:** push is visible to others and harder to reverse than a local commit.
  - **How to apply:** approval to commit is not approval to push. Treat them as two separate asks.

- **Approval is per-commit, not a standing permission.** A "yes, commit that" for one change does not carry over to the next one.
  - **Why:** prevents the slow drift where one approval quietly becomes a blanket permission.
  - **How to apply:** ask again for the next commit, even if they feel related.

- **Use Conventional Commits format when proposing messages — subject line only.**
  - Subject: `type(scope): short imperative summary` — ~50 chars, lowercase, no trailing period
  - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `build`, `ci`
  - Scope is optional but helpful when the repo has clear areas (e.g. `feat(aliases): …`)
  - Examples:
    ```
    feat(hlp): add alias discovery command
    fix(aic): keep existing ~/.claude symlinks on reinstall
    chore(deps): drop oh-my-zsh in favor of plain zsh config
    ```

- **No commit body. Ever.** One line, concise and to the point — nothing after the subject.
  - **Why:** the diff already shows what changed, and bodies drift into restating it. A repo of one-line subjects stays scannable in `git log --oneline`; prose belongs in the PR description, not the commit.
  - **How to apply:** if the summary does not fit in one line, the commit is doing too much — split it. Never pad a weak subject with an explanatory paragraph. Machine trailers (`Co-Authored-By:`, `Refs:`) are footers, not a body, and are fine.

- **Show the drafted message before committing.** Once the user says yes, paste the message you're about to use and give them a chance to tweak it before it lands.
  - **Why:** cheaper to edit a draft than to amend a commit.
  - **How to apply:** "About to commit with: `<message>` — ok?" is enough.

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
