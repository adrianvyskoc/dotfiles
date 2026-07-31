---
description: Run the task without stopping to ask decision questions — decide autonomously, log every decision, and report them all at the end.
argument-hint: [optional task description]
---

Autopilot mode for this task: do not block on decision questions. Applies to the task described in `$ARGUMENTS`, or — if empty — to the current/next task in the conversation.

## Behavior

1. **Don't ask, decide.** When you hit a decision point you would normally surface (AskUserQuestion, "should I do A or B?", ambiguous requirements, missing detail), do NOT stop. Pick the option a senior engineer would pick — consistent with the codebase's existing patterns, the least surprising, the most reversible — and keep going.
2. **Log every decision.** Each time you decide something autonomously, record it: what the question was, what you chose, why, and where it landed (file/area). Keep the log as you go — do not reconstruct it from memory at the end.
3. **Report at the end.** When the task is done, print a **"Decisions made"** section listing every logged decision, most consequential first. If there were none, say so in one line. Flag any decision you consider risky or worth revisiting with ⚠️.

## Hard limits — autopilot does NOT override these

- Never commit or push — commit-discipline still applies fully.
- Never do destructive or hard-to-reverse actions (deleting files outside the task's scope, force operations, publishing to external services) without asking.
- If the ambiguity is a genuine scope fork (two interpretations produce materially different deliverables), that's the one case to still ask — decide the small stuff, not what the task *is*.
