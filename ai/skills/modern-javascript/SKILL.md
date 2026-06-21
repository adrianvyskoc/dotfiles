---
name: modern-javascript
description: Write world-class modern JavaScript/TypeScript using the newest stable language features (ES2020–ES2026) — optional chaining, nullish coalescing, structuredClone, Object.groupBy, immutable array methods, Iterator/Set helpers, Promise.withResolvers, Temporal, explicit resource management — in a disciplined ESM, const-first, async/await, typed-result style. Use when authoring or modernizing JS/TS.
user_invocable: true
---

# Writing Modern JavaScript & TypeScript

Target modern runtimes (Node 20+, evergreen browsers, current TypeScript). Reach for the **newest stable built-in** when it makes code clearer than a hand-rolled version — but never push syntax the target can't run (see [Cutting edge](#cutting-edge-es2026--check-support-first)). The goal is code that is correct, immutable by default, explicitly typed at its boundaries, and free of legacy ceremony.

## Core Rules

1. **ESM only, named exports.** `import`/`export`, no CommonJS. Prefer named exports; reserve default exports for a module's single primary factory/component. Barrel files (`index.ts` re-exporting) for public surfaces.
2. **`const` by default, `let` only when reassigned, never `var`.** Most code should be `const`. `let` is a signal that something mutates — make it deliberate.
3. **Arrow functions; keep them small and pure.** Pure where possible; when there's a side effect, name it for what it does (`sweepExpiredAccounts`, not `process`).
4. **`async/await`, never `.then()` chains** in business logic. Raw promise chaining is for trivial glue only.
5. **Model fallible work as typed results or typed errors** — a discriminated-union `Result` or a custom `Error` subclass. Never return `null` to mean "it failed" or `throw` a string.
6. **Immutable by default.** Don't mutate inputs. Use `readonly`, `as const`, the new copying array methods (`toSorted`, `with`), and `Object.freeze` for config.
7. **No `any`.** Use `unknown` and narrow. Public/exported functions get **explicit input and return types** — don't rely on inference at boundaries.
8. **Validate external input at the boundary.** Types vanish at runtime; parse untrusted data (env, request bodies, API responses) with Zod/Valibot before it reaches core logic.
9. **Formatting (Prettier):** single quotes, semicolons, trailing commas (`all`), 2-space indent, ~100 char width.
10. **Ternaries: one level only.** A single `cond ? a : b` is fine for choosing a value. **Never nest them** — `a ? b : c ? d : e` is unreadable, no matter how it's indented. When a choice has more than two branches, use `if`/`else if` or `switch` (or extract a small named helper that returns the value). A `let` reassigned in an `if`/`else` is preferable to a nested ternary.

---

## 1. Safe access & defaults

```ts
// ✅ Optional chaining — short-circuits to undefined, also for calls and indexes
const city = user?.address?.city;
const first = list?.[0];
onChange?.(value);

// ✅ Nullish coalescing — fallback ONLY for null/undefined (not '' or 0 or false)
const name = input.name ?? 'Anonymous';
const port = env.PORT ?? 3000;

// ❌ || swallows valid falsy values
const limit = input.limit || 10; // BUG: limit=0 becomes 10
// ✅
const limit = input.limit ?? 10;

// ✅ Logical assignment — assign only if null/undefined (or falsy / truthy)
config.timeout ??= 5_000;
options.headers ??= {};
cache[key] ||= computeExpensive(key);
```

**Rule:** default with `??`, not `||`, unless you genuinely want every falsy value replaced.

---

## 2. Destructuring, spread, shorthand

```ts
// ✅ Destructure with defaults + rename
const { name, role = 'user', id: userId } = account;
const [head, ...rest] = items;

// ✅ Object shorthand + computed keys
const event = { type, mirrorId, [dynamicKey]: value };

// ✅ Conditional spread for optional fields — no undefined keys left behind
const payload = {
  id,
  name,
  ...(avatar && { avatar }),
  ...(tools.length > 0 ? { tools } : {}),
};

// ✅ Spread to copy + override (shallow), never mutate the original
const next = { ...state, status: 'active' };
```

