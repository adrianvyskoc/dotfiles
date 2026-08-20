---
description: Personal (non-team) instructions for efabrica/ebox-app — loaded via a gitignored CLAUDE.local.md stub, never checked into the repo
---

## ebox-app — personal notes

Repo: `~/Documents/development/efabrica/ebox-app` · remote `git@git.efabrica.sk:ebox/frontend/ebox-app.git` · Nuxt · pnpm@9.15.9.

These are **my** rules. The team's rules live in the repo's `.ai/rules/` and are already loaded via the generated `CLAUDE.md` — do not restate them here.

### Never hand-edit the generated AI config

`.ai/` is the source of truth. `CLAUDE.md`, `.mcp.json`, `.claude/skills/`, `.claude/agents/` and `.cursor/` are **generated** by `pnpm sync:ai` (`commands/sync-ai.ts`), are gitignored, and are rebuilt on every `pnpm install`.

- **Why:** anything written straight into those paths is silently lost on the next install. `syncDir()` also prunes files it did not generate as orphans, so a hand-added skill gets deleted, not just overwritten.
- **How to apply:** to change shared AI config, edit `.ai/<rules|skills|agents>/…` then run `pnpm sync:ai`. To change *my* config, use the private paths below.

### Where my private config is safe from sync:ai

`/.claude/` is fully gitignored in this repo, and `sync-ai.ts` only prunes inside its own destination roots. So:

| Path | Safe? | Use for |
| --- | --- | --- |
| `CLAUDE.local.md` (root) | ✅ not a sync target | personal instructions (imports this file) |
| `.claude/commands/` | ✅ not a sync target | personal slash commands |
| `.claude/settings.local.json` | ✅ not a sync target | personal permissions / env |
| `.claude/skills/` | ❌ pruned as orphan | — use `.ai/skills/` + `pnpm sync:ai` |
| `.claude/agents/` | ❌ pruned as orphan | — use `.ai/agents/` + `pnpm sync:ai` |

`CLAUDE.local.md` is not covered by the repo's `.gitignore` (which only lists `/CLAUDE.md`), so it is kept private via `.git/info/exclude` instead — never add it to the shared `.gitignore`.

### Private /review-task command

`/review-task [jira-url-or-key]` reviews the current branch against its Jira zadanie (fetches the ticket, runs the team `review-branch` checklist, reports requirement coverage). It is defined in the dotfiles at `~/.ai/projects/ebox-app/commands/review-task.md` and symlinked into `.claude/commands/` by `aic --project` — if it's missing in a fresh worktree or machine, rerun `aic --project` there. Never move it into `.ai/skills/` (that commits it to the team repo) or `.claude/skills/` (pruned by sync:ai).

### GitLab, not GitHub

The remote is self-hosted GitLab (`git.efabrica.sk`).

- **Why:** `gh` CLI does nothing useful here, and the review artifact is a **merge request**, not a pull request.
- **How to apply:** say "MR" not "PR". Use `glab` or the web UI. The repo's `analyze-mr` and `review-branch` skills are the intended entry points.

### Always push with `--no-verify`

`git push --no-verify` in this repo. Every time.

- **Why:** the lefthook `pre-push` hook runs an `interactive: true` job (`commands/check-master-push.sh`) that waits for a typed confirmation. An agent cannot answer that prompt, so the push just hangs.
- **How to apply:** this changes *how* to push, never *whether* — the standing rule that every push needs my explicit approval first still applies in full. `--no-verify` also skips the hook's `lint`, `format` and `typecheck` jobs, so run `pnpm lint && pnpm format && pnpm typecheck` manually before pushing instead of relying on the hook.

### Suggest a branch name for every implemented feature

Branches are `<TICKET-KEY>/<kebab-slug>` — the ticket number first, then a short one-line kebab description (e.g. `EPIK-15862/stats-drawer-design-fixes`). The key is usually `EPIK-<n>` or `EPIKRO-<n>`, but any `<PREFIX>-<n>` project key is valid — what matters is that the ticket number leads the branch name.

- **Why:** the ticket key in the branch name is load-bearing downstream — the `CHANGELOG.md` entry and the MR title both take their Jira key from it.
- **How to apply:** every time a feature gets implemented (or new work starts), proactively suggest a branch name in this format, unprompted. Ask for the ticket number if I have not given one — do not invent a branch name without a ticket prefix.

