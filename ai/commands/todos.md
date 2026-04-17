---
description: List planned tasks from the tasks/ folder with a short summary per task.
---

List every task currently sitting in the `tasks/` folder at the repo root, with a short summary of each one so the user can decide what to work on next.

## How to do it

1. Use the `Glob` tool with the pattern `tasks/*.md` to find every task file.
2. If there are no matches, respond exactly: `No tasks in tasks/. 🎉` and stop.
3. Otherwise, for each file:
   - Read it with the `Read` tool.
   - Extract:
     - **Title** — the first-level `#` heading on line 1 (fallback to the filename without `.md`).
     - **Status** — the `**Status:**` line if present (e.g. `Planned`, `In Progress`, `Blocked`).
     - **Goal** — the first non-empty paragraph under a `## Goal` heading if present, otherwise the first non-heading paragraph in the file.
   - Summarise the goal in **one sentence** (≤25 words). Do not quote the file verbatim if it's long — compress it.
4. Print a single markdown list, one item per task, in this exact format:

   ```
   - **<Title>** (`tasks/<filename>.md`) — _<Status>_
     <one-sentence summary>
   ```

5. After the list, print a one-line footer with the total count: `<N> task(s) total.`

## Rules

- Do not invent tasks that aren't in the folder.
- Do not read any file outside `tasks/`.
- Do not modify any files — this is a read-only command.
- Keep the output compact. No preamble like "Here are the tasks:" — go straight to the list.
- If a task file is malformed (no heading, empty), still list it with the filename as the title and `_Unknown_` as the status.
