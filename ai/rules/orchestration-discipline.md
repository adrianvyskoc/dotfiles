---
description: Delegate to subagents only past a clear threshold, brief them with a fixed template, pin the model per role, verify every phase, and never let parallel agents touch shared files or git
---

## Orchestration discipline

Subagents do **not** save tokens — a fresh agent re-reads everything the main agent already knows, and its context is not in the prompt cache. What they buy is a clean main context on long tasks and parallel wall-clock time. Delegate for those two reasons only.

- **Delegate only past the threshold.** Stay single-agent unless at least one holds: (a) the task has **3+ independent parts** that can run in parallel without touching the same files, (b) doing the work inline would flood the main context with **bulk input** (library docs, test logs, large files, sweeping searches), or (c) the work is **adversarial by nature** (review, critique, second opinion) and benefits from not sharing the author's context.
  - **Why:** every delegation costs a brief, a re-read of the codebase, a verify pass and an integration step. Below the threshold that overhead exceeds the win and quality drops because the subagent lacks the conversation.
  - **How to apply:** when a plan is done, sort its steps into "parallel", "sequential", "bulk input". If nothing lands in the first or third bucket, do it yourself. Say which bucket triggered the delegation.

- **Contracts before parallel work.** Anything two agents both depend on — types, props, API shape, file names, exports — is written to disk by the main agent (or a contract step) *before* the parallel agents start. Parallel agents implement against the contract; they never invent it.
  - **Why:** three agents writing atoms without a shared interface hand the integrator three incompatible components. Fixing that costs more than the parallelism saved.
  - **How to apply:** the plan's `## Types` section is the contract. Land it in the repo first, then brief each agent with the exact file path to build against.

- **Parallel agents never touch shared files.** Barrel exports (`index.ts`), route tables, i18n files, `package.json`, lockfiles, migrations and any file two briefs would both name are off-limits to parallel agents. The integrator (or the main agent) edits them once, after the parallel phase.
  - **Why:** two agents writing the same file in one working tree silently overwrite each other. This is the most common way parallel work loses code.
  - **How to apply:** every brief has an explicit `May edit` / `Must not edit` list. If two briefs would need the same file, either move that edit to the integrator or give each agent its own worktree (see worktree-discipline) — never share.

- **Brief with the template, every time.** A subagent knows nothing but its brief. A brief missing any section below produces code in a different style, in the wrong place, or with the wrong shape.
  - **Why:** the quality of a subagent's output is exactly the quality of its brief. Skipping sections to "save tokens" costs a redo.
  - **How to apply:** fill every heading. Point to files by path, not by description. Prefer a fresh agent with a full brief over a fork; use a **fork** only when the task genuinely needs the conversation (a design being discussed, a decision trail).

    ```markdown
    ## Goal
    <one paragraph: what exists when you're done, in user-facing terms>

    ## Contract
    <paths to the types / interfaces / API shape to build against — read them first>

    ## May edit
    <exact file paths, new or existing>

    ## Must not edit
    <shared files, other agents' files, anything outside scope>

    ## Conventions
    <skill or CLAUDE.md paths to read first; one or two reference files that show the house style>

    ## Definition of done
    <observable checks: compiles, test X passes, renders Y, exports Z>

    ## Report back
    <use the return format below — no code dumps, no file contents>
    ```

- **Subagents return a report, not a transcript.** Every subagent ends with a fixed structure so the main context stays small and the integrator can act without re-reading.
  - **Why:** an agent that returns full file contents or command logs defeats the reason it was spawned.
  - **How to apply:** put the format in the brief's `## Report back` section and in every agent definition.

    ```markdown
    ## Result: done | partial | blocked
    **Changed:** <path> — <one line each>
    **Not done:** <what and why, or "—">
    **Open questions:** <one line each, or "—">
    **Verified:** <which checks you ran and their result>
    ```

- **Verify after every phase; never trust "done".** After a parallel phase or a single delegated step, run the project's gate (typecheck → lint → tests). Hand this to a cheap verifier agent that returns only failures, not logs.
  - **Why:** a subagent that reports success without running the gate is the norm, not the exception. Catching a broken atom before the integrator starts is cheap; after, it is a cascade.
  - **How to apply:** gate → fix → gate, at most **two** rounds per phase. If the second round still fails, stop and surface it to the user instead of spawning a third fixer.

- **Pin the model per role; override only with a stated reason.** The default lives in each agent's frontmatter. The main agent may pass `model` to override, but must say why in one line ("spec is fully mechanical, downgrading to sonnet").
  - **Why:** an orchestrator left to choose systematically underestimates difficulty and picks the cheap model. A wrong cheap model means a redo, which costs more than the right model once.
  - **How to apply:** strong model where mistakes compound; cheap model where the spec is exact and the task is mechanical.

    | Role | Default |
    |---|---|
    | orchestrator, planner, contract design, plan critique | fable / opus |
    | implementer, integrator, debugger | opus (sonnet when the brief is fully mechanical) |
    | test writer, code review, security review | sonnet |
    | explore, verifier, docs research, PR description | haiku |

- **Review findings go back through the main agent.** A reviewer reports; it does not fix. The main agent decides which findings to act on and briefs a fixer (or a fork of the implementer) with the exact finding list.
  - **Why:** letting reviewers edit collapses the adversarial split that made the review worth spawning. Letting fixers loop unsupervised produces churn.
  - **How to apply:** implement → review → fix → re-review, capped at one fix round. Unresolved findings go to the user as open questions.

- **Subagents never commit, push, or touch git state.** They edit files and report. Staging, committing and worktree operations are the main agent's, under commit-discipline and worktree-discipline.
  - **Why:** one commit per agent fragments history and bypasses the user's approval; a subagent switching branches under a sibling destroys its work.
  - **How to apply:** every agent definition and every brief carries "Do not run `git commit`, `git push`, `git checkout`, `git stash` or any `git worktree` command."