---

## 3. Arrays & objects — prefer the built-in

```ts
// ✅ .at() for ends (negative indexing) — beats arr[arr.length - 1]
const last = items.at(-1);

// ✅ findLast / findLastIndex — search from the end
const lastError = log.findLast((e) => e.level === 'error');

// ✅ flatMap — map + flatten one level in a single pass
const tags = posts.flatMap((p) => p.tags);

// ✅ Object.groupBy / Map.groupBy (ES2024) — replaces reduce-into-object
const byStatus = Object.groupBy(orders, (o) => o.status);
//   { pending: [...], shipped: [...] }   (use Map.groupBy for non-string keys)

// ✅ Object.fromEntries / Object.entries — transform objects functionally
const upper = Object.fromEntries(
  Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]),
);

// ✅ Object.hasOwn — safe own-property check
if (Object.hasOwn(obj, 'id')) { /* ... */ }   // not obj.hasOwnProperty('id')

// ✅ structuredClone — real deep clone (Maps, Sets, Dates, typed arrays)
const copy = structuredClone(original);        // not JSON.parse(JSON.stringify(x))
```

### Immutable array operations (ES2023)

```ts
// ✅ Copying variants — return a NEW array, leave the original intact
const sorted = scores.toSorted((a, b) => b - a);
const reversed = steps.toReversed();
const patched = rows.with(2, updatedRow);      // copy with index 2 replaced
const spliced = list.toSpliced(1, 2, 'x');

// ❌ Mutating in place — corrupts shared state
const sorted = scores.sort((a, b) => b - a);   // mutates `scores`!
```

**Rule:** in code that values immutability, prefer `toSorted`/`toReversed`/`toSpliced`/`with` over their mutating originals.

---

## 4. Async

```ts
// ✅ Concurrent, fail-fast — all must succeed
const [user, prefs] = await Promise.all([getUser(id), getPrefs(id)]);

// ✅ Concurrent, never rejects — inspect each outcome
const results = await Promise.allSettled(jobs.map(run));
const ok = results.filter((r) => r.status === 'fulfilled');

// ✅ First success wins (ignores rejections until all fail)
const fastest = await Promise.any(mirrors.map(fetchFrom));

// ✅ Promise.withResolvers (ES2024) — externalize resolve/reject cleanly
const { promise, resolve, reject } = Promise.withResolvers<Data>();
socket.once('message', resolve);
socket.once('error', reject);
return promise;

// ✅ Promise.try (ES2025) — run a maybe-sync, maybe-async fn in one promise chain,
//    so a synchronous throw is captured as a rejection
const result = await Promise.try(() => maybeThrowsSync(input));

// ✅ Array.fromAsync (ES2024) — build an array from an async iterable
const lines = await Array.fromAsync(readLines(stream));

// ✅ Top-level await in modules — no IIFE wrapper needed
const config = await loadConfig();
```

**Choosing:** `all` (need every result, fail fast) · `allSettled` (want every outcome, partial OK) · `any` (first success) · `race` (first settle, success *or* failure).

### try/catch discipline

```ts
// ✅ Narrow try, convert to a typed error, preserve the cause
try {
  return await billing.charge(amount);
} catch (err) {
  throw new AppError('UPSTREAM_FAILURE', 'Billing provider failed', { cause: err });
}

// ❌ Whole-body try that swallows everything and returns null
try { /* 30 lines */ } catch { return null; }   // caller has no idea what broke
```

One logical operation per `try`. Never an empty `catch {}`. See the `api-error-handling` skill for status-code and error-shape rules.

---

## 5. Iterators & Sets (ES2025)

