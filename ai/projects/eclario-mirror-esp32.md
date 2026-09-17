---
description: Personal (non-team) instructions for eclario-mirror-esp32 — explain every C++ construct a diff introduces (I have minimal C++), the host gate is the only verifiable gate on this Mac (no ESP-IDF installed; idf.py is a bench step), and hand me a sim scenario after each core change
---

## eclario-mirror-esp32 — personal notes

Repo: `~/Documents/development/eclario/eclario-mirror-esp32` · sub-repo of the eclario harness (`../CLAUDE.md`, `../docs/`). This file loads next to `~/.ai/projects/eclario.md` (harness-wide personal rules) via the same `CLAUDE.local.md` stub.

These are **my** rules. The team's rules live in the repo's `CLAUDE.md`; the C++ / ESP-IDF house style lives in the `esp-idf-cpp` skill (`.claude/skills/esp-idf-cpp/SKILL.md`) — do not restate either here.

### Explain every C++ construct the change introduces, one line each

I have minimal C++ knowledge. Whenever a change summary in this repo shows or touches C++, end it with a short `C++ notes` block: one line per construct that appears in the diff and has not been explained earlier in the session — what it is and why it is used *here*. Cap it at 5 lines; if more would be needed, keep the 5 the diff depends on most.

- **Why:** I review every diff and approve every commit, but I cannot judge `virtual ~X() = default`, a `final` override, `static_cast`, a trailing-underscore member, `inline constexpr`, or `xQueueOverwrite` on sight. A summary that assumes I can is a summary I cannot act on.
- **How to apply:** in the chat summary, never in code comments (the repo is the team's; comments there explain *why*, not the language). Format: `` `construct` — plain-language meaning, then its job in this change``. Example: `` `class HttpReporter final : public mirror::ReportSink` — a class that fills in the core's ReportSink "socket"; `final` says nothing may subclass it further``. Skip constructs already explained this session; skip anything the change only moves without altering.

### The host gate is the only verifiable gate on this Mac — `idf.py` is a bench step

ESP-IDF is **not installed** here (`idf.py` is not on the PATH, there is no `~/.espressif`; only the VS Code extension exists). Verify every change with the three host commands and report the firmware build as **not run** — never as passed, never as "should compile".

- **Why:** the bench uses ESP-IDF v5.5.4 (see `CLAUDE.md`); on this machine only `core/` and `sim/` compile. A change to `esp/` that "looks right" has literally not been compiled anywhere until the bench builds it; a summary that does not say so reads as verified when it is not — and I cannot tell the difference from the code.
- **How to apply:** after any change, run in the repo root:
  ```sh
  cmake -S core -B build/core && cmake --build build/core && ctest --test-dir build/core --output-on-failure
  cmake -S core -B build/core-san -DCMAKE_CXX_FLAGS="-fsanitize=address,undefined -fno-sanitize-recover=all" && cmake --build build/core-san && ctest --test-dir build/core-san --output-on-failure
  cmake -S sim -B build/sim && cmake --build build/sim
  ```
  Report each as ✅/❌ plus `idf.py build — not run (no IDF on this Mac)`. When the change touches `esp/`, add a `Bench:` line naming exactly what the bench has to confirm (compiles under `idf.py`, the pin/module behaves, the log line appears). Do not propose installing ESP-IDF here unprompted — if a task truly needs a firmware build, ask first; it is a multi-GB toolchain install and a decision for me.

### Hand me a sim scenario after every core change

When a change alters behaviour in `core/`, finish the summary with the exact `./build/sim/mirror_sim` REPL lines that exercise it (3–6 lines) and the output I should see.

- **Why:** the sim is the one place I can *watch* the firmware's behaviour without reading C++ or owning the bench. A test passing is a number to me; a REPL transcript is something I can judge.
- **How to apply:** build the sim first (third command above), then list the commands verbatim (`hold 3000`, `settings motion on`, `motion on`, `wait 200000`, `state`), each with a one-line "expect: …". If the change added a new REPL command, show it in the scenario and confirm `help` lists it.
