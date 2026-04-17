---
description: Thin routes, services own data access and business logic, factory DI, explicit types at boundaries
---

## API layer discipline

### Routes (thin only)

- Routes must **not** access the database, cache, or external APIs directly, and must **not** contain business logic.
- Routes only validate input, call services, and return HTTP responses.
- Routes are orchestration layers only. If logic does not directly relate to HTTP (status codes, headers, request parsing), it does not belong in a route.

```ts
// ✅ GOOD: thin route calling a service
const user = await services.users.getById(id);
return reply.code(200).send(user);
```

### Services (feature-specific)

- All DB, cache, and external-API access happens in feature services (e.g. `usersService`, `billingService`).
- Services encapsulate all logic for their feature and expose a clear public API.
- Every feature has exactly **one primary service** responsible for its business logic. Cross-feature logic must be coordinated, not duplicated.
- Services must not exceed a single feature boundary. If a service grows beyond ~300 lines, split it internally or introduce sub-services.

```ts
// ✅ GOOD: service owns DB + cache access
const user = await db.select().from(users).where(eq(users.id, id));
await cache.set(cacheKey, JSON.stringify(user));
```

### Service construction: factory-based DI

Create services via a factory function that takes typed dependencies. This makes testing and wiring explicit:

```ts
type UsersServiceDeps = {
  db: Db;
  cache: Cache;
  env: Env;
};

export const createUsersService = (deps: UsersServiceDeps) => {
  return {
    getById: async (id: string) => { /* ... */ },
    // public API methods
  };
};

export type UsersService = ReturnType<typeof createUsersService>;
```

- All services are constructed in **one composition root** (e.g. `src/plugins/services.ts`, `src/services/index.ts`) and exposed on the request context.
- Routes must **never** instantiate services directly.

### TypeScript discipline at service boundaries

- Public service methods must have **explicit input and return types**. Do not rely on inference at service boundaries.
- Avoid `any`. If `unknown` is used, it must be narrowed explicitly.
- Export both the factory and the type:
  ```ts
  export type UsersService = ReturnType<typeof createUsersService>;
  ```

### Side effects must be obvious

Services must not perform hidden side effects (DB writes, cache invalidation, external calls) without it being obvious from the method name.

```ts
// ❌ BAD — looks like a read, actually writes to cache
getWeather();

// ✅ GOOD — side effect is named
getWeatherCached();
```

### Data access rules

- Use one ORM / query builder consistently. No raw SQL in routes.
- No direct `db` imports outside services.
- Cache layers (Redis, etc.) are introduced only with a clear purpose — TTL, invalidation strategy, and cache key definition.
