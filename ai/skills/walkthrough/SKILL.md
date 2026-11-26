---
name: walkthrough
description: Explain a change you made so a human can review it by understanding what, how and why - not by reading a diff top to bottom. Produces a verified walkthrough.json (requirements -> decisions with provenance and rejected alternatives -> scenarios -> call trace with edge cases) and a self-contained HTML viewer. A deterministic checker flags assumptions, unrequested changes, untested scenarios and unhandled edge cases. Use when the user asks for a walkthrough, "explain what you changed", "why did you do it this way", "help me review this", or after a large AI-written change they need to understand.
user_invocable: true
---

# Walkthrough

A review aid for **AI-written changes**. The reviewer wants three answers: **what** was built (scenarios), **how** it runs (call trace), **why** it is this way (decisions). The diff shows none of them directly.

Your own explanation is not evidence. You wrote the code and you write the story, so both can share the same wrong assumption. That is why this skill has a checker: **the narrative is a claim, the checker verifies what can be verified, and the viewer points the human at the rest.**

## Flow

1. **While working**, keep a decision log: append one line per non-obvious choice to `.walkthrough/log.md`. Do it at decision time. A reason reconstructed afterwards is a rationalisation.

   ```
   D: <what you chose> | why: <reason> | source: request:"<exact words>" | codebase:<file:line> | rule:<file> | assumption | rejected: <option> because <reason>
   ```

2. **After the last edit**, write `.walkthrough/<slug>.json` (format below). Line numbers refer to the working tree, so write it last and rerun the checker after any further edit.
3. **Check**: `node ~/.ai/skills/walkthrough/scripts/check.mjs .walkthrough/<slug>.json`. Fix every `error`. Fix warnings, or leave them if they are true (an untested scenario is a fact to show, not hide).
4. **Render**: `node ~/.ai/skills/walkthrough/scripts/render.mjs .walkthrough/<slug>.json` writes `.walkthrough/<slug>.html`, one self-contained file.
5. **Report in chat**: the HTML path, the checker's stats line, and the three things you would look at first (assumptions, unhandled edges, unrequested changes). Do not say "verified" beyond what the checker verifies (see Limits).

`.walkthrough/` is never committed. If `git status` shows it, tell the user instead of adding it; suggest `echo .walkthrough/ >> .git/info/exclude`.

## Authoring rules

- **Requirements** are split from the user's request, each with an exact `quote`. No quote means you inferred it; the checker warns.
- **Provenance is honest.** `request` (exact words, substring-checked), `codebase` (a `file:line` showing the pattern you followed), `rule` (a CLAUDE.md or rule file, optional `quote`), else `assumption`. A decision you cannot source is an assumption. Writing `codebase` for something you invented is the one thing that defeats this tool.
- **Rejected alternatives matter more than the chosen option.** Give at least one per non-trivial decision; that is what lets the reviewer disagree.
- **Edge cases are adversarial.** Mark each `handled` (with `at`: where), `unhandled` (you know it breaks) or `unknown` (nobody checked). Do not list only the cases you handled. Hunt for the others: empty, zero, wrong type, both sides overflow, concurrent, throws.
- **Steps** follow one scenario. `at` is the function's declaration line (`fn` must appear within 3 lines of it). `touches` lists the changed ranges the step runs through; without it the whole `at` range counts. `parent` + `when` model branches; leave `when` out for straight chains.
- **Docs, types, config, comments** have no runtime path: set `"noFlow": true` on the decision that covers them.
- **Anything you changed that was not requested** goes in `extras` with a note. Declared extras are a warning; undeclared changed lines are an error (`unrequested-hunk`). Never pad decisions to make the checker pass.
- `base` is the git ref the diff starts from (default `HEAD`, i.e. uncommitted work). Use `origin/main` for a branch. `scope` limits which paths are judged, `ignore` excludes some.

## Format

```jsonc
{
  "version": 1,
  "title": "short title",
  "base": "origin/main",                      // diff base, default HEAD
  "scope": ["src/"],                          // optional path prefixes/globs
  "request": "the user's request, verbatim",
  "requirements": [{ "id": "R1", "text": "...", "quote": "exact words from request" }],
  "decisions": [{
    "id": "D1", "requirement": "R1",
    "title": "...", "chosen": "...", "why": "...",
    "alternatives": [{ "option": "...", "rejected_because": "..." }],
    "provenance": { "kind": "request|codebase|rule|assumption", "ref": "quote or file:line", "quote": "rule only" },
    "noFlow": false,                          // true for docs/types/config
    "changes": ["src/a.ts:10-30"]             // changed ranges this decision explains
  }],
  "scenarios": [{
    "id": "S1", "requirement": "R1",
    "title": "...", "trigger": "what starts it", "input": "...", "result": "... incl. side effects",
    "tests": ["src/a.test.ts#name of the test"],   // empty = untested
    "steps": [{
      "id": "S1.1", "fn": "handler", "kind": "new|modified|unchanged",
      "at": "src/a.ts:12", "touches": ["src/a.ts:12-20"],
      "does": "one line: its job in the pipeline",
      "in": "input", "out": "output", "effects": "side effects (optional)",
      "parent": "S1.0", "when": "branch condition (optional)",
      "edges": [{ "case": "...", "state": "handled|unhandled|unknown", "at": "src/a.ts:15", "note": "..." }]
    }]
  }],
  "extras": [{ "ref": "src/b.ts:5-9", "note": "what and why, not requested" }]
}
```

A complete real example (a past commit, reconstructed) is in `~/.ai/skills/walkthrough/example/walkthrough.json`.

## What the checker verifies

- every `file:line` exists; `request` and `quote` strings are substrings of the request / rule file; test files exist and named tests appear in them
- each step's `fn` name appears near its `at` line
- every changed line in the diff is covered by a decision (why) and a step (how); lines covered by neither are `unrequested-hunk` errors
- every requirement has a decision and a scenario; every scenario has a test or is flagged

## Limits (say these out loud when reporting)

- It cannot check that a `why` is true, only that it has a source and that the source exists.
- `handled` means you claim a line handles the case; the checker confirms the line exists, not that it handles it. The reviewer reads the highlighted code.
- Line coverage is positional, not semantic: a decision pointing at the right lines with the wrong explanation passes.
- The trace is only as complete as the scenarios you chose. Untraced paths are invisible.
