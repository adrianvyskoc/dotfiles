---
description: Point the current ebox-app tree's .env.local at another backend — staging/preprod, instance number, country (cz/sk/si/ro) and API version — in one call
argument-hint: <staging|preprod> [n] [cz|sk|si|ro] [v1.xx]
---

Switch the backend this tree's dev server talks to. Edits only the 8 active backend URL lines in `.env.local` of the **current** tree (main tree or worktree, `git rev-parse --show-toplevel`). Nothing else in the file changes.

Arguments: `$ARGUMENTS` — tokens in any order:

| Token | Meaning | Default |
| --- | --- | --- |
| `staging` / `stag` / `stage` | domain `jyxo-stag` | — required |
| `preprod` | domain `jyxo-preprod` | — required |
| a bare number `1`, `2`, … | instance number after `web`, `http`, `ws`, `ebox`, `falcon` | keep the current one |
| `cz` / `sk` / `si` / `ro` | country | keep the current one |
| `v1.13`, `1.13` | API version | keep the current one |

Read "staging 1" as env + number, "SI stage:1" as country + env + number. `prod` / `produkcia` → stop: prod URLs do not follow the pattern (CZ prod mixes `ebox.app.jyxo.cz` and `ws.cms.jyxo.cz`) and a dev server must not hit prod by accident. Missing env → ask, never guess.

## URL pattern

```
host   = cms            (cz)   →  TLD .cz
         cms-<country>  (sk, si, ro)  →  TLD .net
domain = jyxo-stag | jyxo-preprod

NUXT_PUBLIC_BASE_URL=https://web<n>.<host>.<domain>.<tld>
NUXT_PUBLIC_API_BASE_URL=https://http<n>.<host>.<domain>.<tld>/api/<ver>
NUXT_PUBLIC_WS_API_BASE_URL=wss://ws<n>.<host>.<domain>.<tld>/websocket
NUXT_PUBLIC_LP_API_BASE_URL=https://ws<n>.<host>.<domain>.<tld>/polling
NUXT_PUBLIC_HTTP_API_BASE_URL=https://http<n>.<host>.<domain>.<tld>/api/<ver>
NUXT_PUBLIC_API_BASE_URL_SSR=https://ebox<n>.<host>.<domain>.<tld>/api/<ver>
NUXT_PUBLIC_FALCON_BASE_URL=https://falcon<n>.<host>.<domain>.<tld>
NUXT_PUBLIC_API_ENUMS_BASE_URL=https://ebox<n>.<host>.<domain>.<tld>/api/v3
```

The API version goes only into the three `/api/<ver>` URLs. Enums stay on `v3`.

Example: `/ebox-env staging 1 si v1.14` → `https://web1.cms-si.jyxo-stag.net`, `https://http1.cms-si.jyxo-stag.net/api/v1.14`, …

## Steps

1. **Read the current values** — only the active (uncommented) lines, never print anything else from the file (it holds keys and tokens):
   ```bash
   grep -E '^NUXT_PUBLIC_(BASE_URL|API_BASE_URL|WS_API_BASE_URL|LP_API_BASE_URL|HTTP_API_BASE_URL|API_BASE_URL_SSR|FALCON_BASE_URL|API_ENUMS_BASE_URL)=' "$(git rev-parse --show-toplevel)/.env.local"
   ```
   Derive the current number, country and version from `NUXT_PUBLIC_BASE_URL` / `NUXT_PUBLIC_API_BASE_URL` to fill omitted tokens. No `.env.local` → stop and say to copy it from the main tree first.
2. **Build the 8 values** from the pattern above. Version must match `v<major>.<minor>`; prefix a bare `1.13` with `v`.
3. **Replace in place** with `perl -i -pe`, one substitution per key, anchored to `^KEY=` so commented blocks (`# NUXT_PUBLIC_…`) stay untouched. A key with no active line → append it at the end of the backend block (after `NUXT_PUBLIC_BASE_URL`'s group), not at the end of the file.
4. **Show the result**: re-run the grep from step 1 and print the 8 lines as a diff-like before → after table.
5. **Remind** in one line: Nuxt reads `.env.local` only at start — restart the dev server for this tree. If one is running (`lsof -iTCP -sTCP:LISTEN -P | grep node`), say which port.

## Rules

- Touch only these 8 keys. Never edit `NUXT_PUBLIC_DEV_SERVER_URL`, `NUXT_PUBLIC_CONFIG_URL`, keys or tokens.
- Never commit `.env.local` — it is gitignored; keep it that way.
- In a worktree, edit the worktree's own `.env.local`, not the main tree's — another session may be running against it.
