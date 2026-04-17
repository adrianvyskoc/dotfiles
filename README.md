# dotfiles

Personal shell configuration, tracked in git so the same setup works on every machine.

Currently manages:

- `.my_aliases` — universal shell aliases for git, node/npm/pnpm/bun, and directory navigation.
- `.my_aliases.machine` — aliases tied to this machine's directory layout (e.g. `goto`). Tracked, but kept separate so the universal file stays clean. Sourced automatically from `.my_aliases`.
- `ai/` — reusable AI tooling library (Claude Code commands, skills, rules, agents). Symlinked to `~/.ai` and copied into projects via the `aic` command. See [`ai/README.md`](ai/README.md).

## Install on a new machine

```sh
git clone <this-repo> ~/Documents/development/dotfiles
cd ~/Documents/development/dotfiles
./setup.sh
source ~/.zshrc
```

`setup.sh` is idempotent — safe to re-run. It:

1. Symlinks `~/.my_aliases` → `./.my_aliases`.
2. Symlinks `~/.my_aliases.machine` → `./.my_aliases.machine`.
3. Symlinks `~/.ai` → `./ai`.
4. Appends `source ~/.my_aliases` to `~/.zshrc` if not already present.

## Adding or editing aliases

Edit `.my_aliases` in the repo directly (the symlink in `$HOME` points here), then:

```sh
reload   # alias for: source ~/.zshrc
```

Commit and push to sync across machines.

## AI library (`aic`)

`ai/` holds reusable Claude Code assets (slash commands, skills, CLAUDE.md rule fragments, subagent definitions). `setup.sh` symlinks it to `~/.ai`, and the `aic` shell function (defined in `ai/aic.sh`, sourced from `.my_aliases`) copies assets out of that library into any project.

The name: **aic** = _**AI** **c**opy_ — short, easy to type, and mirrors the shape of the other three-letter helpers in `.my_aliases` (`gbl`, `hlp`).

### Listing

```sh
aic              # print every asset grouped by category, with its one-line description
aic --list       # same as above
```

### Copying into a project

```sh
aic <name>                   # copy into ./.claude/<category>/...   (the current directory)
aic <name> <dest>            # copy into <dest>/.claude/<category>/...
aic <name> --global          # copy into ~/.claude/<category>/...   (available to every project)
```

Routing by category:

| Category   | `aic <name> [dest]` destination                                   | `aic <name> --global` destination |
| ---------- | ----------------------------------------------------------------- | --------------------------------- |
| `commands` | `<dest>/.claude/commands/<name>.md`                               | `~/.claude/commands/<name>.md`    |
| `skills`   | `<dest>/.claude/skills/<name>/` (whole folder)                    | `~/.claude/skills/<name>/`        |
| `agents`   | `<dest>/.claude/agents/<name>.md`                                 | `~/.claude/agents/<name>.md`      |
| `rules`    | appended to `<dest>/CLAUDE.md` (created if missing)               | appended to `~/.claude/CLAUDE.md` |

### Rules

Rules are CLAUDE.md fragments, not a native Claude Code concept — they're meant to be merged into a `CLAUDE.md`. `aic <rule>` appends the fragment to the project's `CLAUDE.md` by default; same dest semantics as the other categories.

```sh
aic code-hygiene                        # append to ./CLAUDE.md (created if missing)
aic code-hygiene ~/projects/foo         # append to ~/projects/foo/CLAUDE.md
aic code-hygiene --global               # append to ~/.claude/CLAUDE.md (global Claude Code instructions)
aic code-hygiene --append path/to/file  # append to an arbitrary file (not necessarily CLAUDE.md)
aic code-hygiene --stdout               # print to terminal only (for piping)
```

### Examples

```sh
# Seed a fresh project with task commands + Alpine.js skill + code-hygiene rule
cd ~/projects/new-app
aic add-task
aic todos
aic alpine-js
aic code-hygiene                  # appends to ./CLAUDE.md

# Install the task commands globally so every project gets them for free
aic add-task --global
aic todos --global
```

### Adding a new asset

1. Drop the file under `ai/<category>/<name>.md` (or `ai/skills/<name>/SKILL.md` for skills).
2. Include YAML frontmatter with a `description:` line — `aic` uses it for the listing.
3. Update `ai/README.md`'s "Available assets" section.
4. Commit and push — every machine picks it up on the next pull.
