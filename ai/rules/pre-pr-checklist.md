---
description: Gate before opening a PR — typecheck, lint, format, build must all pass
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