```ts
// ✅ Iterator helpers — lazy, composable, short-circuiting (no intermediate arrays)
const firstTwoNames = Iterator.from(users)
  .filter((u) => u.active)
  .map((u) => u.name)
  .take(2)
  .toArray();
// also: .drop(n), .flatMap(fn), .reduce(fn, init), .some/.every/.find

// ✅ Set operations — set algebra without manual loops
const a = new Set([1, 2, 3]);
const b = new Set([2, 3, 4]);
a.intersection(b);        // Set {2, 3}
a.union(b);               // Set {1, 2, 3, 4}
a.difference(b);          // Set {1}
a.symmetricDifference(b); // Set {1, 4}
a.isSubsetOf(b);          // false
a.isDisjointFrom(b);      // false
```

**Rule:** for large or streamed data, `Iterator.from(...).map(...).take(n)` beats `[...].map().slice()` — it stops as soon as it has enough and never materializes the full intermediate array.

---

## 6. Errors

```ts
// ✅ Error cause — chain without losing the original stack
throw new Error('Failed to import row', { cause: dbError });

// ✅ Error.isError (ES2026) — robust across realms/proxies (vs instanceof Error)
if (Error.isError(value)) logger.error(value);

// ✅ Typed-result pattern — make failure a value, not a control-flow surprise
type Result<T, E = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

const parsePort = (raw: string): Result<number> => {
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) {
    return { ok: false, error: new AppError('CONFIG', `Bad port: ${raw}`) };
  }
  return { ok: true, value: n };
};

// ✅ Discriminated-union return — exhaustive, self-documenting failure modes
const pair = async (id: string): Promise<
  | { ok: true; value: Mirror }
  | { ok: false; code: 'not_found' | 'already_paired' }
> => {
  const mirror = await db.mirrors.findFirst({ where: eq(mirrors.id, id) });
  if (!mirror) return { ok: false, code: 'not_found' };
  if (mirror.userId) return { ok: false, code: 'already_paired' };
  return { ok: true, value: mirror };
};
```

---

## 7. TypeScript idioms

```ts
// ✅ `type` for unions/aliases/results; `interface` for object contracts you extend.
//    Pick one convention per object shape and stay consistent.
type Platform = 'slack' | 'discord' | 'whatsapp';
interface RepoRef { owner: string; repo: string; fullName: string; }

// ✅ `as const` + derive the union from the runtime array — single source of truth
const PLATFORMS = ['slack', 'discord', 'whatsapp'] as const;
type Platform = (typeof PLATFORMS)[number];   // 'slack' | 'discord' | 'whatsapp'

// ✅ Prefer union types over enums (enums emit runtime code & have footguns)
type Status = 'pending' | 'active' | 'closed';   // not `enum Status { ... }`

// ✅ `satisfies` — check the shape WITHOUT widening the inferred type
const routes = {
  home: '/',
  user: '/users/:id',
} satisfies Record<string, `/${string}`>;
// routes.home is the literal '/', still type-checked against the constraint

// ✅ Derive service types from the factory — don't hand-maintain a parallel interface
const createUsersService = (deps: Deps) => ({ find, create, remove });
type UsersService = ReturnType<typeof createUsersService>;

// ✅ Exhaustiveness with `never` — compile error when a variant is unhandled
const label = (s: Status): string => {
  switch (s) {
    case 'pending': return 'Pending';
    case 'active': return 'Active';
    case 'closed': return 'Closed';
    default: { const _exhaustive: never = s; return _exhaustive; }
  }
};

// ✅ `unknown` over `any`, then narrow with a type guard
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;

// ✅ Utility types — Pick / Omit / Partial / Readonly / Record
type PublicUser = Omit<User, 'passwordHash'>;
type Deps = Readonly<{ db: Db; logger: Logger }>;
```

**Factory DI:** construct services via factory functions that take typed `deps`; wire everything in one composition root. The service's type is `ReturnType<typeof createX>` — never duplicated by hand.

---

## 8. Modules & misc

```ts
// ✅ JSON module import (ES2025) — typed, no fs read
import config from './config.json' with { type: 'json' };

// ✅ Dynamic import — code-split / lazy-load on demand (returns a promise)
const { heavyTool } = await import('./heavy-tool.js');

// ✅ Numeric separators — readable large numbers
const RATE_LIMIT = 1_000_000;
const HEX = 0xff_ec_de_5e;

// ✅ RegExp.escape (ES2025) — safely embed user input in a regex
const re = new RegExp(RegExp.escape(userInput), 'g');

// ✅ Private class fields (#) + static init blocks
class Counter {
  #count = 0;                       // truly private, not just `_convention`
  static #registry = new Map();
  static { /* one-time static setup */ }
  increment() { this.#count++; }
}
```

