---
description: Every feature ships tests for its most important behaviour (and every bugfix a reproducing test); anything beyond the core is proposed first, never written unasked.
---

## Testing discipline

- **Every feature ships tests for its most important behaviour.** When implementing a feature or changing behaviour, write tests for what the feature exists to do: the main success path, plus the one or two failure cases that would hurt users most if they broke (input rejected, permission denied, limit enforced). Not full coverage. A bugfix ships a test that reproduces the bug and passes with the fix.
  - **Why:** untested core behaviour regresses silently. A few targeted tests catch the breakages that matter without inflating the diff.
  - **How to apply:** list the behaviours you will test in the plan; at wrap-up, report which ones are covered. Pure refactors, docs, styling and copy changes need no new tests, but existing tests must stay green. If the repo has no test setup, skip the tests there — do not introduce a framework.

- **Beyond the core, propose — don't write.** For further coverage gaps (extra edge cases, rarely hit branches), suggest what to test in one or two sentences and wait for a clear go-ahead before writing those tests.
  - **Why:** the user is the one who knows whether a test beyond the core is worth the upkeep cost. A short proposal respects their judgement without forcing the decision.
  - **How to apply:** phrase it as "Worth testing: X, Y, Z — want me to add them?" — not as a promise or a next step already in motion.

- **When asked to write tests, match the project's existing style.** Detect the framework (Vitest, Jest, Bun test, Playwright, etc.), the file-location convention (`*.test.ts` next to source, `__tests__/`, `tests/`), and the assertion style already in use. Do not introduce a new framework or a new location.
  - **Why:** mixed test conventions in one repo create friction for every future contributor.
  - **How to apply:** before writing, open one existing test file and copy its shape. If the repo has no test setup, skip the tests (see above) — ask which framework and location to use only when the user explicitly asked for tests.

- **Test behavior, not implementation.** A test should fail when the feature breaks for users, not when the internal structure is refactored. Prefer tests that exercise a public API, a route, or an observable effect. Avoid asserting on private helpers, intermediate state, or the exact shape of internal calls.
  - **Why:** brittle tests get skipped or deleted; behavior tests survive refactors.
  - **How to apply:** if the only way to test something is to reach into internals, that's a signal the boundary is wrong — raise it rather than working around it.

- **No mocks where an integration test would be honest.** Do not mock the database, the ORM, or the network layer when an in-memory or test-container equivalent exists. Mocks that mirror production behavior drift silently.
  - **Why:** mocked tests passing while real code fails is the worst-case false-green.
  - **How to apply:** reach for real dependencies (test DB, fetch mock of the real shape) before hand-written stubs.
