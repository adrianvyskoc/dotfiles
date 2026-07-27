# ai/ — reusable AI tooling library

Claude Code assets extracted from past projects and made generic enough to drop into any new repo. Copied into place via the `aic` shell command (defined in `.my_aliases`).

## Layout

| Folder      | What it is                                               | Where it goes in a project         |
| ----------- | -------------------------------------------------------- | ---------------------------------- |
| `commands/` | Claude Code slash commands (`/add-task`, `/todos`, …)    | `<project>/.claude/commands/`      |
| `skills/`   | Claude Code skills (each is a folder with a `SKILL.md`)  | `<project>/.claude/skills/`        |
| `rules/`    | CLAUDE.md fragments — copy/paste into a project CLAUDE.md | merged into `<project>/CLAUDE.md`  |
| `agents/`   | Subagent definitions                                     | `<project>/.claude/agents/`        |

Each asset has frontmatter with a `description:` field so `aic` can list them.

Project installs **copy** into `<project>/.claude/` (self-contained, committable). User installs (`--user`/`--global`) **symlink** into `~/.claude/` so they track this repo — edits and `git pull` propagate without re-running `aic`. (Rules always append to a `CLAUDE.md` rather than copy or symlink.)

## Available assets

### commands

- **add-task** — creates `tasks/<slug>.md` with a standard planning template
- **todos** — lists all files in `tasks/` with status + one-line goal
- **git-state** — audits every repo (siblings + submodules) under a path for branch/dirtiness/open PRs; with `--reset`, stashes + returns each to its default branch
- **worktree** — spins up / tears down git worktrees at a predictable sibling path (`../<repo>-worktrees/<branch>`); lists them, and removes them only after a dirty/unpushed safety check (automates the worktree-discipline rule)
- **human-summary** — writes a quick colleague-style recap of the session (bug/change/what-was-done) so it doesn't read as AI-written; thin trigger for the `human-summary` skill, with optional register/language/length via args

### skills

- **alpine-js** — idiomatic Alpine.js for CDN-loaded, server-rendered HTML/JSX (no build step)
- **modern-javascript** — world-class modern JS/TS using the newest stable features (ES2020–ES2026): `?.`/`??`, `structuredClone`, `Object.groupBy`, immutable array methods, Iterator/Set helpers, `Promise.withResolvers`, Temporal, explicit resource management — in an ESM, const-first, async/await, typed-result style
- **typescript-types** — decision framework for shared vs local types, organization by domain
- **api-error-handling** — consistent error shape, OpenAPI-documented, specific status codes, disciplined `try/catch`, typed error classes
- **prompt-engineering** — write or revise an LLM agent/assistant system prompt: don't repeat the shared base, the `Role:`/`How you work:`/`Boundaries:` shape, and 12 distilled principles tuned for modern Claude models
- **self-review** — adversarial senior-reviewer recipe for a diff: get the change, judge against a priority lens (duplication, altitude, layering, boundary types, scope), and emit findings + a reviewer guide; read-only
- **obsidian-daily-notes** — summarizes conversations, decisions, tasks and ideas into Obsidian daily notes on disk; previews before writing and proactively offers a write at the end of meaningful conversations
- **human-summary** — turns what we just worked on into a short summary that reads like a colleague typed it, not AI: default raw lowercase, no diacritics, no AI tells (no em dashes, essay transitions, rule-of-three); registers 1–3; manual/invoke-only
- **frontend-development** — framework-agnostic rules for reactive frontend work: generic UI library discipline (check → use/extend/create), presentational generic components, logic in feature components + hooks/composables, local state first, mandatory design tokens, typed API layer, schema-based forms, handled async states, naming + a11y baseline

### rules

- **code-hygiene** — explain before implement, prefer explicit, ask when unclear, no TODOs without context
- **pre-pr-checklist** — the `typecheck → lint → format → build` gate
- **api-layer-discipline** — thin routes, services own data access + business logic, factory DI, explicit types at boundaries
- **testing-discipline** — don't write tests unprompted; propose coverage gaps but ask before implementing
- **commit-discipline** — never commit or push without explicit approval; one-line Conventional Commits messages, no body
- **branch-discipline** — at the start of new work, confirm the current branch matches the task and surface uncommitted changes
- **planning-discipline** — every feature plan leads with the goal, shows a file tree with line deltas, calls out type/scope changes, lists risks and follow-ups, and surfaces open questions before execution
- **worktree-discipline** — when multiple agents share a repo, isolate each in a sibling git worktree (`../<repo>-worktrees/<branch>`); track it and auto-remove it (with a dirty/unpushed safety check) once the work is merged or done
- **self-review-discipline** — before opening a PR, adversarially review your own full diff for duplication, wrong-altitude code, and sprawling decision logic; emit actionable findings ordered by severity; propose, don't rubber-stamp or silently edit

### agents

- **code-reviewer** — reviews a diff/PR against project rules and conventions; returns a structured punch-list (read-only)
- **debugger** — investigates a reproducible bug (failing test, stack trace, wrong behavior) down to root cause, then proposes a small targeted fix + a test to lock it (read-mostly)
- **security-reviewer** — reviews a diff/PR for exploitable vulnerabilities, ranked by severity with a concrete attack path + minimal fix (read-only)
- **type-consolidator** — finds duplicate/near-duplicate TypeScript type definitions and proposes a consolidation plan (propose-first)

## Using `aic`

The name stands for **AI copy** — it installs assets out of this library into a project (copied) or onto your machine user-wide (symlinked). Short to type, same shape as the other three-letter helpers in `.my_aliases` (`gbl`, `hlp`).

`setup.sh` symlinks this folder to `~/.ai`, so `aic` can find it from anywhere.

```sh
aic                              # list everything
aic alpine-js                    # copy into ./.claude/skills/alpine-js/
aic alpine-js ~/projects/foo     # copy into ~/projects/foo/.claude/skills/alpine-js/

# User scope: symlink into ~/.claude/ so it tracks this repo (--global is an alias).
aic code-reviewer --user         # symlink ~/.claude/agents/code-reviewer.md -> ~/.ai/agents/...
aic todos -u                     # symlink ~/.claude/commands/todos.md -> ~/.ai/commands/...

# Rules append to a CLAUDE.md by default (same dest semantics as other categories):
aic code-hygiene                 # append to ./CLAUDE.md (created if missing)
aic code-hygiene ~/projects/foo  # append to ~/projects/foo/CLAUDE.md
aic code-hygiene --user          # append to ~/.claude/CLAUDE.md
aic code-hygiene --append FILE   # append to an arbitrary file
aic code-hygiene --stdout        # print to terminal (for piping)
```

## Source projects

Each asset here came from one of these projects (for traceability — the originals were not modified):

- `jmpr` — nothing extracted (design-system too specific; kept in place)
- `zebr-app-cms` — `add-task`, `todos`, `alpine-js`, `typescript-types` (generalized from `create-type`), `pre-pr-checklist`
- `eclario` — `code-hygiene` (from `thinking-reasoning.mdc` + conventions), `api-layer-discipline` (generalized from `smart-mirror-api-architecture.mdc`)
- `albert` — `self-review` skill + `self-review-discipline` rule (generalized from the `self-review` skill — project-specific spec/status files and persona/tool examples stripped)

## Adding a new asset

1. Drop the file under the right subfolder (e.g. `ai/commands/new-thing.md` or `ai/skills/new-thing/SKILL.md`).
2. Include frontmatter with a `description:` line — `aic` uses it for the listing.
3. Update the "Available assets" list above.
4. Commit and push; other machines get it on their next pull.
