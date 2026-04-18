---
name: api-error-handling
description: Consistent API error shape, OpenAPI-documented, specific status codes, disciplined try/catch, typed error classes
user_invocable: true
---

# API Error Handling

For HTTP APIs — how to shape errors, pick the right status code, document them in OpenAPI, and use `try/catch` without covering up real problems.

## Core Rules

1. **One error shape for the whole API.** Every error response — validation, auth, not-found, server — uses the same JSON body. Clients should never have to special-case.
2. **Pick the most specific status code.** `400 Bad Request` is almost never the right answer when `409`, `422`, or `404` fits. Generic codes leak the work of diagnosing onto the client.
3. **Throw typed errors, never raw.** Use custom `Error` subclasses (`NotFoundError`, `ConflictError`, …). A central handler maps them to HTTP responses. Routes and services never call `reply.code(500).send(...)` directly.
4. **`try/catch` at the right layer, not everywhere.** Wrap *one* narrow operation per block (a single external call, a parse, a transaction). A `try` around a whole function body is almost always wrong.
5. **Never swallow errors.** No empty `catch {}`. If you catch, you either (a) convert to a typed error, (b) add context and rethrow, or (c) handle explicitly and log. Silent catches are bugs.
6. **Document every error in OpenAPI.** Each route lists the status codes it can return and references the shared error schema. If it's not documented, clients can't handle it.

---

## 1. Error response shape

Use RFC 7807-style (Problem Details). One schema, everywhere.

```ts
// ✅ GOOD — canonical error body
{
  "type": "https://errors.example.com/validation-failed",
  "title": "Validation failed",
  "status": 422,
  "code": "VALIDATION_FAILED",
  "detail": "Field 'email' must be a valid email address.",
  "instance": "/users",
  "errors": [
    { "path": "email", "message": "must be a valid email" }
  ]
}
```

```ts
// ❌ BAD — ad-hoc, different shape every route
{ "error": "oops" }
{ "message": "User not found", "errorCode": 404 }
{ "ok": false, "reason": "bad_input", "fields": [...] }
```

**Minimum required fields:** `code` (machine-readable), `title` (human-readable), `status` (mirrors HTTP status), `detail` (specific to this occurrence).

---

## 2. Picking the right status code

| Situation                                                | Code                            |
| -------------------------------------------------------- | ------------------------------- |
| Request body fails schema validation                     | **422 Unprocessable Entity**    |
| Malformed JSON, missing required header                  | **400 Bad Request**             |
| No / invalid credentials                                 | **401 Unauthorized**            |
| Authenticated but not allowed                            | **403 Forbidden**               |
| Resource does not exist                                  | **404 Not Found**               |
| Method not allowed on this resource                      | **405 Method Not Allowed**      |
| Resource state conflicts with request (duplicate, stale) | **409 Conflict**                |
| Resource is gone permanently                             | **410 Gone**                    |
| Payload too large                                        | **413 Payload Too Large**       |
| Rate limit exceeded                                      | **429 Too Many Requests**       |
| Bug in our server / unhandled path                       | **500 Internal Server Error**   |
| Upstream dependency (DB, external API) failed            | **502 Bad Gateway**             |
| Server overloaded / in maintenance                       | **503 Service Unavailable**     |
| Upstream timed out                                       | **504 Gateway Timeout**         |

### Do/don't

```ts
// ✅ GOOD — specific codes per failure mode
if (!user) throw new NotFoundError('User not found');
if (emailTaken) throw new ConflictError('Email already registered');
if (!hasAccess) throw new ForbiddenError('Read access required');
if (!validated.success) throw new ValidationError(validated.error);
```

```ts
// ❌ BAD — everything is 400 or 500
if (!user) return reply.code(400).send({ error: 'bad user' });    // should be 404
if (emailTaken) return reply.code(400).send({ error: 'email' });  // should be 409
if (!hasAccess) return reply.code(401).send({ error: 'nope' });   // 401 ≠ 403
```

### 401 vs 403 — they are not interchangeable

- `401` = "we don't know who you are" (no/bad credentials).
- `403` = "we know who you are, you can't do this."

### 404 vs 403 — don't leak existence

If a user shouldn't know a resource exists, return `404` rather than `403`. `403` confirms the ID is real to an unauthorized caller.

### 400 vs 422

- `400` = request is malformed at the HTTP/parse level (bad JSON, missing Content-Type).
- `422` = request parsed fine, but fields fail business/schema validation.

---

## 3. Typed error classes

Define a base class, extend per failure mode. The central handler does the mapping.

