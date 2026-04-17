---
name: alpine-js
description: Write correct, idiomatic Alpine.js for server-rendered JSX/HTML components (no build step, CDN-loaded Alpine)
user_invocable: true
---

# Writing Alpine.js

For projects that load Alpine.js via CDN — **no build step, no bundler**. Interactivity is added directly to server-rendered components (Hono JSX, HTML templates, etc). Zero client-side framework.

## Core Rules

1. **Always add `style="display: none"` to elements with `x-show`** — prevents flash of unstyled content before Alpine initialises
2. **Use `x-data` on the outermost wrapper** of the interactive island, not on body or individual elements
3. **Keep state minimal** — only put in `x-data` what actually needs to be reactive. Static values belong in the HTML
4. **Use `x-on:event` not `@event` shorthand** in JSX — the `@` shorthand can conflict with JSX attribute parsing
5. **Named components via `Alpine.data()`** go in a `<script>` tag (use `dangerouslySetInnerHTML` in JSX) — never inline complex logic in attribute strings

---

## Directives Reference

### State — `x-data`

```tsx
// Inline (simple state only)
<div x-data="{ open: false, count: 0 }">

// Named component (complex logic) — define in a <script> tag
<script dangerouslySetInnerHTML={{ __html: `
  document.addEventListener('alpine:init', () => {
    Alpine.data('myComponent', () => ({
      loading: false,
      result: null,
      async fetchData() {
        this.loading = true;
        const res = await fetch('/api/data');
        this.result = await res.json();
        this.loading = false;
      }
    }));
  });
` }} />
<div x-data="myComponent">
```

**Rule:** Use inline `x-data` for 1-3 simple booleans/strings. Extract to `Alpine.data()` when there are methods, async operations, or more than ~3 properties.

---

### Visibility — `x-show` / `x-if`

```tsx
// x-show: toggles display, element stays in DOM — use for things that toggle frequently
<div x-show="open" style="display: none">

// x-if: removes from DOM entirely — use for things that are rarely shown or contain heavy markup
<template x-if="isAdmin">
  <div>...</div>
</template>
```

**Always pair `x-show` with `style="display: none"`** to avoid FOUC.

---

### Transitions — `x-transition`

Use the granular form for full control:

```tsx
// Fade
<div
  x-show="open"
  x-transition:enter="transition-opacity duration-200"
  x-transition:enter-start="opacity-0"
  x-transition:enter-end="opacity-100"
  x-transition:leave="transition-opacity duration-200"
  x-transition:leave-start="opacity-100"
  x-transition:leave-end="opacity-0"
  style="display: none"
/>

// Slide from left (drawer)
<div
  x-show="open"
  x-transition:enter="transition-transform duration-300 ease-out"
  x-transition:enter-start="-translate-x-full"
  x-transition:enter-end="translate-x-0"
  x-transition:leave="transition-transform duration-300 ease-out"
  x-transition:leave-start="translate-x-0"
  x-transition:leave-end="-translate-x-full"
  style="display: none"
/>

// Scale + fade (modal)
<div
  x-show="open"
  x-transition:enter="transition-all duration-200 ease-out"
  x-transition:enter-start="opacity-0 scale-95"
  x-transition:enter-end="opacity-100 scale-100"
  x-transition:leave="transition-all duration-150 ease-out"
  x-transition:leave-start="opacity-100 scale-100"
  x-transition:leave-end="opacity-0 scale-95"
  style="display: none"
/>
```

---

### Two-way Binding — `x-model`

```tsx
// Text input
<input x-model="query" type="text" />

// Checkbox — binds to boolean
<input x-model="isActive" type="checkbox" />

// Select
<select x-model="selectedOption">
  <option value="a">A</option>
</select>
```

---

### Output — `x-text` / `x-html`

```tsx
// Safe text output (always prefer this)
<p x-text="message" />

// HTML output — only use if you control the content
<div x-html="trustedHtml" />
```

---

### Event Handling — `x-on`

```tsx
// Use x-on:event (not @event) in JSX
<button x-on:click="open = true">Open</button>
<button x-on:click="count++">+</button>
<button x-on:click="handleSubmit()">Submit</button>

// Keyboard events
<div x-on:keydown.escape="open = false">

// Prevent default
<form x-on:submit.prevent="handleSubmit()">
```

---

### Dynamic Attributes — `x-bind`

```tsx
// Single attribute
<button x-bind:disabled="loading">Submit</button>

// Dynamic classes (merge with static ones)
<div x-bind:class="{ 'opacity-50': loading, 'cursor-not-allowed': disabled }" class="px-4 py-2">

// Shorthand :attr is OK for non-JSX-conflicting attributes
<img :src="imageUrl" />
```

---

### Side Effects — `x-effect`

Runs whenever its reactive dependencies change:

```tsx
// Lock body scroll when modal is open
<div
  x-data="{ open: false }"
  x-effect="document.body.style.overflow = open ? 'hidden' : ''"
>
```

