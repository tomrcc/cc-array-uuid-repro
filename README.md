# CloudCannon array-item `_uuid` binding repro

A minimal Astro + CloudCannon Visual Editor site — **no Rosey, no RCC** — that
isolates one question:

> When you add a new item to an editable array, does CloudCannon give the new
> item's DOM the *new* item's `_uuid` (via re-render or `data-prop-*` binding),
> or does it **clone a sibling's DOM** and leave a stale/duplicate attribute?

If it clones, then any attribute *derived from the item's identity* (here a
neutral `data-demo-ns`, in the real connector `data-rosey-ns`) is wrong in-session
until the editor reloads. That would confirm the issue is a **Visual Editor
behaviour**, independent of the Rosey CloudCannon Connector.

## What's set up

- `src/content/pages/home.md` — one page with an `items` array (A, B, C), each
  item has a CloudCannon-managed `_uuid` (`instance_value: UUID`) + a `label`.
- `src/pages/[slug].astro` — renders the array as `data-editable="array"`. Each
  `<li>` exposes its `_uuid` through **two separate attributes** so the two
  mechanisms can be told apart:
  - `data-ns-build={item._uuid}` — set **only at build time**, no binding
  - `data-ns-bound` via `data-prop-data-ns-bound="_uuid"` — set **only by the
    CloudCannon live attribute binding**, no build-time value
- `cloudcannon.config.yml` — `pages` collection with the array structure.

## Run it on CloudCannon

1. Push this folder to a Git repo and create a CloudCannon site from it
   (build command `npx astro build`, output `dist`).
2. Open the **Pages** collection → the "Array item _uuid binding repro" entry →
   **Visual Editor**.
3. Click **+** on the list to add a new item (don't reload).
4. Open the browser devtools console (the Visual Editor preview iframe) and run:

```js
// What the DOM has on each rendered item — build-time attr vs binding attr:
[...document.querySelectorAll('[data-prop="items"] [data-editable="array-item"]')]
  .forEach((el, i) => console.log(i,
    'build =', JSON.stringify(el.getAttribute('data-ns-build')),
    'bound =', JSON.stringify(el.getAttribute('data-ns-bound')),
    'has-bind-attr =', el.hasAttribute('data-prop-data-ns-bound')));

// What the data actually has (the source of truth):
window.CloudCannonAPI.useVersion('v1', true).currentFile().data.get()
  .then(d => console.log('data _uuids:', (d.items || []).map(x => x._uuid)));
```

## What to look for

Compare each item's two attributes against the fresh `_uuid` the new item has in
`data _uuids`:

- **`data-ns-build` on the new item** — expected to be **empty or a duplicate of a
  sibling** (it's baked at build; CC cloned a sibling's DOM, so it can't reflect
  the new `_uuid`). This is the core "no re-render on add" behaviour.
- **`data-ns-bound` on the new item** — this is the `data-prop-*` question:
  - If it equals the new item's fresh `_uuid` → the binding *does* stamp derived
    attributes live, and the fix is "use `data-prop-*`".
  - If it's empty / a stale duplicate (while `has-bind-attr` is `true`) → CC does
    **not** honour `data-prop-*` for an arbitrary attribute like this.
- **`data-ns-bound` on the existing items** — tells you whether the binding stamps
  the attribute *at all* (baseline), separate from the new-item question.
- Optionally: navigate out of the Visual Editor and back in — the re-render from
  data should put the correct UUID on `data-ns-build` (confirming re-render is the
  only thing that currently fixes it).

Either way, these are plain attributes on a plain editable array — so the result
speaks to CloudCannon's array-add / `data-prop-*` behaviour itself, not to any
Rosey/RCC code.

## Notes

- The `<li>` also prints its build-time `_uuid` as visible text; that text is
  baked at build and is *also* stale on a cloned item — the console `data.get()`
  is the source of truth for what the new item's real `_uuid` is.
- Base hydration of `[data-editable]` regions is provided by CloudCannon's
  visual editor at runtime (the static build intentionally has no client script —
  same as a working site; the `astro-integration` only handles build/SSR setup).
  If for some reason the list isn't editable, add a client bootstrap to
  `src/pages/[slug].astro` (the one thing CC normally injects):

  ```astro
  <script>
    if (window?.inEditorMode) import("@cloudcannon/editable-regions/internal/components");
  </script>
  ```
  (`components/index` self-runs `hydrateDataEditableRegions(document.body)` on
  import. Only add this if CC isn't auto-hydrating — doubling it can clash on
  `customElements.define`.)