```ts
// ✅ GOOD — typed hierarchy, one source of truth per error
export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    public readonly title: string,
    public readonly detail?: string,
    public readonly extra?: Record<string, unknown>,
  ) {
    super(title);
    this.name = new.target.name;
  }
}

export class NotFoundError extends AppError {
  constructor(detail: string, extra?: Record<string, unknown>) {
    super('NOT_FOUND', 404, 'Not found', detail, extra);
  }
}

export class ConflictError extends AppError {
  constructor(detail: string, extra?: Record<string, unknown>) {
    super('CONFLICT', 409, 'Conflict', detail, extra);
  }
}

export class ValidationError extends AppError {
  constructor(detail: string, issues: unknown) {
    super('VALIDATION_FAILED', 422, 'Validation failed', detail, { errors: issues });
  }
}
```

```ts
// ❌ BAD — untyped strings, impossible to pattern-match centrally
throw new Error('user_not_found');
throw { code: 404, msg: 'nope' };
return reply.code(500).send({ error: 'oops' }); // never do this in a service
```

### Central error handler

One place converts `AppError` → HTTP; everything else becomes 500. Example for Hono / Fastify-shaped frameworks:

```ts
// ✅ GOOD — one handler, consistent shape
app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json(
      {
        type: `https://errors.example.com/${err.code.toLowerCase()}`,
        title: err.title,
        status: err.status,
        code: err.code,
        detail: err.detail,
        instance: c.req.path,
        ...err.extra,
      },
      err.status,
    );
  }

  // Unknown error — log with trace, return opaque 500
  logger.error({ err, path: c.req.path }, 'unhandled error');
  return c.json(
    {
      type: 'https://errors.example.com/internal',
      title: 'Internal server error',
      status: 500,
      code: 'INTERNAL',
      detail: 'An unexpected error occurred.',
      instance: c.req.path,
    },
    500,
  );
});
```

**Rule:** Never include stack traces, SQL strings, or internal paths in the response body. Log them server-side; return opaque `INTERNAL`.

---

## 4. `try/catch` discipline

### Where to catch

- **Narrow scope.** One logical operation per `try` block.
- **At the boundary that knows how to react.** The service catches DB errors it can convert (`UniqueViolation → ConflictError`). Routes don't catch — they let the central handler do it.
- **Never above the central handler.** If you catch at the route level just to send a generic 500, you've duplicated the handler and lost the log.

### Do/don't

```ts
// ✅ GOOD — narrow try, convert to typed error, rethrow
async function getUser(id: string): Promise<User> {
  const user = await db.users.findUnique({ where: { id } });
  if (!user) throw new NotFoundError(`User ${id} does not exist`);
  return user;
}

async function createUser(input: CreateUserInput): Promise<User> {
  try {
    return await db.users.create({ data: input });
  } catch (err) {
    if (isUniqueViolation(err, 'email')) {
      throw new ConflictError('Email already registered', { field: 'email' });
    }
    throw err; // rethrow anything we can't handle — central handler logs it
  }
}
```

```ts
// ❌ BAD — wraps the whole function, swallows everything, returns null
async function createUser(input: CreateUserInput) {
  try {
    const validated = schema.parse(input);
    const existing = await db.users.findFirst({ where: { email: validated.email } });
    if (existing) return null; // caller has no idea why
    return await db.users.create({ data: validated });
  } catch (err) {
    console.log(err); // silently eaten
    return null;
  }
}
```

```ts
// ❌ BAD — catches only to rethrow the same thing with less info
try {
  return await externalApi.call();
} catch (err) {
  throw new Error('failed'); // lost the original cause + stack
}

// ✅ GOOD — preserve cause, add context
try {
  return await externalApi.call();
} catch (err) {
  throw new AppError(
    'UPSTREAM_FAILURE',
    502,
    'Upstream request failed',
    'The billing provider did not respond in time.',
    { cause: err instanceof Error ? err.message : String(err) },
  );
}
```

### String-matching on error messages is a bug

```ts
// ❌ BAD — breaks when the lib changes its wording
if (err.message.includes('unique constraint')) { ... }

