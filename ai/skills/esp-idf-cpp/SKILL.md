---
name: esp-idf-cpp
description: Embedded C++17 for ESP-IDF firmware (ESP32 / RISC-V / FreeRTOS) built as a portable core + host simulator + thin esp platform layer. Use when editing .cpp/.hpp under core/, sim/ or esp/, adding a firmware module, driver, FreeRTOS task, cloud action, config constant or core unit test, touching CMakeLists.txt / sdkconfig.defaults / idf_component.yml, or whenever a task mentions ESP32, ESP-IDF, idf.py, FreeRTOS, LEDC, I2C, SPI, UART, NVS, NimBLE, OTA or "the firmware".
user_invocable: true
---

# ESP-IDF C++

How to write firmware code in a **core / sim / esp** ESP-IDF project. The repo's `CLAUDE.md` owns the *what* (pins, protocols, endpoints, scope) — read it first and never restate it in code comments. This skill owns the *how*: which C++ is allowed, where a change goes, the FreeRTOS shapes, how it is tested, and the checklist a new module has to walk.

The device runs 24/7 on a few hundred KB of RAM with no operator watching a log. Every rule below exists because the alternative wedges, leaks, or drifts on a bench weeks later.

## 1. Where the change goes

| Layer | Contains | Toolchain | Litmus |
|---|---|---|---|
| `core/` | ALL behaviour: state machines, timing, parsing, decisions, retry pacing | any host compiler **and** ESP-IDF (as a component) | if the change has an `if` about *behaviour* (a gesture, a threshold, when to report, how to back off), it lives here |
| `sim/` | a native binary driving the same core from a stdin REPL | host CMake | every core feature gets a REPL command so it can be exercised without hardware |
| `esp/` | I/O only: read a pin, write PWM, open a socket, POST a body, persist to NVS | `idf.py` only | if a line needs an `esp_*`/`gpio_*`/`nvs_*`/`xQueue*` symbol, it lives here |

The seam is a **port**: an abstract class with pure virtuals declared next to the core types (`types.hpp`), implemented once by `esp/` and once by `sim/`. Core calls the port; it never knows which side is behind it.

```cpp
// core — declares what it needs, not how it happens
class ReportSink {
 public:
  virtual ~ReportSink() = default;
  virtual void onStateCommitted(const LightState& state) = 0; // must not block
};

// esp — one implementation, all the I/O
class HttpReporter final : public mirror::ReportSink {
 public:
  void onStateCommitted(const mirror::LightState& state) override {
    if (queue_ != nullptr) xQueueOverwrite(queue_, &state); // O(1), never blocks
  }
  // ...
};
```

Every input path (button, cloud action, motion, timer) drives the **same core object** through its command API. A second input path is never a second owner of state.

- **Bad:** `esp/main/actions_ws.cpp` decides that a `set_light` with `on:false` should also reset the preset.
- **Good:** `mirror::Controller::setLight()` decides; the esp file only parses bytes off the socket and calls it from the poll task.

## 2. The C++ subset

C++17. The host build pins `cxx_std_17` and is the gate — do not use C++20 features even though the IDF toolchain accepts them.

**In `core/` — allowed:** `<cstdint>`, `<cstddef>`, `<cstring>`, `<cstdio>` (for `std::snprintf` only), `<cstdlib>` (for `std::strtol`), `<cmath>`, `<algorithm>`. Fixed-size `char[N]` buffers, `enum class`, plain structs, classes holding references to their ports, `inline constexpr` constants.

**In `core/` — never:** `new`/`delete`/`malloc`, `std::string`, `std::vector`, `std::map`, `std::function`, `std::shared_ptr`, `<iostream>`, exceptions (`throw`/`try`), RTTI (`dynamic_cast`), `std::thread`/`std::mutex`, `<chrono>`, any ESP-IDF header.

- **Why:** a heap that fragments over weeks is the classic 24/7 device failure, and none of the forbidden pieces are testable on the host in a way that also proves anything about the target. The codebase has zero of them; keep it that way.

**In `esp/` — same subset plus the C ESP-IDF APIs.** `cJSON` is acceptable for *parsing* a server response inside a worker task (it frees with `cJSON_Delete`); bodies the device *sends* are `std::snprintf` into a fixed buffer. No `std::string`/`std::vector` here either.

House idioms instead of the STL:

