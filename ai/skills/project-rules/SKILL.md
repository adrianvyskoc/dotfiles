---
name: project-rules
description: Write or extend a personal, non-team rule for the repo you are in — the private instructions that live in ~/.ai/projects/<name>.md and load via a gitignored CLAUDE.local.md stub. Use when the user says "add this to my rules for this project", "remember this for this repo", "make a personal/private rule", "don't commit this, it's just for me", or asks to set up personal project rules for a repo. Also use when a piece of guidance is repo-specific but must not land in the team's CLAUDE.md.
user_invocable: true
---

# Personal per-project rules

`~/.ai/projects/<name>.md` holds instructions that apply to **one repo** but must **never** be committed to it — because that repo's `CLAUDE.md` belongs to colleagues too. The file lives in the dotfiles repo (`~/.ai` is a symlink to `<dotfiles>/ai`) and is pulled into the project by a one-line, git-excluded `CLAUDE.local.md` stub.

## Step 0 — is this actually a personal project rule?

Route it before writing anything. Say the pick in one sentence and let the user redirect.

| The guidance… | Goes to | How |
|---|---|---|
| applies to this repo, **and the team should follow it** | the repo's own `CLAUDE.md` | edit + commit it there (normal review) |
| applies to this repo, **only to me** | `~/.ai/projects/<name>.md` | **this skill** |
| applies to **every** project | `<dotfiles>/ai/rules/<name>.md` | the `ai-add` skill, then `aic <name> --global` |
| is a fact to recall, not a behaviour to follow | memory | not a rule at all |

Two common misroutes: something the team would benefit from, hidden in a private file because it was faster than opening a PR — say so and offer the repo's `CLAUDE.md` instead. And something true of every repo (commit habits, planning format) written per-project — that belongs in `ai/rules/`.

## Step 1 — wire the repo up

From the repo root, run:

```sh
aic --project
```

It is idempotent, so it doubles as the "is this already wired?" check. It creates `~/.ai/projects/<name>.md` (seeded header only), points `CLAUDE.local.md` at it, and adds that stub to `.git/info/exclude` — never to the shared `.gitignore`. Report which of the three it actually created.

`<name>` comes from `--git-common-dir`, so a worktree resolves to the main repo. Two cases need an explicit name:

- **a sub-repo of an umbrella project** that should share the parent's rules → `aic --project <parent>` from inside it
- **the directory name differs from what you'd call the project** → pass the name you want

## Step 2 — read the existing file first

If `~/.ai/projects/<name>.md` already has content, **extend it** — add a section, or edit the section this contradicts. Do not append a near-duplicate of a rule that is already there, and do not restate anything the repo's committed `CLAUDE.md` already says. Existing files are the best guide to the house style: read `~/.ai/projects/ebox-app.md` or `eclario.md` before drafting.

## Step 3 — verify everything you are about to assert

Every path, command, remote, script name and hook referenced in the rule gets checked on disk first. A rule is read as ground truth and acted on without question, so a stale path in it is worse than no rule at all.

If something can't be verified, write it as the open question it is rather than as fact.

## Step 4 — write it

```markdown
### <Imperative title — the rule itself, not a topic label>

<One or two sentences stating the rule. Lead with what to do.>

- **Why:** <the reason — usually a past incident, a tool that misbehaves, or a strong preference>
- **How to apply:** <the concrete trigger and action — when this fires and what changes>
```

- **Titles are the rule, not the subject.** "Always push with `--no-verify`" beats "Pushing".
- **Why is not optional.** A rule without its reason gets misapplied the moment the situation shifts slightly.
- **Be specific to the point of naming things** — exact commands, exact paths, exact branch patterns, exact strings. Generic advice belongs in `ai/rules/`.
- **Write the rule in English even when it mandates another language** for the output — match the surrounding file.
- **State overrides loudly.** If the rule contradicts a global rule (e.g. a different worktree location than `worktree-discipline` prescribes), say which one it overrides and where.

What earns a place here: repo-local gotchas (a hook that hangs, generated files that get overwritten, GitLab instead of GitHub), language or format conventions for artifacts the repo produces, personal deviations from a global rule, and which paths in the repo are safe from its own tooling.

What does not: anything the team should follow, anything true of every project, restating the repo's own `CLAUDE.md`, and facts derivable from the code or git history.

## Step 5 — register it

Add or update the bullet under `### projects (personal, not installed by \`aic\`)` in `<dotfiles>/ai/README.md`, matching the existing entries: project name, then a comma-separated summary of what the file covers. Keep it in sync with the frontmatter `description:`.

## After writing

Report the file path and what was added. Do not commit — the commit-discipline rule applies; ask.

If the repo was already wired up before this session, the new rule is live in the next session (or after a `/clear`), not in the current context.
