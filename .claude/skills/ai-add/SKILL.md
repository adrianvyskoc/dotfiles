---
name: ai-add
description: Add a new asset (rule, command, skill, or agent) to the dotfiles ai/ library. Invoke when the user wants to create, extract, or formalize reusable Claude Code tooling — rules, slash commands, skills, or subagents — into their ai/ folder. Also fires on vague asks like "turn this into a rule", "make a skill for X", "automate this", or "extract Y into the library". Always classify the type before scaffolding.
user_invocable: true
---

# Add an asset to ai/

This repo's `ai/` folder is a library of reusable Claude Code assets. Assets are copied into projects (or globally) via the `aic` command. This skill walks through adding a new one.

**This skill is internal to the dotfiles repo — it lives in `.claude/skills/` and is not exported by `aic`.**

## Flow

1. **Classify** — pick the right asset type and say why
2. **Confirm** — let the user redirect before scaffolding
3. **Gather** — name, description, body
4. **Scaffold** — create file(s) under `ai/<type>/`
5. **Update README** — add the asset to `ai/README.md`'s "Available assets" list

Do not commit at the end — the commit-discipline rule applies. Tell the user the asset is ready and `aic <name>` now works.

## Step 1 — Classify

Pick the type that matches what the user is trying to create. Always say your pick and the reason in one sentence; let them redirect.

| Type | Pick when… | Location |
|------|-----------|----------|
| **rule** | Always-on guidance for how Claude should work — principles, discipline, conventions. Appends to a project's CLAUDE.md. | `ai/rules/<name>.md` |
| **command** | User-invoked action via `/name`. Explicit trigger; does something concrete (creates a file, lists state, runs a gate). | `ai/commands/<name>.md` |
| **skill** | Context-sensitive domain knowledge auto-invoked by keyword/description match. "When working on X, know Y." | `ai/skills/<name>/SKILL.md` (folder) |
| **agent** | Delegated work with its own context — code reviews, consolidation proposals, parallel research. | `ai/agents/<name>.md` |

### Heuristics

- "always do X" / "never do Y" / "prefer X over Y" / "before doing Z, make sure…" → **rule**
- "I want a `/X` command" / "slash command that does…" / "one-shot action" → **command**
- "when I'm editing React, know that…" / "idiomatic way to do X" / domain-specific knowledge → **skill**
- "review my diff against Y" / "find all duplicate Z" / "propose a plan for W" / read-only or parallelizable → **agent**

### Tiebreakers

- **Rule vs skill** — rule is always-on and general; skill is conditional on a topic. If it should apply to every task, it's a rule. If it only matters when a keyword/domain is in play, it's a skill.
- **Command vs skill** — command is user-typed (`/name`); skill is auto-triggered by context. If the user wants to invoke it explicitly, command. If Claude should notice on its own, skill.
- **Skill vs agent** — skill runs in the main context; agent runs in its own. If the work is big, read-only, or parallelizable, agent. If it's knowledge to apply inline, skill.
- **Rule vs command** — almost never ambiguous, but: if the user says "always X before committing", that's a rule, not a `/commit` command.

Example: "I always want Claude to run typecheck before opening a PR" → **rule** (always-on, guidance). Not a command (user isn't invoking it), not a skill (it's general discipline, not a domain).

## Step 2 — Confirm

State the pick plainly: *"This sounds like a **rule** because it's always-on guidance. Want me to go with that, or did you have a different type in mind?"*

If the ask is genuinely ambiguous, offer two options with a tiebreaker question. Don't scaffold until the user confirms.

## Step 3 — Gather

Ask for these in one message (not one question at a time):

- **Name** — kebab-case, short. Prefer discipline-suffix for rules (`commit-discipline`), action-verb for commands (`add-task`), topic for skills (`alpine-js`), role for agents (`code-reviewer`).
- **Description** — one line. Appears in frontmatter AND the README listing. Be specific enough that a grep of `aic`'s listing tells you if it applies.
- **Body** — the user may provide it, or you draft it from prior conversation context and show it for review.

If the user's prior message contained most of the content (e.g. they just explained a rule), draft the body from that and skip asking.

## Step 4 — Scaffold

File shape by type. Match the existing examples — open one in the same folder before writing to see the current convention.

### rule — `ai/rules/<name>.md`

```markdown
---
description: <one line>
---

## <Title>

- **<Principle>.** <One-line statement.>
  - **Why:** <reason — often a past incident or strong preference>
  - **How to apply:** <when/where this kicks in>
```

Reference: `ai/rules/testing-discipline.md`, `ai/rules/commit-discipline.md`.

### command — `ai/commands/<name>.md`

```markdown
---
description: <one line>
argument-hint: [optional args syntax]
---

<Body — what Claude should do when /<name> fires. Use $ARGUMENTS for the user-supplied arg string.>
```

Reference: `ai/commands/add-task.md`, `ai/commands/todos.md`.

### skill — `ai/skills/<name>/SKILL.md` (folder, not a single file)

```markdown
---
name: <name>
description: <one line — this is the trigger. Include keywords and scenarios, not just what the skill does. Answer: "when should Claude auto-invoke this?">
user_invocable: true
---

# <Title>

<Body — knowledge and rules. Favor examples with good/bad code over prose.>
```

Reference: `ai/skills/alpine-js/SKILL.md`, `ai/skills/api-error-handling/SKILL.md`.

Create the directory first (`ai/skills/<name>/`), then the `SKILL.md` inside.

### agent — `ai/agents/<name>.md`

```markdown
---
name: <name>
description: <one line — when to invoke this agent>
tools: <comma-separated tool allowlist, e.g. Read, Grep, Glob, Bash>
model: sonnet
---

# <Title>

<System prompt for the agent. State its role, inputs it may receive, what it does, and what it MUST NOT do (e.g. "never edit, commit, or push").>
```

Reference: `ai/agents/code-reviewer.md`, `ai/agents/type-consolidator.md`.

## Step 5 — Update ai/README.md

Add a bullet under the matching subheading in the "Available assets" section. Match the phrasing of existing entries (short, description-first).

```markdown
### rules
- …existing…
- **<name>** — <short description matching the frontmatter>
```

Keep the README and the frontmatter `description:` in sync. If the user tweaks one later, update both.

## After scaffolding

- Report: "Created `ai/<type>/<name>…` and updated README. `aic <name>` will now copy it into any project."
- Do not commit. Ask the user if they want to commit per the commit-discipline rule.
- If it's a skill or agent, they'll need to copy it into a project with `aic <name>` (or `--global`) before Claude can actually use it there.
