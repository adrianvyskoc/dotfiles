---
description: Gate before opening a PR — typecheck, lint, format, build must all pass; PR description ends with manual post-merge steps + how to test
---

## Pre-PR checklist

Before opening a PR, run the full gate and make sure everything passes. Adapt the commands below to your package manager (`npm`, `pnpm`, `bun`, `yarn`).

```bash
pnpm typecheck    # no type errors
pnpm lint         # no lint errors
pnpm format       # no unformatted files
pnpm build        # builds cleanly
```

If any step fails, fix the underlying issue rather than suppressing it (no `// @ts-ignore`, `eslint-disable`, or skipping steps). "Green locally" is the contract — CI should not be the first place a failure is discovered.

If the project doesn't have one of these scripts yet, add it rather than skipping. The gate is only useful if every step is enforced.

## PR description: manual steps & how to test

Every PR/MR description must **end** with two sections so the reviewer (and whoever merges) knows what's left and how to verify it:

```markdown
## Manual steps after merge

- [ ] <anything not handled by the merge itself — run migrations, set/rotate env vars,
      flip a feature flag, clear a cache, redeploy a dependent service, backfill data, …>
- [ ] If nothing is required, write "None" explicitly — don't leave it blank.

## How to test

1. <setup: branch/env, seed data, prerequisites>
2. <steps to exercise the change — the exact commands, routes, or UI clicks>
3. <expected result — what proves it works, plus any edge case worth checking>
```

Keep both lists concrete and specific to this change — list the actual migration command, the real env var name, the exact route. "Manual steps after merge" covers only what a person must do by hand; anything automated by CI/CD doesn't belong there. Never ship a PR without these two sections.
