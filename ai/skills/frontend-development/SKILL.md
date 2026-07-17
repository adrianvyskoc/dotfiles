---
name: frontend-development
description: Framework-agnostic rules for reactive frontend work (React, Vue, Svelte, Solid, …) — generic UI component library discipline (check → use/extend/create), presentational generic components, logic in feature components + hooks/composables, local state first, mandatory design tokens, typed API layer, schema-based forms, handled async states, naming and a11y baseline. Use when building or changing UI components, pages, views, or frontend features.
user_invocable: true
---

# Frontend Development

How to build reactive frontend UIs in any framework. Examples use JSX-ish pseudocode — the rules map 1:1 to Vue/Svelte/Solid idioms (children ≈ slots, hooks ≈ composables).

## Core Rules

1. **The generic UI library is the foundation.** Every project has a dedicated set of generic components (Button, Input, Select, Tag, Modal, …) living in its own home, separate from feature code. All UI is built from it.
2. **Check → use / extend / create.** Before building any UI, check the generic library first. Component exists → use it. Almost fits → extend it with a variant. Missing → create it in the library, then use it. An ad-hoc duplicate in feature code is a bug.
3. **Generic components are purely presentational.** Props in, events out. No business logic, no data fetching, no store access — ever.
4. **Feature components hold basic logic.** Anything bigger or more complex moves to hooks/services/composables.
5. **Local state first.** Start with component-local state. Lift it up or move it to a store only when more than one place genuinely needs it. No preemptive global stores.
6. **Design tokens are mandatory.** No magic values for color, spacing, typography, radius, shadow. The styling tool (Tailwind, CSS modules, scoped CSS, …) is per-project; the token rule is not.
7. **Components never fetch directly.** HTTP lives in a typed API/service layer; components consume it through hooks/composables.
8. **Forms validate through a schema.** The schema (Zod/Valibot/Yup style) is the single source of truth for types and error messages, kept separate from the UI.
9. **Variants via props, content via slots.** One Button with `variant`/`size` props — never PrimaryButton/DangerButton. Layout and content composition go through slots/children.
10. **Every async view handles loading, error, and empty.** How is up to the project; that they're handled is not.
11. **Naming baseline.** PascalCase components, `use*` hooks/composables, `on*` event handlers, file name = component name.
12. **A11y baseline, enforced in the library.** Semantic HTML, keyboard operability, visible focus, labeled inputs, alt texts. Responsive is part of the definition of done.

---

## 1. Generic UI library workflow

The decision tree when you need a piece of UI:

```
Need UI element
├─ Exists in ui/?           → use it as-is
├─ Almost fits?             → extend it (new variant/size/slot) in the library
└─ Doesn't exist?           → create it in ui/, then use it from the feature
```

```tsx
// ❌ BAD — feature code re-implements a button because "it's just one place"
// features/orders/OrderActions.tsx
<button class="rounded-md bg-blue-600 px-3 py-2 text-white hover:bg-blue-700">
  Cancel order
</button>

// ✅ GOOD — the library Button is used; if the style was missing, it became a variant
<Button variant="danger" onClick={cancelOrder}>Cancel order</Button>
```

**Extending beats forking.** If a design needs a Button the library can't render, the fix is a new variant in `ui/Button` — not a `SpecialButton` next to the feature.

**Creating is allowed and expected.** When a genuinely new generic element is needed (e.g. first time the app needs a `Tag`), build it in the library immediately — even if only one feature uses it today. Generic means "knows nothing about the domain", not "used in N places".

**Where the library lives is per-project** (`components/ui/`, `shared/ui/`, a package, …) — but it must be one dedicated, separate home. Feature code must never contain generic components.

## 2. Component layers and logic placement

Three layers, one direction of knowledge:

| Layer | Knows about | Contains |
|-------|------------|----------|
| **Generic (ui/)** | Nothing but its own props | Markup, styling, local interaction state (open/closed, focus) |
| **Feature components** | The domain | Composition of ui/ components + basic logic (simple derivations, handlers, wiring) |
| **Hooks / services / composables** | Domain + data | Anything bigger: multi-step logic, fetching, caching, cross-component state |

```tsx
// ❌ BAD — generic component reaches into the domain
function Select({ options }) {
  const { user } = useAuthStore();               // store access in ui/
  const filtered = options.filter(o => o.tenantId === user.tenantId); // business rule
  ...
}

// ✅ GOOD — the feature prepares domain data, the generic component just renders
function TenantPicker() {
  const options = useTenantOptions();            // hook owns the logic
  return <Select options={options} onChange={setTenant} />;
}
```

**The promotion rule:** logic starts in the feature component. The moment it grows (multiple steps, needs testing in isolation, or a second component wants it), it moves to a hook/composable or service. Don't extract preemptively — and don't let a 300-line component tell you that you waited too long.

## 3. Props API discipline

- **Style variants are props.** `variant`, `size`, `tone` — a closed set of named options, not free-form class/style passthrough as the primary API.
- **Content and layout are slots/children.** If the consumer decides *what goes inside* (icons, custom rows, footers), that's composition, not a prop.
- **No component-per-variant.** `PrimaryButton`, `DangerButton`, `LargeCard` — all wrong. One component, one prop.
- **Booleans sparingly.** Two booleans that can't be true together should be one enum prop (`state: 'loading' | 'disabled'` beats `isLoading` + `isDisabled` when they conflict).

```tsx
// ❌ BAD — variant explosion + config-props for content
<DangerButton big withIconLeft iconName="trash" label="Delete" />

// ✅ GOOD — variants via props, content via children
<Button variant="danger" size="lg">
  <TrashIcon /> Delete
</Button>

// ✅ GOOD — layout component driven by slots
<Card>
  <Card.Header>Invoices</Card.Header>
  <Card.Body><InvoiceTable rows={rows} /></Card.Body>
  <Card.Footer><Button variant="ghost">Export</Button></Card.Footer>
</Card>
```

