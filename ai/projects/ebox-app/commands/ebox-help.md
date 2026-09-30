---
description: List everything available in this ebox-app session — private and team slash commands, global commands and skills, agents, MCP servers and my private rule sections — with a usage example per command
argument-hint: [filter-word | command-name]
allowed-tools: Bash(ls:*), Bash(sed:*), Bash(grep:*), Bash(basename:*), Bash(dirname:*), Bash(cut:*), Bash(head:*)
---

Show what this session can do. The lists below are generated live from disk, so they never go stale.

Arguments: `$ARGUMENTS` — empty → the full overview. A word → show only items whose name or description contains it (`/ebox-help review`). An exact command or skill name → print that one item's full description, its argument hint and two usage examples (`/ebox-help sync`).

## Live inventory

### Private commands (`.claude/commands/`, symlinked from `~/.ai/projects/ebox-app/commands/`)

!`for f in .claude/commands/*.md; do [ -e "$f" ] || continue; n=$(basename "$f" .md); a=$(sed -n 's/^argument-hint: *//p' "$f" | head -1); d=$(sed -n 's/^description: *//p' "$f" | head -1 | cut -c1-220); echo "- /$n $a — $d"; done`

### Team skills (`.ai/skills/`, generated into `.claude/skills/` by `pnpm sync:ai`)

`[manual]` = only runs when I type `/name`; `[auto]` = Claude also loads it by itself when the topic comes up.

!`for f in .ai/skills/*/SKILL.md; do n=$(basename "$(dirname "$f")"); m=$(grep -q '^disable-model-invocation: true' "$f" && echo "[manual]" || echo "[auto]"); d=$(sed -n 's/^description: *//p' "$f" | head -1 | cut -c1-200); echo "- /$n $m — $d"; done`

### Global commands and skills (`~/.claude/commands/`, `~/.claude/skills/`)

!`for f in ~/.claude/commands/*.md; do [ -e "$f" ] || continue; n=$(basename "$f" .md); d=$(sed -n 's/^description: *//p' "$f" | head -1 | cut -c1-160); echo "- /$n — $d"; done; for f in ~/.claude/skills/*/SKILL.md; do n=$(basename "$(dirname "$f")"); grep -q '^user_invocable: true' "$f" || continue; d=$(sed -n 's/^description: *//p' "$f" | head -1 | cut -c1-160); echo "- /$n — $d"; done`

### Agents (`.claude/agents/` team, `~/.claude/agents/` mine)

!`ls .claude/agents 2>/dev/null | sed 's/\.md$//; s/^/- team: /'; ls ~/.claude/agents 2>/dev/null | sed 's/\.md$//; s/^/- mine: /'`

### MCP servers configured for this repo (`.ai/mcp.json`)

!`sed -n 's/^ *"\([^"]*\)": *{.*/- \1/p' .ai/mcp.json 2>/dev/null | grep -v -E '^- (mcpServers|env)$'`

### My private rules (`CLAUDE.local.md` → `~/.ai/projects/ebox-app.md`)

!`grep '^### ' ~/.ai/projects/ebox-app.md | sed 's/^### /- /'`

## How to render it

- No argument → print the groups above in this order: **Task lifecycle** (`start-task`, `sync`, `review-task`, `review-branch`, `analyze-mr`, `verify-feature`, `test-debug`), **Scaffolding** (`new-stories`, `new-block`, `add-tracking-event`, `add-icon`, `env-variable-creation`, `new-translation`), **Reference skills** (the rest of the team skills, one line each), **Global**, **Agents**, **MCP**, **My rules**. One line per item: `/name <args>` and a real example invocation from this repo (an `EPIK-…` key, a path under `app/components/…`, an MR IID). Keep each group to at most 7 lines; if a group is longer, show the 7 most used and say how many more.
- With a filter word → only the matching lines, all groups, no examples unless there is a single match.
- With an exact name → read that file (`.claude/commands/<name>.md` or `.ai/skills/<name>/SKILL.md`) and print: what it does in two sentences, its arguments, two example invocations, and whether it writes anything (git, files, GitLab, Jira).
- End with one line: `Private commands live in ~/.ai/projects/ebox-app/commands/ — edit there, then aic --project.`
- Do not run anything else. This command is read-only and prints the list; it never invokes the commands it lists.
