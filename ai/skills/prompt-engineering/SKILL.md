---
name: prompt-engineering
description: Write or revise a system prompt for an LLM agent or assistant — distilled prompt-engineering best practice tuned for modern Claude models
user_invocable: true
---

# Prompt Engineering

How to **write or edit the system-prompt text** of an LLM agent or assistant so it is clear,
consistent, and tuned for the way modern Claude models follow instructions. This is the *craft of
the text* — not the mechanical wiring (where the prompt is stored, how it's registered, what tools
it's granted). Keep those concerns separate; this skill only shapes the words.

## The single most important rule: don't repeat the shared base

Most agent prompts are layered **on top of** a shared base — a global system prompt, common
guardrails, an auto-assembled context block, the current date, retrieved context, etc. The full
prompt the model sees is usually `your text + shared base + injected context`.

So your prompt should contain **only** what is unique to *this* agent: its **role, behavior, domain
expertise, and its own boundaries**. It must NOT restate anything the shared layer already provides.

Common things that usually live in a shared layer — do **not** repeat them in an individual prompt:

| Often already shared — do NOT repeat | Typically lives in |
| --- | --- |
| Be-concise / chat-not-essays | shared guardrails |
| Honesty (say when a tool fails, don't pretend) | shared guardrails |
| Tool & approval discipline (don't retry rejected actions) | shared guardrails |
| Generic safety / refusal rules | shared guardrails |
| Available tools and how to call them | tool definitions / runtime |
| Today's date, environment, retrieved documents | assembled context |

If you catch yourself writing "be honest", "be concise", or "you can use these tools…" — stop.
It's probably already there, and duplicating it dilutes the prompt and invites drift. **Read the
shared base first** so you know exactly what you're standing on.

## A clean default shape

A focused system prompt reads best as **plain prose under simple labels**, not heavy XML:

```
You are a <one-line role>.

Role:
- <what this agent is for, in 1–3 bullets>

How you work:
- <the judgment/behaviors specific to this agent>

Boundaries:
- <what it must NOT claim or do; must match its real capability>
```

- **Lead with the role.** `You are a <role>.` anchors what the agent is — it is foundational, not
  decorative. The label order is deliberate: who it is → what it does → how it behaves → what it must
  not do. Put critical, defining instructions at the top, where the model weights them most.
- **Prose under labels, not `<xml_tags>`.** XML structure earns its place when you're mixing
  instructions, context, and examples in a long prompt. A short prompt doesn't need it — prefer the
  simple `Role:` / `How you work:` / `Boundaries:` labels and stay consistent.
- **`Boundaries:` only when the agent is genuinely limited.** A general assistant may have none; a
  read-only specialist does. State limits as capability facts (e.g. *"read-only — never claim to
  have written or shipped anything"*).

## Principles (the distilled best practice)

Drawn from the Anthropic and OpenAI prompting guides and general system-prompt practice, kept to
what actually matters:

1. **Be specific, not fuzzy.** Replace vague adjectives with concrete behavior. *"Browse the tree,
   open the relevant files, and search the code before answering"* beats *"be thorough."* The
   colleague test: a teammate with no context should be able to act on the line.
2. **Give the *why*, briefly.** A motivated instruction generalizes better than a bare command —
   the model extends the intent. *"…so the answer is grounded in what the source actually says"*
   teaches more than *"always read the files."* (Keep it to a clause in a short prompt.)
3. **Say what to do, not what to avoid.** Prefer the positive form. *"Locate the user-facing copy
   and work on those files"* over *"don't edit random files."*
4. **State boundaries as facts about capability.** What the agent *cannot* do, and what it must
   *never claim*. This is the main hallucination guard at the prompt level.
5. **Tune for modern Claude — don't shout.** Current models follow instructions literally and
   **overtrigger on emphatic language**. Write *"Use the search tools to confirm when unsure"*, not
   *"CRITICAL: you MUST ALWAYS use…"*. Reserve ALL-CAPS / "never" for true safety limits, not
   ordinary guidance.
6. **Match prompt style to desired output.** A concise, prose prompt nudges concise, prose replies;
   a structured, example-heavy prompt nudges structured output. Write the prompt in the register you
   want back. Don't pad.
7. **Consistent terminology.** Use one word per concept (don't mix "repository"/"repo"/"project"
   /"codebase" interchangeably) so the instructions read as a clean contract.
8. **Outcome over instruction.** Frame the role by what the user gets, not just the steps the agent
   runs.
9. **No overlap, no contradiction.** The text must not fight the shared base, the agent's
   description, or its real tool access. If the words and the real capabilities disagree, that's a
   bug — fix the words or change the access.
10. **Guide, don't strangle.** Balance specificity with flexibility — over-constraining ("always
    exactly three bullets, each 15 words") makes the agent brittle. Be precise about *what* matters
    and leave the model room on the rest.
11. **Voice matches function, and stays consistent.** Pick a register that fits the role and hold it
    across the whole text (e.g. "warm but efficient", or "precise and references paths"). A jarring
    or wandering voice reads as untrustworthy.
12. **Examples only when they earn their place.** A short worked example fixes tone/format better
    than description — but a short prompt rarely needs one. Add it only if behavior keeps drifting.

## Workflow

### Writing a new prompt
1. **Read the shared base** (global system prompt / guardrails) — know what is already provided so
   you don't repeat it.
2. **One-line the role** — finish `You are a <role>.` and a one-sentence objective.
3. **Draft `Role:` / `How you work:` / `Boundaries:`** as plain-prose bullets.
4. **Pass it through the principles above** — cut anything that duplicates the base; soften any
   shouting; make every fuzzy line concrete.
5. **Self-review with the checklist below.**

### Editing / tuning an existing prompt
1. **Read the current text and the shared base together.**
2. **Name the symptom** you're fixing (over-eager tool use? wrong scope? false claims?). Map it to a
   principle — e.g. over-triggering → principle 5 (dial back emphasis); false claims → principle 4
   (tighten Boundaries).
3. **Make the smallest change that fixes it.** Working prompts are load-bearing; don't rewrite a
   whole text to fix one line.
4. **Check the agent's description still matches** if the role shifted.
5. **Re-run the checklist** and verify a real turn (below).

## Self-review checklist

- [ ] Leads with the role (`You are a <role>.`); the role is clear and specific.
- [ ] Contains **nothing** already in the shared base / injected context.
- [ ] Uses the `Role:` / `How you work:` / `Boundaries:` prose shape — no stray XML.
- [ ] Every line is concrete and actionable (colleague test passes).
- [ ] No emphatic shouting (`CRITICAL`/`MUST`/`ALWAYS`) except for real safety limits.
- [ ] `Boundaries:` match the agent's real capability; no claim it can't back up.
- [ ] Consistent terminology; no contradiction with the agent's description or scope.
- [ ] Concise — a focused instruction text, not an essay.

## Verify

- If a snapshot/golden test covers the assembled prompt, update or confirm it.
- In a real turn, exercise the agent and confirm the scope/behavior/boundaries read as intended, and
  that it doesn't echo shared-layer language back.

## Worked example (before → after a tune)

A code agent that kept *suggesting* actions instead of taking them, and over-hedged:

```
# Before — fuzzy + shouting + repeats the base
You MUST ALWAYS be honest and helpful and reply to the user.
You should probably look at the code and maybe open an issue if it seems right.

# After — concrete, scoped, no base duplication, no shouting
You are a software engineering agent that analyses code across the team's repositories.

Role:
- You read and analyse code and issues to answer questions and surface problems.

How you work:
- Browse the tree, open the relevant files, and search the code before answering — ground
  your reasoning in what the repository actually says.

Boundaries:
- Read-only plus opening issues; opening an issue needs human approval. Never claim to have
  committed code, pushed a branch, or opened a PR.
```

The "before" repeats honesty (already in the base), shouts, and is vague about action; the "after"
is concrete, states real capability, and trusts the shared layer for the rest.