```cpp
// Optional fields: has* flag + value (house style — std::optional would work, but every
// command struct already reads this way; stay consistent)
struct LightCommand {
  bool hasKelvin = false; int kelvin = 0;          // 1800..4500
  bool hasBrightness = false; int brightnessPct = 0;
};

// Sentinel for "no new information" on a sampled input
int readRaw();  // 1 pressed, 0 released, -1 read error / not sampled this tick

// Constants: cfg namespace, k-prefix, unit in the name, WHY in the comment
namespace mirror::cfg {
inline constexpr std::uint32_t kHoldThresholdMs = 450;  // press longer than this = hold
}

// Time: unsigned ms counter + subtraction — wraparound-safe at ~49.7 days
if (nowMs - pressStartMs_ >= cfg::kHoldThresholdMs) { ... }   // good
if (nowMs >= pressStartMs_ + cfg::kHoldThresholdMs) { ... }   // bad: breaks at wraparound

// Growth with a cap — check the cap BEFORE the multiply overflows
const std::uint32_t doubled = delayMs_ * 2;
delayMs_ = doubled > maxDelayMs_ ? maxDelayMs_ : doubled;

// Bounded strings: snprintf into a sized buffer, size from sizeof
char url[160];
std::snprintf(url, sizeof(url), "%s/mirror/light-state", appcfg::kApiBaseUrl);

// printf of a std::uint32_t: cast, don't guess the length modifier
ESP_LOGI(TAG, "ack %u -> %d", static_cast<unsigned>(actionId), status);
```

Every callback a port receives is called **on the poll task** and must return in microseconds: queue, don't perform.

## 3. Style

Match the neighbours. Concretely:

- `#pragma once`; 2-space indent; `public:` indented one space; `} // namespace mirror` closers.
- Include order: own header, blank, `<std>`, blank, project/IDF headers. Core headers use the `mirror_core/…` prefix.
- Core namespace `mirror`; each esp module has its own short namespace (`pir`, `report`, `wifiwin`). File-static state lives in an anonymous namespace with an `s_` prefix and a `const char* TAG = "…"` for logging.
- Members `trailing_`; methods `camelCase`; constants `kName`; types `PascalCase`; `enum class` everywhere.
- Aligned member/constant initialisers when a block has several.
- Comments explain **why**, not what: the incident, the bench date, the harness issue number, the datasheet warning. A rule with no reason attached gets "fixed" by the next reader.
- `// NOTE(build):` marks an ESP-IDF API detail that could only be verified on a real `idf.py build` — leave one whenever you use an IDF symbol you could not compile here.
- No dead code, no commented-out blocks, no `TODO` without an issue number.

## 4. FreeRTOS shapes (esp/)

The app has **one poll task** (`app_main`, `vTaskDelayUntil` at `cfg::kPollIntervalMs`) that ticks the core. Everything else is a worker.

