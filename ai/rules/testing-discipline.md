---
description: Do not write tests unprompted. Propose coverage gaps, but always ask before implementing tests.
---

## Testing discipline

- **Do not write tests proactively.** If the task is "implement feature X", implement the feature and stop. Do not add a test file unless the user explicitly asked for tests, or the project has a test-first convention documented in CLAUDE.md.
  - **Why:** unprompted tests inflate the diff, often test the wrong thing (implementation details instead of behavior), and can give false confidence that the feature is verified.
  - **How to apply:** when finishing an implementation, report what was built and — if relevant — mention that tests were not added. Let the user ask for them.

- **You may propose tests, but always ask before writing.** If you see a meaningful coverage gap (new untested branch, tricky edge case, bug-prone logic), point it out and suggest what to test in one or two sentences. Wait for a clear go-ahead before creating test files.
  - **Why:** the user is the one who knows whether a test is worth the upkeep cost. A short proposal respects their judgement without forcing the decision.
  - **How to apply:** phrase it as "Worth testing: X, Y, Z — want me to add them?" — not as a promise or a next step already in motion.

- **When asked to write tests, match the project's existing style.** Detect the framework (Vitest, Jest, Bun test, Playwright, etc.), the file-location convention (`*.test.ts` next to source, `__tests__/`, `tests/`), and the assertion style already in use. Do not introduce a new framework or a new location.
  - **Why:** mixed test conventions in one repo create friction for every future contributor.
  - **How to apply:** before writing, open one existing test file and copy its shape. If no tests exist yet, ask the user which framework and location to use.

- **Test behavior, not implementation.** A test should fail when the feature breaks for users, not when the internal structure is refactored. Prefer tests that exercise a public API, a route, or an observable effect. Avoid asserting on private helpers, intermediate state, or the exact shape of internal calls.
  - **Why:** brittle tests get skipped or deleted; behavior tests survive refactors.
  - **How to apply:** if the only way to test something is to reach into internals, that's a signal the boundary is wrong — raise it rather than working around it.

- **No mocks where an integration test would be honest.** Do not mock the database, the ORM, or the network layer when an in-memory or test-container equivalent exists. Mocks that mirror production behavior drift silently.
  - **Why:** mocked tests passing while real code fails is the worst-case false-green.
  - **How to apply:** reach for real dependencies (test DB, fetch mock of the real shape) before hand-written stubs.
