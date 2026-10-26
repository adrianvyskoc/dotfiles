---
description: Never commit or push without explicit approval; propose Conventional Commits messages with fixed scopes, `!` for breaking changes, and no body unless a short why is needed
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

- **Exception — `/cleanup` batches.** Running `/cleanup` is explicit approval for subagents to create **local** commits on `cleanup/*` branches inside their own worktrees, one per finding, after a green gate. Everything else in this rule still applies: no push, no commit on `main` or the user's current branch, one-line Conventional Commit subject with no body.
  - **Why:** a cleanup finding is small, reversible by deleting its branch, and reviewing 5 dirty worktrees by hand costs more than reviewing 5 commits. The risk lives in push and merge, which stay gated.
  - **How to apply:** the exception is granted by the command, per batch. It never carries over to ordinary work in the same session.

- **Never commit review artifacts — `.review-shots/` above all.** Annotated screenshots and their spec JSONs from design reviews live in `.review-shots/` and never go into a commit, a stage, or a push — not even when the user approved a commit of everything else. The folder is in the global git ignore; if it ever shows up in `git status`, stop and tell the user instead of adding it.
  - **Why:** review screenshots are throwaway evidence for one review, often several MB each; committed, they bloat the repo history forever and leak unreleased UI.
  - **How to apply:** before any `git add`, check the paths; never use `git add -A` / `git add .` when `.review-shots/` exists without confirming it is ignored.

- **Use Conventional Commits format when proposing messages.**
  - Subject: `type(scope): short imperative summary` — ~50 chars, lowercase, no trailing period
  - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `build`, `ci`
  - Scope is optional but helpful when the repo has clear areas (e.g. `feat(aliases): …`)
  - Examples:
    ```
    feat(hlp): add alias discovery command
    fix(aic): keep existing ~/.claude symlinks on reinstall
    chore(deps): drop oh-my-zsh in favor of plain zsh config
    ```

- **Scopes come from a fixed list — in this dotfiles repo:** `skills`, `rules`, `agents`, `commands`, `knowledge`, `setup`, `aliases`, `aic`, or a project name for `ai/projects/<name>` (`ebox-app`, `eclario`). Never `ai`. The specific skill/agent/rule goes in the subject, not the scope: `feat(agents): attach annotated shots in design-reviewer`, not `feat(design-reviewer): …`.
  - **Why:** almost everything lives under `ai/`, so `feat(ai)` says nothing; and mixing category scopes with file-name scopes means `git log --grep 'feat(skills)'` misses half the skill commits.
  - **How to apply:** pick the scope from the folder the change touches. If a change spans two scopes, split it or drop the scope. In other repos, reuse the scopes their history already uses; do not invent new ones without asking.

- **Mark breaking changes with `!`.** `feat(aliases)!: rename hlp to help`. Breaking means an existing setup stops working after pull: a renamed or removed alias, skill, command or agent, a moved file that `setup.sh` / `aic` symlinks, a changed config path.
  - **Why:** these are the only commits that require action on other machines (rerun `setup.sh` / `aic --project`); the `!` makes them findable before pulling.

- **No commit body by default — a short *why* is the only exception.** One line is the norm. A body of 1–3 lines is allowed only when the reason for the change is not recoverable from the diff, the ticket or the PR — typically a `fix` with a non-obvious cause, or a `refactor`/`revert` done for a reason the code does not show.
  - **Why:** the diff shows *what* changed but never *why*, and `git blame` leads to the commit, not to the PR or ticket — those can disappear with a tracker or host migration. Bodies that restate the diff are still banned.
  - **How to apply:** the body answers "why" only — no list of changed files, no recap of the subject. If you feel the need to explain *what* the commit does in more than one line, the commit is doing too much — split it. Machine trailers (`Co-Authored-By:`, `Refs:`) are footers, not a body, and are fine. Per-project rules may forbid bodies entirely (`ebox-app` does) — they win.

- **Show the drafted message before committing.** Once the user says yes, paste the message you're about to use and give them a chance to tweak it before it lands.
  - **Why:** cheaper to edit a draft than to amend a commit.
  - **How to apply:** "About to commit with: `<message>` — ok?" is enough.