---

## Cutting edge (ES2026 — check support first)

Gate these on your runtime/TS target; they're newest and not yet everywhere. Confirm Node version / `tsconfig` `lib` / browser support before shipping.

```ts
// ✅ Temporal — the modern, immutable, timezone-aware replacement for Date
const today = Temporal.Now.plainDateISO();
const due = today.add({ days: 30 });                 // immutable; returns a new value
const meeting = Temporal.ZonedDateTime.from('2026-06-15T09:00[Europe/Bratislava]');
//   Use Temporal for any real date math instead of mutating Date / reaching for moment.js.

// ✅ Explicit resource management — deterministic cleanup, no manual finally
{
  using file = openSync('data.txt');        // file[Symbol.dispose]() runs at block exit
  await using conn = await pool.connect();   // conn[Symbol.asyncDispose]() awaited at exit
  // ...use file & conn...
}                                            // disposed here, in reverse order, even on throw

// ✅ Make your own resources disposable
class TempDir {
  [Symbol.dispose]() { rmSync(this.path, { recursive: true }); }
}

// ✅ Other ES2026 niceties
Math.sumPrecise([0.1, 0.2, 0.3]);            // exact float summation
const bytes = Uint8Array.fromBase64('aGk=');  // base64/hex <-> Uint8Array
```

---

## Common Mistakes to Avoid

| Legacy / wrong                                  | Modern / right                                      |
| ----------------------------------------------- | --------------------------------------------------- |
| `value || 'default'` (eats `0`, `''`, `false`)  | `value ?? 'default'`                                |
| `obj && obj.a && obj.a.b`                        | `obj?.a?.b`                                          |
| `JSON.parse(JSON.stringify(x))`                  | `structuredClone(x)`                                |
| `arr[arr.length - 1]`                            | `arr.at(-1)`                                         |
| `obj.hasOwnProperty('k')`                        | `Object.hasOwn(obj, 'k')`                           |
| `items.sort()` / `.reverse()` (mutates)          | `items.toSorted()` / `toReversed()`                 |
| `reduce` to bucket into an object                | `Object.groupBy` / `Map.groupBy`                    |
| `[].concat(...arr.map(fn))`                      | `arr.flatMap(fn)`                                   |
| `let resolve; new Promise(r => resolve = r)`     | `Promise.withResolvers()`                           |
| `.then().then().catch()` in logic                | `async/await` + narrow `try/catch`                  |
| `throw 'failed'` / `throw { code }`              | `throw new AppError(...)` with `{ cause }`          |
| `any`                                            | `unknown` + a type guard                            |
| `enum Status { ... }`                            | union type + `as const` array                       |
| `var`                                            | `const` (or `let` only if reassigned)               |
| `new Date()` math / moment.js                    | `Temporal` (where supported)                        |
| `_privateField` convention                       | `#privateField`                                     |
| `try`/`finally` to close a resource              | `using` / `await using` (where supported)           |
| `a ? b : c ? d : e` (nested ternary)             | `if`/`else if` or `switch` (one-level ternary is OK) |
| `require()` / `module.exports`                   | `import` / `export` (ESM)                           |

---

## A note on "newest" vs. "supported"

"World-class" means clear and correct, not bleeding-edge for its own sake. Optional chaining, `??`, `structuredClone`, `Object.groupBy`, and the copying array methods are safe in any current runtime. Iterator/Set helpers, `Promise.withResolvers`, and JSON import are ES2025 — broadly available now. Temporal, explicit resource management, and the other ES2026 items are the newest — use them when your target supports them, and polyfill or defer when it doesn't. When unsure, check the runtime/`tsconfig` `lib` before reaching for the latest syntax.
