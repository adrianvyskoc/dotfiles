---
description: Never commit or push without explicit approval; use Conventional Commits format when proposing messages
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

- **Use Conventional Commits format when proposing messages.**
  - Subject: `type(scope): short imperative summary` — ~50 chars, lowercase, no trailing period
  - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `build`, `ci`
  - Scope is optional but helpful when the repo has clear areas (e.g. `feat(aliases): …`)
  - Blank line, then a body explaining the **why** (not the **what**) when non-trivial — the diff already shows what changed
  - Example:
    ```
    feat(hlp): add alias discovery command

    Grepping through .my_aliases was slow during pairing.
    hlp lists aliases with their one-line descriptions.
    ```

- **Show the drafted message before committing.** Once the user says yes, paste the message you're about to use and give them a chance to tweak it before it lands.
  - **Why:** cheaper to edit a draft than to amend a commit.
  - **How to apply:** "About to commit with: `<message>` — ok?" is enough.