## 4. State management

- **Default: local component state.** Forms in progress, toggles, hover/open states.
- **Lift when shared.** Two siblings need it → nearest common parent. A whole subtree → context/provide-inject.
- **Store only for genuinely app-wide state.** Auth/session, theme, feature flags — things many unrelated parts read.
- **Never mirror.** Don't copy props into local state, don't duplicate server data into a store "for convenience" — derive it where it's needed.

```tsx
// ❌ BAD — global store for something one page uses
const useOrderFilterStore = defineStore(...); // used by exactly one view

// ✅ GOOD — local state where it's used
function OrderList() {
  const [filter, setFilter] = useState<OrderFilter>('open');
  ...
}
```

## 5. Styling — design tokens

- **Every visual value comes from a token** (CSS custom property, Tailwind theme key, theme object — whatever the project uses).
- **Magic values are bugs**: `#3b82f6`, `margin: 13px`, `font-size: 15px` in feature code all mean a missing or ignored token.
- **Styling lives in the generic components.** Feature code composes; it should rarely style beyond layout (grid/flex/gap using spacing tokens).

```css
/* ❌ BAD */
.badge { background: #eef2ff; padding: 5px 9px; border-radius: 7px; }

/* ✅ GOOD */
.badge {
  background: var(--color-surface-accent);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
}
```

## 6. Data fetching

Two layers, both mandatory:

1. **API/service layer** — plain typed functions, one per endpoint/operation. Owns URLs, HTTP details, and response parsing/typing. No framework imports.
2. **Hooks/composables** — wrap the API layer for components: expose data + status, handle caching/refetching (via TanStack Query or the project's equivalent).

Components call hooks. Components never call `fetch`/`axios`, never build URLs, never parse responses.

```ts
// ✅ GOOD — api/orders.ts (typed functions, framework-free)
export async function getOrders(params: OrderQuery): Promise<Order[]> {
  const res = await http.get('/orders', { params });
  return OrderListSchema.parse(res.data);
}
```

```tsx
// ✅ GOOD — hooks/useOrders.ts wraps it for the UI
export function useOrders(params: OrderQuery) {
  return useQuery({ queryKey: ['orders', params], queryFn: () => getOrders(params) });
}

// ❌ BAD — component owns the HTTP call
function OrderList() {
  useEffect(() => {
    fetch('/api/orders?state=open').then(r => r.json()).then(setOrders); // no
  }, []);
}
```

## 7. Forms and validation

- **Schema first.** Define a schema per form (Zod/Valibot/Yup style). Derive the form's TS type from it. Error messages live in the schema, not scattered in the template.
- **UI from the library.** Forms are composed from generic Input/Select/Checkbox components; field-level error display is a library concern (the Input knows how to show an error it's given).
- **Validation is not in the component.** The component wires schema → form state → generic fields.

```ts
// ✅ GOOD — schema is the source of truth
const OrderFormSchema = z.object({
  email: z.string().email('Enter a valid email'),
  quantity: z.number().int().min(1, 'At least 1'),
});
type OrderForm = z.infer<typeof OrderFormSchema>;
```

```tsx
// ❌ BAD — validation logic inlined in the view
<Input onBlur={() => { if (!email.includes('@')) setError('bad email'); }} />
```

## 8. Async states

Every view that loads data handles **loading**, **error**, and **empty** explicitly. The form is free (skeletons, spinners, inline messages — per project), the presence is not. "Renders blank while loading, crashes on error" is unshippable.

```tsx
// ✅ GOOD — all four states visible in the code
const { data, isLoading, error } = useOrders(params);
if (isLoading) return <OrdersSkeleton />;
if (error) return <ErrorState onRetry={refetch} />;
if (data.length === 0) return <EmptyState title="No orders yet" />;
return <OrderTable rows={data} />;
```

## 9. Naming

- **Components:** PascalCase; file name = component name (`OrderTable.tsx` exports `OrderTable`).
- **Hooks/composables:** `use` prefix — `useOrders`, `useDebounce`.
- **Event props:** `on*` (`onSubmit`, `onSelect`); handlers `handle*` inside components.
- **Generic components:** named by what they are (`Button`, `Tag`), never by where they're used (`SidebarButton` in ui/ is a smell — that's a variant or a feature component).

## 10. Accessibility & responsive baseline

Enforced primarily in the generic library — fix it once there, every feature inherits it:

- Semantic elements (`button` for actions, `a` for navigation, real `label` for every input).
- Keyboard operability + visible focus for anything interactive; no `div onClick`.
- `alt` on images; `aria-*` only where semantics can't do the job.
- Responsive behavior is part of done — a component/view that breaks on small screens isn't finished.

---

## Common Mistakes to Avoid

| Wrong | Right |
|-------|-------|
| Styling a raw `<button>` inside a feature | Use/extend the library `Button` |
| `PrimaryButton`, `DangerButton` components | One `Button` with a `variant` prop |
| New generic component copied next to the feature | Create it in `ui/`, import it from there |
| Store access or fetching inside a `ui/` component | Feature prepares data via a hook, passes props |
| Global store for single-view state | Local state; lift only when shared |
| `#3b82f6` / `margin: 13px` in feature code | Design token (`var(--…)` / theme key) |
| `fetch()` inside a component | Typed API function, consumed via a hook/composable |
| Validation `if`s scattered in the template | One schema per form; type + messages derived from it |
| View renders blank while loading | Explicit loading / error / empty branches |
| `div` with `onClick` acting as a button | Semantic `button` with keyboard + focus for free |
| 300-line feature component "because it works" | Promote logic into hooks/composables/services |
