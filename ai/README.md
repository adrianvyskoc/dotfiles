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

## Available assets

### commands

- **add-task** — creates `tasks/<slug>.md` with a standard planning template
- **todos** — lists all files in `tasks/` with status + one-line goal

### skills

- **alpine-js** — idiomatic Alpine.js for CDN-loaded, server-rendered HTML/JSX (no build step)
- **typescript-types** — decision framework for shared vs local types, organization by domain

### rules

- **code-hygiene** — explain before implement, prefer explicit, ask when unclear, no TODOs without context
- **pre-pr-checklist** — the `typecheck → lint → format → build` gate
- **api-layer-discipline** — thin routes, services own data access + business logic, factory DI, explicit types at boundaries

### agents

_(none yet — reserved for future extractions)_

## Using `aic`

The name stands for **AI copy** — it copies assets out of this library into a project (or globally). Short to type, same shape as the other three-letter helpers in `.my_aliases` (`gbl`, `hlp`).

`setup.sh` symlinks this folder to `~/.ai`, so `aic` can find it from anywhere.

```sh
aic                              # list everything
aic alpine-js                    # copy into ./.claude/skills/alpine-js/
aic alpine-js ~/projects/foo     # copy into ~/projects/foo/.claude/skills/alpine-js/
aic todos --global               # install globally at ~/.claude/commands/todos.md

# Rules append to a CLAUDE.md by default (same dest semantics as other categories):
aic code-hygiene                 # append to ./CLAUDE.md (created if missing)
aic code-hygiene ~/projects/foo  # append to ~/projects/foo/CLAUDE.md
aic code-hygiene --global        # append to ~/.claude/CLAUDE.md
aic code-hygiene --append FILE   # append to an arbitrary file
aic code-hygiene --stdout        # print to terminal (for piping)
```

## Source projects

Each asset here came from one of these projects (for traceability — the originals were not modified):

- `jmpr` — nothing extracted (design-system too specific; kept in place)
- `zebr-app-cms` — `add-task`, `todos`, `alpine-js`, `typescript-types` (generalized from `create-type`), `pre-pr-checklist`
- `eclario` — `code-hygiene` (from `thinking-reasoning.mdc` + conventions), `api-layer-discipline` (generalized from `smart-mirror-api-architecture.mdc`)

## Adding a new asset

1. Drop the file under the right subfolder (e.g. `ai/commands/new-thing.md` or `ai/skills/new-thing/SKILL.md`).
2. Include frontmatter with a `description:` line — `aic` uses it for the listing.
3. Update the "Available assets" list above.
4. Commit and push; other machines get it on their next pull.
