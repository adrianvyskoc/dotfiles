---
description: Explain before implement, prefer explicit, ask when unclear, no commented-out code or contextless TODOs
---

## Code hygiene

- **Explain before implementing.** For non-trivial changes, briefly state the approach and trade-offs first. A one-paragraph outline beats a large surprise diff.
- **Prefer explicit over clever.** Favor clear, direct implementations over abstractions or dynamic behavior. Avoid over-generalization unless explicitly requested.
- **Ask when ambiguous.** If requirements are unclear or incomplete, ask one concise clarifying question before implementing. Do not guess.
- **No dead weight.** Do not leave commented-out code, TODOs without context, or unused exports.
- **Follow existing patterns.** Even if an alternative is technically valid, match what the codebase already does. If you want to introduce a new pattern, propose it for discussion rather than introducing it silently.
- **Flag contradictions, don't resolve them silently.** If the user's request contradicts the spec, a CLAUDE.md, an open task file, or the code on disk — stop and say so. Quote the conflicting sources and ask which should win.
