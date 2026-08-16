---
name: backend-stack
description: The default backend tech stack — Node.js + TypeScript, Hono with @hono/zod-openapi (REST + OpenAPI), PostgreSQL + Drizzle, custom JWT/session auth, Zod validation end to end, pino logging, Redis as cache, Railway/PaaS deployment, pnpm, ESLint + Prettier. Use when scaffolding a backend/API project, adding a backend dependency, or choosing a library/tool for server-side work.
user_invocable: true
---

# Backend Stack

This skill pins **what** to use on the server. **How** to structure it lives elsewhere: the `api-layer-discipline` rule (thin routes, services own data access + business logic, factory DI, explicit boundary types) and the `api-error-handling` skill (consistent error shape, specific status codes, typed error classes). Follow those, and never restate their rules here.

## Defaults

| Area | Choice | Notes |
|------|--------|-------|
| Runtime | Node.js + TypeScript | `strict: true`, ESM only |
| Framework | Hono | Routes via `@hono/zod-openapi` — every route declares Zod schemas, the OpenAPI spec falls out for free |
| API style | REST + OpenAPI | Spec generated from route schemas; serve a docs UI (Scalar) in dev |
| Validation | Zod | One validation language for requests/responses, env config, and the frontend |
| Database | PostgreSQL | |
| ORM | Drizzle | SQL-first schema in TS; migrations via drizzle-kit |
| Auth | Custom JWT/sessions | Hand-rolled auth layer, no auth framework — keep it small, boring, and reviewed |
| Logging | pino | Structured JSON logs; hono-pino middleware for request logging |
| Cache | Redis | Cache and session storage only — no queue library; scheduled work runs via cron |
| Deployment | Railway (PaaS) | Git-push deploys, managed Postgres/Redis |
| Package manager | pnpm | Same as frontend |
| Lint/format | ESLint + Prettier | Flat config, same as frontend |
| Tests | Minimal | Only on explicit request — the testing-discipline rule applies |

## Zod as the shared contract

- Route input/output schemas go through `@hono/zod-openapi`, so the OpenAPI spec is always in sync with what the server actually validates.
- Validate `process.env` with a Zod schema at startup — crash early on bad config.
- Repo layout is **per project**, not part of the standard: when FE + BE share a repo, share Zod schemas via a workspace package; with separate repos, the OpenAPI spec is the contract.

## Rules

- **Don't add stack alternatives silently.** If a task seems to need something outside this list (Express/Nest/Fastify, Prisma, an auth library, BullMQ), propose it with a reason instead of just installing it.
- **Scaffold lean.** New services start with Hono + TypeScript + Zod + Drizzle + pino. Add Redis only when caching is actually needed.
- **Latest stable majors.** ESM only — no CommonJS in new code.