### Every finished change updates CHANGELOG.md

A change is not done until the root `CHANGELOG.md` has an entry for it. Add it under `## [Unreleased]`, in the matching `### Added` / `### Changed` / `### Fixed` / `### Removed` subsection.

- **Why:** the changelog is how the release notes get written; an entry added later, in bulk, loses the ticket mapping.
- **How to apply:** lowercase description, then the Jira ticket, then the Azure work item — **always with a space between the two brackets**:

  ```markdown
  - update ro branding notions to uppercase [EPIKRO-1637] [139094]
  ```

  - **English only.** Every entry is written in English, regardless of what language we spoke in during the task. This is the opposite of the MR description, which is Slovak — do not mix the two up.
  - **Jira ticket — required.** `EPIK-<n>` or `EPIKRO-<n>` (other `<PREFIX>-<n>` forms appear too). Take it from the branch name.
  - **Azure work item — immediately after, in its own brackets, separated by one space.** Usually one number (`[143020]`); some entries carry two, written `[143671 - 129407]`.
  - **No Azure number → `[internal]`**, e.g. `- fix cwElement wrapping [EPIK-15852] [internal]`. Purely internal work with no ticket at all is just `- <description> [internal]`.
  - If I have not given the Azure number, **ask for it** — do not guess it and do not quietly fall back to `[internal]`.

  The existing file is inconsistent about that space (`[TICKET] [AZ]` roughly 94 entries, `[TICKET][AZ]` roughly 20). Write new entries with the space; leave old ones alone.

### Fill in the MR description when a task is done

The MR template is committed at `.gitlab/merge_request_templates/default.md`. **Read that file** and fill it — do not reproduce it from memory here, it can change.

**Write the MR description in Slovak. Always.** Title, Popis, every test case step and expected result. This holds even when the whole session ran in English, even when the code, ticket and Figma notes are in English, and even when I write to you in English — the MR is read by Slovak-speaking reviewers, so the language of the MR does not follow the language of the conversation. Do not ask which language to use; do not produce an English draft "to be translated later".

Note the split: **MR description is Slovak, `CHANGELOG.md` is English.** Same task, two languages.

- **Why:** the template exists because reviewers were getting MRs with no reproducible test steps. An empty test case section, or "viď Jira", gets the MR sent straight back.
- **How to apply:** once the code is finished and the `CHANGELOG.md` entry is in, hand me the filled description as one copy-pasteable markdown block, unprompted.

| Field | What to do |
| --- | --- |
| MR **title** | `[EPIK-<n>] <krátky popis po slovensky>` — the Jira key must be in the *title*, not only the body. Take it from the branch name. |
| **Env** | ask — unless the diff makes it unambiguous (RO-only code → `RO PROD`) |
| **URL** | ask |
| **User** | ask |
| **Figma** | use the link if I gave one this session; otherwise delete the row, as the template says |
| **Popis** | optional — write it only when the change is non-obvious or a refactor (then explain *why this approach*), skip it otherwise |
| **Test case** | **write it from the actual diff** — this is the one section I really need |
| **Reviewer** checkbox | leave unchecked; that box belongs to the reviewer |

Test cases are the part worth effort:

- numbered, each one `Krok: … → Expected: …`, concrete enough that a reviewer can click through without reading the code
- derive them from what actually changed, and cover **only what cannot be read off the Jira ticket** — do not restate the ticket
- never emit `…` or "viď Jira" as a placeholder

Anything that needs a value I genuinely cannot derive — Env, URL, User — goes into a short explicit list of questions **above** the block. Do not leave it as a silent empty field for me to discover later.

### Worktrees

This repo uses nested worktrees under `.claude/worktrees/<name>/`, which are covered by the global `~/.claude` git exclude rules. A sibling `../ebox-app-worktrees/` directory also exists.

- **Why:** nested worktrees still find the root `CLAUDE.local.md` through the upward file walk, so no per-worktree stub is needed. Sibling worktrees do **not** — they need their own one-line stub.
- **How to apply:** prefer `.claude/worktrees/<branch>/` here. This overrides the generic sibling-path convention from the `worktree-discipline` rule.