- **Never block the poll task.** No `vTaskDelay`, no HTTP, no I2C bus reset, no NVS write inside a port callback or the tick. The fade, the button debounce and the double-click window all run on this task's cadence; a 200 ms stall is a visible flicker and a missed gesture.
- **Report pattern = 1-slot queue + worker task.** `xQueueCreate(1, sizeof(T))` + `xQueueOverwrite` from the poll side, `xQueueReceive(..., portMAX_DELAY)` in the worker. Latest state wins; a superseded intermediate value has no value to the API.
- **Input pattern = queue drained on the poll task.** Cloud actions, BLE writes and WiFi events land in a queue (or behind one mutex) and are applied by a `tick()` called from the poll loop. The core is single-threaded; nothing calls it from another task directly.
- **Stack sizes are measured, not guessed.** `esp_http_client` needs ~6 KB; a TLS handshake more; a task that formats JSON with cJSON more still. Start from the sibling task doing the same kind of work and copy its `kTaskStackBytes`. A stack overflow is a silent reboot loop on the bench.
- **Every network call has a timeout** (`timeout_ms` in the client config). A read that can block forever eventually does — the SSE transport was replaced after one blocked 175 s past its own timeout.
- **HTTP outcome classification and retry pacing are core decisions.** esp reports "status N" or "transport failed"; core answers "wait this long". 4xx is dropped (retrying cannot fix the device's own mistake), 5xx/transport is retried with exponential backoff up to a cap, a 2xx resets it.
- **`esp_err_t init()` per module.** Log with `ESP_LOGE(TAG, "…: %s", esp_err_to_name(err))` and return the error; `ESP_ERROR_CHECK` only at boot for failures that cannot be survived. Peripheral reads return `-1` on error and the core treats it as "no information".
- **A wedged bus is survived, not trusted.** Reset with a back-off (the IDF reset path busy-spins); never in a tight loop.
- **NVS:** namespace and key names ≤ 15 characters; write only on confirmed change (a wrong WiFi password is never stored; a token is stored only when the cloud confirms); read at boot into a struct once.
- **No ISRs unless the task truly needs one.** The project polls. If you must: `IRAM_ATTR`, only `…FromISR` APIs, no logging, hand off through a queue.

## 5. Tests (core/test)

Plain asserts, no framework — `micro_test.hpp` gives `CHECK`, `CHECK_EQ`, `CHECK_NEAR`, `TEST_SUMMARY()`. One `test_<module>.cpp` per core module.

```cpp
// core/test/test_report_backoff.cpp
#include "micro_test.hpp"
#include "mirror_core/report_backoff.hpp"

namespace {

void testFirstFailureKeepsTheMinimum() {
  // The task attempts, then waits nextDelayMs() — so the FIRST retry must
  // land at the minimum, not at twice it.
  mirror::ReportBackoff backoff;
  backoff.onOutcome(mirror::ReportOutcome::Retry);
  CHECK_EQ(backoff.nextDelayMs(), mirror::cfg::kReportRetryMinMs);
}

} // namespace

int main() {
  testFirstFailureKeepsTheMinimum();
  return TEST_SUMMARY();
}
```

- Test through the **public API with a fake port** (a struct implementing the sink that records what it was given). Never reach into privates.
- **Drive time explicitly.** Pass `nowMs` values; a test that sleeps is wrong.
- Test the **decision**, not the I/O: "after three failures the delay is 40 s", not "the POST was sent".
- Each test function has a one-line comment saying which rule it protects; name it after the behaviour (`testDroppedNeitherGrowsNorResets`).
- **Real bodies as fixtures.** When a parser exists, paste the production response verbatim into the test — the bench once caught a `settings.parameters.global` vs `settings.global` envelope that a hand-written fixture had hidden.
- Register the binary in `core/test/CMakeLists.txt`'s `foreach(t …)` list, or ctest never runs it.
- Tests are written **with** the core change, not on request — the sim and the tests are the only verification that exists before a bench session. (This overrides the generic testing-discipline rule for `core/`; `esp/` has no unit tests.)

## 6. Simulator (sim/)

`sim/main.cpp` is a REPL: `else if (cmd == "…")` branches that call the same core API the firmware does, then print the core's output. A core feature is not done until it has a command there and a line in `help`. Keep commands short and composable (`hold 3000`, `settings motion on`, `sse-frame <text>`) so a bench scenario can be replayed line by line.

## 7. New-module checklist

Adding a core module `foo` with its esp wiring — nothing here is optional, and the CMake steps are the ones most often missed:

1. `core/include/mirror_core/foo.hpp` + `core/src/foo.cpp`; any new port goes in `types.hpp`.
2. `core/CMakeLists.txt` — add the `.cpp` to **both** lists (`idf_component_register(SRCS …)` and `add_library(mirror_core …)`); the ESP build and the host build read different ones.
3. `core/test/test_foo.cpp` + its name in the `foreach` list in `core/test/CMakeLists.txt`.
4. `sim/main.cpp` — REPL command + `help` line.
5. `esp/main/foo_<io>.hpp/.cpp` (I/O suffix names the transport: `_i2c`, `_gpio`, `_http`, `_uart`) + `esp/main/CMakeLists.txt` `SRCS`; a new IDF component goes in `PRIV_REQUIRES`; a managed component in `idf_component.yml` (network fetch on first build — say so).
6. Timings and thresholds → `cfg` constants with unit + why; never a literal in a `.cpp`.
7. `CHANGELOG.md` under `## [Unreleased]` when the owner can notice the change — written for the owner, not the engineer.
8. `sdkconfig.defaults` change → note that an existing generated `sdkconfig` will NOT pick it up; the bench deletes it once.

## 8. Gate

Run on the host after every change, in this order; all three compile with `-Wall -Wextra -Werror`, so a warning is a failure:

```bash
cmake -S core -B build/core && cmake --build build/core && ctest --test-dir build/core --output-on-failure
cmake -S core -B build/core-san -DCMAKE_CXX_FLAGS="-fsanitize=address,undefined -fno-sanitize-recover=all" \
  && cmake --build build/core-san && ctest --test-dir build/core-san --output-on-failure
cmake -S sim -B build/sim && cmake --build build/sim
```

`idf.py build` needs the ESP-IDF environment (`. $IDF_PATH/export.sh`, IDF 5.x). If `idf.py` is not on the PATH, say the firmware build was **not run** — never imply it passed. `idf.py flash`, `monitor`, `erase-flash` and anything that touches a device are the user's to run, on request.

Anything that depends on the hardware — a pin, an I2C address, a sensor register, a timing that the datasheet or the bench decided — comes from `CLAUDE.md`, the technical docs or the user. Never invent one; ask.

## 9. Pitfalls that pass review and fail on the bench

- A behavioural `if` in `esp/` "just for now". It never moves; the sim stops matching the device.
- `std::string` in a report path — compiles, works for a week, fragments the heap.
- A port callback that does the work instead of queueing it — one slow POST freezes the fade.
- A retry loop at a flat interval — thousands of devices retrying together is a self-inflicted outage.
- `uint32_t` deadlines compared with `>=` on absolute values instead of subtracted — fails at 49.7 days.
- Continuous polling of a capacitive touch module — its baseline drifts until it latches "pressed". Decimate reads to what the core asks for.
- A new `.cpp` added to one CMake list but not the other — the host passes, `idf.py` fails on the bench (or the reverse).
- Trusting `CONFIG_*` edits in `sdkconfig.defaults` to apply — the generated `sdkconfig` shadows them.
- A static object with a non-trivial constructor in `esp/` — static init order across IDF components is not yours; use `init()`.
- Logging from a tight loop or a port callback — `ESP_LOG*` is synchronous console I/O; it stalls the calling task and floods the console.
