---
name: typescript-types
description: Decide when to share types vs keep them local, and how to organize them by domain
user_invocable: true
---

# Organizing TypeScript Types

When asked to create new types, or when you notice duplicate type definitions across files, follow this decision framework.

## 1. Check for duplicates first

Before creating a new type, search the codebase for existing definitions of the same or similar interfaces/types. Look in:

- The shared types folder (e.g. `src/types/`, `src/shared/types/`, or a dedicated package)
- Component files — locally defined `interface`s for props
- Route/handler files — inline types
- Service/module files — service-internal types (these usually stay local)

## 2. Organize by domain, not by file kind

Group types by the domain entity they represent. One file per domain:

| Domain (example)   | File (example)    | What lives there                              |
| ------------------ | ----------------- | --------------------------------------------- |
| Users & sessions   | `user.ts`         | `User`, `Session`, `UserWithProfile`          |
| Billing            | `billing.ts`      | `Invoice`, `LineItem`, `Subscription`         |
| Content            | `content.ts`      | `Post`, `Draft`, `Author`                     |

If a new type doesn't fit any existing file, create a new one named after the domain — not after the consuming component.

## 3. Define the type

Conventions:

- Use `export interface` for object shapes.
- Use `export type` for unions, intersections, and computed types.
- Use `extends` to build on base types instead of duplicating fields.
- Name types after the domain entity, not the component (e.g. `User`, not `UserTableRow`).

```typescript
// Base type
export interface User {
  id: number;
  email: string;
  createdAt: Date;
  deletedAt: Date | null;
}

// Extended type — add fields, don't duplicate
export interface UserWithProfile extends User {
  displayName: string;
  avatarUrl: string | null;
}
```

## 4. Import as type

Always use `import type` for type-only imports:

```typescript
import type { User, Session } from '../types/user.js';
```

Use `Pick<>` when a component only needs a subset of fields:

```typescript
interface UserCardProps {
  user: Pick<User, 'id' | 'email' | 'displayName'>;
}
```

Use `Omit<>` when a component wants a domain type minus a few fields (e.g. when constructing):

```typescript
type UserDraft = Omit<User, 'id' | 'createdAt'>;
```

## 5. Remove local duplicates

After promoting a type to the shared folder, remove the old local `interface` definitions. Keep component-specific prop interfaces local.

## 6. Verify

Run your type checker (e.g. `pnpm typecheck`, `tsc --noEmit`) to ensure no type errors were introduced.

---

## Decision: shared vs local?

**Promote to the shared types folder when:**

- The type is used by 2+ files.
- It represents a domain entity (user, session, invoice, post, etc.).
- Multiple components render the same data shape.

**Keep local when:**

- The type is component-specific props (`UserCardProps`, `FormState`).
- The type is a service-internal implementation detail (`ServiceDeps`, `InternalState`).
- The type is only used in one file.
- The type is a Zod-inferred type used only in a single route/handler.

## What NOT to put in the shared types folder

- Service dependency types (`AuthServiceDeps`, `PaymentServiceDeps`) — stay next to their service.
- Service return types (`AuthService`, `PaymentService`) — stay next to their service.
- UI-only prop interfaces — stay next to their component.
- Types only used in one file — inlining is fine until it's used elsewhere.