---

### Portals — `x-teleport`

Use for modals/dropdowns that need to escape ancestor `overflow: hidden` or `transform`:

```tsx
<template x-teleport="body">
  <div x-show="open" class="fixed inset-0 z-50" style="display: none">
    {/* Modal content */}
  </div>
</template>
```

**Rule:** Always teleport modals and overlays to `body`.

---

### Init Hook — `x-init`

```tsx
// Run code when component initialises
<div x-data="{ items: [] }" x-init="items = await (await fetch('/api/items')).json()">
```

---

## Common Patterns

### Toggle (open/close)

```tsx
<div x-data="{ open: false }">
  <button x-on:click="open = !open">Toggle</button>
  <div x-show="open" style="display: none">
    Content
  </div>
</div>
```

### Confirm Modal

Wrap trigger + modal in one `x-data` island. Teleport the modal panel to body to avoid z-index/overflow issues:

```tsx
<div x-data="{ open: false }">
  <button type="button" x-on:click="open = true">
    Delete
  </button>
  <template x-teleport="body">
    {/* backdrop */}
    <div
      x-show="open"
      x-on:click="open = false"
      class="fixed inset-0 bg-black/50 z-40"
      style="display: none"
    />
    {/* panel */}
    <div
      x-show="open"
      class="fixed inset-0 z-50 flex items-center justify-center"
      style="display: none"
    >
      <div class="bg-white p-8 rounded shadow-xl">
        <button x-on:click="open = false">Cancel</button>
        <form method="post" action="/delete">
          <button type="submit">Confirm</button>
        </form>
      </div>
    </div>
  </template>
</div>
```

### Async Fetch with Loading State

Use `Alpine.data()` for anything with async logic:

```tsx
<script dangerouslySetInnerHTML={{ __html: `
  document.addEventListener('alpine:init', () => {
    Alpine.data('search', () => ({
      query: '',
      loading: false,
      result: null,
      error: '',
      async run() {
        if (!this.query.trim()) return;
        this.loading = true;
        this.error = '';
        this.result = null;
        try {
          const res = await fetch('/api/search?q=' + encodeURIComponent(this.query));
          const data = await res.json();
          if (data.found) {
            this.result = data.item;
          } else {
            this.error = 'Not found.';
          }
        } catch {
          this.error = 'Request failed. Try again.';
        } finally {
          this.loading = false;
        }
      }
    }));
  });
` }} />

<div x-data="search">
  <input x-model="query" type="text" />
  <button x-on:click="run()" x-bind:disabled="loading">
    <span x-show="!loading">Search</span>
    <span x-show="loading" style="display: none">Loading…</span>
  </button>
  <p x-show="error" x-text="error" style="display: none" class="text-red-600" />
  <div x-show="result" style="display: none">
    <p x-text="result && result.name" />
  </div>
</div>
```

### Mobile Drawer / Sidebar

```tsx
<div
  x-data="{ open: false }"
  x-effect="document.body.style.overflow = open ? 'hidden' : ''"
>
  <button x-on:click="open = true">Open Menu</button>

  {/* Backdrop */}
  <div
    x-show="open"
    x-on:click="open = false"
    x-transition:enter="transition-opacity duration-300"
    x-transition:enter-start="opacity-0"
    x-transition:enter-end="opacity-100"
    x-transition:leave="transition-opacity duration-300"
    x-transition:leave-start="opacity-100"
    x-transition:leave-end="opacity-0"
    class="fixed inset-0 bg-black/50 z-40"
    style="display: none"
  />

  {/* Drawer */}
  <div
    x-show="open"
    x-transition:enter="transition-transform duration-300 ease-out"
    x-transition:enter-start="-translate-x-full"
    x-transition:enter-end="translate-x-0"
    x-transition:leave="transition-transform duration-300 ease-out"
    x-transition:leave-start="translate-x-0"
    x-transition:leave-end="-translate-x-full"
    class="fixed top-0 left-0 h-full w-72 bg-white z-50"
    style="display: none"
  >
    {/* Drawer content */}
  </div>
</div>
```

---

## Common Mistakes to Avoid

| Wrong                                                    | Right                                      |
| -------------------------------------------------------- | ------------------------------------------ |
| `@click="open = true"` in JSX                            | `x-on:click="open = true"`                 |
| `x-show="open"` without `style="display: none"`          | Always add `style="display: none"`         |
| Inline async function in `x-data` attribute string       | Extract to `Alpine.data()` in a `<script>` |
| Modal inside a `transform` or `overflow:hidden` ancestor | Use `x-teleport="body"`                    |
| `x-html` with user-generated content                     | Use `x-text` for untrusted content         |
| Storing derived values in state                          | Compute them in expressions or `x-effect`  |
| Complex event handler logic in attribute string          | Call a method defined in `Alpine.data()`   |
