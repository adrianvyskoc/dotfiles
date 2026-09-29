---
description: Start work on an ebox-app Jira task — fetches the zadanie and its comments, provisions a worktree from origin/master, inspects the affected code, and proposes a solution to confirm before any implementation
argument-hint: <jira-url-or-ticket-key> [--here]
---

Start a new ebox-app task from its Jira ticket. This is the "ideme pracovať na tomto tasku" opener.

> **Read-only until the user confirms the proposal.** Create the worktree, read, analyze, propose — never implement, commit, or push in this command. Implementation starts only after the user says "poďme" / picks a variant.

Arguments: `$ARGUMENTS` — a Jira URL (`https://efabrica.atlassian.net/browse/EPIK-1234`, possibly wrapped in `<pasted_content>`), a bare ticket key (`EPIK-1234`), optionally followed by `--here`. Empty → ask for the ticket and wait. Do not guess a key.

Reply in the language the user wrote in. A bare `/start-task <url>` with no other words → Slovak.

## 1. Resolve the ticket

- URL → key from the path. Bare key → use as-is. Any `<PREFIX>-<n>` project key is valid (`EPIK`, `EPIKRO`, `EPIKSK`, `HB`, …).
- Keep the browse URL: `https://efabrica.atlassian.net/browse/<KEY>`.

## 2. Fetch the zadanie — description AND comments

Try in order; stop at the first that yields content:

1. **Atlassian Rovo MCP** (load via ToolSearch when deferred). Two calls, both with `cloudId: "efabrica.atlassian.net"`:
   - `getTeamworkGraphObject` with `objects: ["<browse URL>"]` → summary, description, status, links.
   - `getTeamworkGraphContext` with `objectType: "JiraWorkItem"`, `objectIdentifier: "<KEY>"`, `detailLevel: "full"`, `targetObjectTypes: ["JiraWorkItemComment"]` → the comments.
2. **Ask the user to paste** the ticket text. Never start from a bare title.

**Comments are mandatory reading, not optional.** In this project the bug analysis, the backend's position, and scope narrowing regularly live in the comments (look for `[BUG-ANALYSIS]`-style comments from colleagues). A comment that says "outside FE" or "backend will handle X" changes the whole proposal.

Extract, quoting ticket text where it matters:

- what is broken / what is wanted, expected vs actual
- acceptance criteria and explicit out-of-scope notes
- Figma links (description or comments), spec PDFs, screenshots
- environment hints: CZ / RO / SK instance, page/route, device

Attachments and inline images do not come through the MCP. If the ticket says "viď obrázok" / "see screenshot", ask the user to paste it — do not pretend to have seen it. If the user gave a local PDF path, read it.

## 3. Worktree — the default, unless `--here`

- `--here` → stay in the current tree; say so and skip to step 4.
- If `git branch --show-current` already starts with `<KEY>` → the task is already checked out; say so and skip to step 4.
- If `git worktree list` already has a worktree for a `<KEY>/…` branch → `EnterWorktree` with its `path`; do not create a second one.
- Otherwise create it with `EnterWorktree`, `name: "<KEY>/<slug>"`:
  - `<slug>` is English kebab-case, 2–5 words, derived from the ticket summary (`EPIK-16858/support-email-mailto-link`). The branch name must lead with the key — `CHANGELOG.md` and the MR title take the key from it.
  - Base is `origin/master` (the default `worktree.baseRef`). Do not branch from a local branch.
- Then, inside the worktree, in one command:
  1. `git branch --unset-upstream 2>/dev/null` — so a bare `git push` can never land on master.
  2. `pnpm install --frozen-lockfile` — required, not optional: `prepare` runs `sync:ai`, which generates the gitignored `CLAUDE.md`, `.claude/skills/` and `.claude/agents/`. Without it the fresh worktree has **no team rules loaded**. It also runs `nuxt prepare`, which typecheck needs.
  3. `cp <main-root>/.env.local <main-root>/localhost.pem <main-root>/localhost-key.pem .` — so a dev server can start later. Do **not** start it now; when asked, use a port the main tree is not using (append `NUXT_PUBLIC_DEV_SERVER_URL=https://localhost:<port>` to the worktree's `.env.local`).

Report one line: `Worktree: <path> · branch <KEY>/<slug> · z origin/master`.

## 4. Inspect the code

The ticket names symptoms; the code names files. Before proposing anything:

- **Bug ticket** → follow the analysis steps of the team skill `.ai/skills/analyze-bug/SKILL.md` (fallback `.claude/skills/analyze-bug/SKILL.md`): trace the execution path, compare expected vs current, find the root cause with `path:line`. Do not produce its Jira-ready output format — the output shape is defined in step 5.
- **Feature / change ticket** → use the team skill `trace-implementation` on the affected area: owner components, composables, stores, API schema in `app/services/api/validations.ts`, existing pattern for the same kind of change (another modal, another block, another tracking event…).
- **UI involved and a Figma link exists** → open it with the Figma MCP (`get_screenshot`, `get_design_context` on the linked node). Logic-only bug → skip Figma and say so in one line.
- Check `git log` of the owner files when the ticket references earlier tickets — the previous change often explains the current bug.

Distinguish **confirmed** (read in code, cite `path:line`) from **inferred** and **needs verification**.

## 5. Output — the proposal to confirm

Keep it short. The reader has ADHD; the point is to confirm or redirect in one reply.

```
Worktree: <path> · branch <KEY>/<slug> · z origin/master

## Zhrnutie zadania
3–6 bullets in plain words: what is wrong / wanted, where (route, component, instance), what the comments add or rule out.

## Čo som našiel v kóde
Bullets, each with path:line. Confirmed vs inferred marked.

## Návrh riešenia
The plan per planning-discipline: Goal, then Open questions, Out of scope, File changes tree (est), Totals, Risks — only the sections that earn their place.
When there is a real fork (literal ticket vs. better fix, two components to change vs. shared util), give 2–3 ranked variants with one-line trade-offs, recommendation first.

## Otázky
Numbered, answerable in one word each. Always include:
- the Azure work item number for the CHANGELOG entry (or "internal")
- anything the ticket leaves ambiguous, quoting the ambiguous sentence
```

End with exactly one line: what the user should answer or say to start implementation.

## Rules

- Never implement, commit, push, or touch Jira/GitLab in this command. The worktree provisioning (step 3) is the only write.
- Never invent requirements. Anything you add beyond the ticket is a **proposal**, labelled as such.
- If the ticket and the code contradict each other (the ticket describes behaviour that does not exist, or asks for something the backend contract forbids), report the conflict — do not pick a side silently.
- If the ticket turns out to be not-FE (third-party script, backend-only), say so up front and propose moving it, before any plan.
- After the user confirms, the ordinary rules apply: branch `<KEY>/<slug>`, commit `[<KEY>] <summary>`, `CHANGELOG.md` entry in English, MR description in Slovak, push with `--no-verify`. They are in `CLAUDE.local.md`; do not restate them here.