// ✅ GOOD — check typed properties (driver-specific codes, instanceof, etc.)
if (err instanceof DatabaseError && err.code === '23505') { ... }
```

---

## 5. Validation → error

Use a schema lib (Zod, Valibot, etc.). Convert its error into your typed `ValidationError`:

```ts
// ✅ GOOD
const parsed = CreateUserSchema.safeParse(input);
if (!parsed.success) {
  throw new ValidationError(
    'One or more fields are invalid.',
    parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
  );
}
const data = parsed.data;
```

```ts
// ❌ BAD — leaks the raw Zod shape, clients now couple to Zod internals
if (!parsed.success) return reply.code(400).send(parsed.error);
```

---

## 6. OpenAPI documentation

### Shared error schema — define once, reference everywhere

```yaml
# ✅ GOOD — one reusable component
components:
  schemas:
    Error:
      type: object
      required: [type, title, status, code, detail, instance]
      properties:
        type: { type: string, format: uri }
        title: { type: string }
        status: { type: integer }
        code: { type: string, example: VALIDATION_FAILED }
        detail: { type: string }
        instance: { type: string }
        errors:
          type: array
          items:
            type: object
            properties:
              path: { type: string }
              message: { type: string }
  responses:
    NotFound:
      description: Resource not found
      content:
        application/problem+json:
          schema: { $ref: '#/components/schemas/Error' }
    Conflict:
      description: Resource conflict
      content:
        application/problem+json:
          schema: { $ref: '#/components/schemas/Error' }
    ValidationFailed:
      description: Request body failed validation
      content:
        application/problem+json:
          schema: { $ref: '#/components/schemas/Error' }
```

### Document every error per route

```yaml
# ✅ GOOD — every failure mode is listed
paths:
  /users:
    post:
      responses:
        '201': { description: Created, content: { application/json: { schema: { $ref: '#/components/schemas/User' } } } }
        '409': { $ref: '#/components/responses/Conflict' }
        '422': { $ref: '#/components/responses/ValidationFailed' }
```

```yaml
# ❌ BAD — only the happy path, clients have to guess
paths:
  /users:
    post:
      responses:
        '200': { description: ok }
```

### If using a code-first framework (Hono + `@hono/zod-openapi`, Fastify + TypeBox)

```ts
// ✅ GOOD — reuse one ErrorSchema, reference from every route
import { z } from 'zod';
const ErrorSchema = z.object({
  type: z.string().url(),
  title: z.string(),
  status: z.number(),
  code: z.string(),
  detail: z.string(),
  instance: z.string(),
  errors: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
});

route.openapi({
  responses: {
    201: { content: { 'application/json': { schema: UserSchema } }, description: 'Created' },
    409: { content: { 'application/problem+json': { schema: ErrorSchema } }, description: 'Conflict' },
    422: { content: { 'application/problem+json': { schema: ErrorSchema } }, description: 'Validation failed' },
  },
});
```

---

## 7. Logging

- **Log every 5xx.** Include: request path, method, user id (if known), request id, full error stack. Never put these in the response.
- **Do not log every 4xx.** Client errors are noise at scale; sample or drop unless you're debugging.
- **Redact secrets.** Never log Authorization headers, tokens, passwords, or full request bodies containing them.

```ts
// ✅ GOOD — structured, correlated, redacted
logger.error(
  { err, reqId: c.get('requestId'), userId: c.get('user')?.id, path: c.req.path },
  'unhandled error',
);
```

```ts
// ❌ BAD — unstructured, leaky
console.log('error!!!', err, req.headers); // prints auth header
```

---

## 8. Retry semantics (for clients)

- Use `429` with a `Retry-After` header for rate limits.
- Use `503` with `Retry-After` for maintenance.
- `5xx` from a transient upstream → `502` / `504` so clients know it's *safe to retry*.
- `4xx` should almost never be retried — the request is wrong.

---

## Common Mistakes to Avoid

| Wrong                                                        | Right                                                        |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| `reply.code(500).send({ error: 'oops' })` inside a route     | Throw a typed `AppError`, let the central handler respond   |
| `400 Bad Request` for every validation failure               | `422 Unprocessable Entity` for schema failures; keep `400` for malformed requests |
| `401 Unauthorized` when the caller is authenticated          | `403 Forbidden` — they're known, just not allowed           |
| `catch (err) { console.log(err); return null; }`             | Convert to typed error or rethrow with context              |
| `catch (err) { throw new Error('failed'); }`                 | Preserve cause: `throw new AppError(..., { cause: err })`   |
| Putting the stack trace / SQL in the response body           | Log server-side, return opaque `INTERNAL`                   |
| One error shape for validation, a different one for 404s     | Single canonical shape for every error, everywhere          |
| Only documenting `200` in OpenAPI                            | Document every status code each route can return            |
| `if (err.message.includes('unique'))`                         | Check a typed property: `err.code === '23505'`              |
| Wrapping the whole function body in one `try`                | One `try` per narrow operation that needs conversion        |
| Returning `403` for resources the caller shouldn't know exist | Return `404` — don't confirm existence to unauthorized callers |
