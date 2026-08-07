---
description: Personal (non-team) instructions for the eclario harness — loaded via a gitignored CLAUDE.local.md stub, never checked into the repo
---

## eclario — personal notes

Repo: `~/Documents/development/eclario` · remote `https://github.com/eclario/eclario-harness.git` · umbrella harness holding 8 independently-versioned sub-repos.

These are **my** rules. The project's shared rules live in the harness `CLAUDE.md` and in each sub-repo's own `CLAUDE.md` — do not restate them here.

### Issues for `eclario-app` are written in Slovak, for an agent to execute

**Trigger:** creating a *separate* issue on `eclario/eclario-harness` labelled `app` — work that belongs in `eclario-app` and is **not** being implemented in the current session. It gets handed to an agent later, by me, in a fresh context.

This applies to the `app` label only. Issues labelled `api`, `esp32`, `display`, `web`, `shared` or `harness` stay in English in the existing style. The tracker is deliberately mixed — do not "fix" the language of existing issues in either direction.

**Reference implementation: issue #80.** Read it before writing a new one (`gh issue view 80 -R eclario/eclario-harness`) — it is the shape these follow, and it is more reliable than this description.

#### Slovak — title and body

Both. This holds even when the session ran in English, and even when the spec, code and API responses are English. Do not ask which language to use; do not draft it in English "to be translated later".

- **Why:** I am the one who reads these and dispatches them, and #80 set the precedent.
- **How to apply:** technical identifiers are **not** translated — file paths, endpoints, field names, type values (`half_smart`), labels, commands and the exact error strings the API returns stay verbatim. Translate the prose around them. Product-level terms follow the spec's wording ("full display mirror", "half-smart mirror"), not the raw enum value.

#### As short as possible — but no implementation detail dropped

Brevity is a constraint on *filler*, not on detail. The issue should be readable in a minute and still leave nothing for the agent to guess.

- **Cut:** restating the spec, recapping the conversation, background the reader already has, hedging, motivation. If a sentence does not change what gets built, delete it.
- **Never cut:** exact file paths (with line numbers when pointing at a specific line), method + endpoint, field names with their types, the exact user-visible strings, the exact error message the API returns, and the concrete numbers (TTLs, poll intervals, timeouts).
- **Shape:** numbered list for the steps, one **bold lead-in** per step. Table for field lists — never a paragraph. Prose only for the lead-in paragraph, which says what the user gets and what is wrong today.

#### Required section: `## Kontext pre agenta`

One fenced code block that I can copy whole in a single click and paste to an agent working in `eclario-app`.

- **Why:** the agent starts in `eclario-app` with no harness checked out beside it and no memory of the session the issue came out of. Everything it needs has to be inside that one block, or it starts by guessing.
- **How to apply:** treat the block as a **prompt, not documentation**. Plain text, short lines, no markdown headings inside it — it gets pasted, not rendered. Paths inside are relative to the `eclario-app` root; cross-repo paths carry the repo prefix (`eclario-api/src/routes/mirrors/index.ts:57-80`).

A fact that lives only in `docs/spec/`, `docs/technical/` or `eclario-api/` must be **restated** in the block. A bare link is not enough — add the pointer *after* the fact, never instead of it.

Contents, in this order:

1. **Repo, stack, package manager.** Always spell out `npm (nie pnpm)` — `eclario-app` is the only sub-repo with a `package-lock.json`, everything else is pnpm, and an agent will reach for pnpm by default.
2. **Goal** — one sentence, what the app should do when this is done.
3. **Data** — endpoint + method + auth, and the exact fields with types. Say explicitly when no other endpoint exists.
4. **Where the plumbing lives** — base URL (`constants/api.ts`), token (`utils/authStorage.ts`), and whatever else the task touches. Verify these paths before writing them.
5. **How it really behaves** — timing, edge cases, degraded modes, with the source file that proves it. This is the part that stops the agent from writing something plausible and wrong.
6. **What the API enforces** — gating rules and the literal error string returned on violation.
7. **Traps in the app** — duplicate local types, hardcoded values, anything the agent would otherwise copy and multiply.
8. **Pointers last** — spec file(s) and the API-side implementation.

Keep out of the block: scope discussion, my open questions, and cross-issue dependencies — those live in their own sections below. The one exception is a hard blocker, which gets a single line saying what is blocked and what can proceed without it.

#### Section order

Follow #80: lead paragraph → `## Čo treba spraviť` → `## API / volania` (only when there is an API surface) → `## Kontext pre agenta` → `## Mimo rozsah` → `## Závislosti`. Skip any section that would be empty rather than filling it with a placeholder.

#### Verify before writing

Every path, line number, field name and error string goes into the issue only after being checked on disk — in `eclario-app`, `eclario-api` and `eclario-shared` as applicable.

- **Why:** a stale path in the context block sends the agent to the wrong file with full confidence. That is worse than omitting it, because it reads as verified.
- **How to apply:** if something cannot be verified, say so in the issue in one line ("`lastSeenAt` — ešte neexistuje — #79") instead of writing it as fact.

### Where this rule is loaded

`aic --project` derives the name from the repo directory, so the harness root resolves to `eclario` and loads this file. The sub-repos are separate gits and resolve to their own names — inside one, wire it to this same file explicitly:

```sh
cd eclario-app && aic --project eclario
```
