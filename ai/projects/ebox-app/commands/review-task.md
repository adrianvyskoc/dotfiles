---
description: Code review of the current ebox-app branch validated against its Jira task — fetches the zadanie, runs the team review-branch checklist, and reports requirement coverage
argument-hint: [jira-url-or-ticket-key]
---

Review the current branch against **both** its base branch and the Jira task it implements.

> **Read-only.** Never write or modify code, never change git state, never post to GitLab or Jira. The output is a report for the user.

Arguments: `$ARGUMENTS` — a Jira URL (`https://efabrica.atlassian.net/browse/EPIK-1234`), a bare ticket key (`EPIK-1234`), or empty.

## 1. Resolve the ticket

- URL → take the key from the path. Bare key → use as-is. Any `<PREFIX>-<n>` project key is valid (`EPIK`, `EPIKRO`, `HB`, `Falcon`, …).
- Empty → derive it from the branch name: branches are `<TICKET-KEY>/<slug>` (e.g. `EPIK-15862/stats-drawer-design-fixes`), so take the segment before the first `/` of `git branch --show-current`. Say explicitly that the key was derived from the branch.
- Nothing matches → ask the user for the ticket. Do not guess.

## 2. Fetch the zadanie

Try in order; stop at the first source that yields the ticket content:

1. **Atlassian MCP** — if Atlassian/Jira MCP tools are available (load via ToolSearch when deferred), fetch the issue: summary, description, acceptance criteria, and any comments that refine scope.
2. **WebFetch** on `https://efabrica.atlassian.net/browse/<KEY>` (anonymous access usually fails — that's expected, move on).
3. **Ask the user to paste** the task text. Never review against a bare title — a review "podľa zadania" without the zadanie is worthless.

From whatever was obtained, extract: functional requirements, acceptance criteria, edge cases the ticket names, explicit out-of-scope notes, and Figma/design links (list them; do not fetch designs unless asked).

## 3. Technical review — reuse the team skill, don't duplicate it

Read `.ai/skills/review-branch/SKILL.md` at the repo root (fallback: `.claude/skills/review-branch/SKILL.md`) and perform the full review it describes on the current branch vs its base. That skill owns the technical checklist — do not restate, trim, or replace it here.

## 4. Validate against the zadanie

Compare the branch diff (`git diff <base>...HEAD`) with the extracted requirements:

- **Coverage** — for each requirement: implemented (cite `path:line`) / partial / missing.
- **Scope creep** — meaningful changes in the diff with no backing in the ticket. Flag them, don't condemn them — they may be intentional.
- **Edge cases** — cases named in the ticket that the diff does not handle.
- **Unverifiable criteria** — acceptance criteria that cannot be proven from code alone; turn each into a numbered manual step (`Krok: … → Expected: …`), reusable for the MR test cases.
- If the ticket and the implementation contradict each other, report the conflict — never silently pick a side.

## 5. Output

One combined report:

### Task

`<KEY>` — title, one-line summary, link.

### Technical review

The full review-branch output, in that skill's own format.

### Súlad so zadaním

| Requirement | Status | Where / note |
| --- | --- | --- |

Then: **Scope creep**, **Unhandled edge cases**, **Manual checks** (numbered `Krok → Expected`).

### Verdict

Exactly one: implements the zadanie / implements with gaps (list them) / mismatch — needs clarification.

## Rules

- Distinguish confirmed (from diff/code) vs inferred vs needs-verification.
- Do not invent requirements the ticket doesn't state; when flagging something as missing, quote the ticket text it comes from.
- Every actionable finding cites `path:line`.
