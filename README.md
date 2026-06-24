# CloudCannon array-item `_uuid` binding repro

A minimal Astro + CloudCannon Visual Editor site — **no Rosey, no RCC** — that
isolates one question:

> When you add / reorder items in an editable array that's rendered by a
> **registered component**, does CloudCannon **re-render the component** so each
> item's derived markup reflects its own data — or does it **clone a sibling's
> DOM** and leave derived attributes stale/duplicated until the editor reloads?

The derived attribute here is a neutral `data-ns-bound` (in the real connector
it's `data-rosey-ns`). If it goes stale, that confirms the issue is a **Visual
Editor re-render behaviour**, independent of the Rosey CloudCannon Connector.

## Why it's wrapped in a component (important)

A plain editable array does **not** re-render its item contents — per the
editable-regions docs, "primitive editables update their own DOM slice but can't
re-render the surrounding template." Making the `_uuid` display its own editable
region would let CC update that one slice and **mask the bug**. The real-world
case is computed markup (a derived attribute) that only updates when its
**parent component** re-renders. So the array is wrapped in a registered
component (`item-list`), placed via a page-builder `content_blocks` array —
exactly how the testimonial component (which exhibits the bug) is wrapped.

## What's set up

- `src/content/pages/index.md` — a `content_blocks` array with one `item-list`
  block; the block holds an `items` array (A, B, C), each item has a
  CloudCannon-managed `_uuid` (`instance_value: UUID`) + a `label`.
- `src/components/ItemList.astro` — the registered component. Renders the `items`
  array; each `<li>` has `data-ns-bound={item._uuid}` — **computed markup, not its
  own editable region** — plus a `data-editable="text"` label so there's
  something directly editable for contrast.
- `src/scripts/register-components.ts` — `registerAstroComponent("item-list", …)`
  so CloudCannon can re-render the component from data.
- `src/pages/[...slug].astro` — renders `content_blocks` with the
  `editable-array` / `editable-component` wrapper, and loads the registration
  under `window.inEditorMode`.
- `cloudcannon.config.yml` — `pages` collection + the `blocks` and `item`
  structures (the latter supplies `_uuid` via `instance_value`).

## Run it on CloudCannon

1. Push this folder to a Git repo and create a CloudCannon site from it
   (build command `npx astro build`, output `dist`).
2. Open the **Pages** collection → the "Array item _uuid binding repro" entry →
   **Visual Editor**.
3. **Add** a new item to the list (and/or **reorder** items) — don't reload.
4. In the Visual Editor preview iframe's devtools console, run:

```js
// Each rendered item's derived attribute + its visible label:
[...document.querySelectorAll('[data-prop="items"] [data-editable="array-item"]')]
  .forEach((el, i) => console.log(i,
    'data-ns-bound =', JSON.stringify(el.getAttribute('data-ns-bound')),
    'label =', el.querySelector('[data-prop="label"]')?.textContent?.trim()));

// The data — the source of truth for each item's real _uuid:
window.CloudCannonAPI.useVersion('v1', true).currentFile().data.get()
  .then(d => console.log('data _uuids:',
    (d.content_blocks || []).flatMap(b => (b.items || []).map(i => i._uuid))));
```

## What to look for

Compare each item's `data-ns-bound` against the matching item's real `_uuid` in
`data _uuids`:

- **Bug reproduced:** after adding (or reordering), an item's `data-ns-bound` is
  **empty or a duplicate of a sibling**, while `data _uuids` shows a fresh/correct
  unique `_uuid` for it. → CloudCannon cloned the array-item DOM and did **not**
  re-render the `item-list` component, so the computed attribute is stale.
- **Not reproduced:** every item's `data-ns-bound` matches its real `_uuid`. →
  CC re-renders the component on array changes; derived markup stays correct.
- Then **navigate out of the Visual Editor and back in**. The component
  re-renders from data, and `data-ns-bound` should now be correct — confirming a
  re-render is the only thing that currently fixes it (no rebuild involved).

Because `data-ns-bound` is computed markup inside a registered component (not its
own editable region), the result speaks to CloudCannon's component-re-render /
array-add behaviour itself — not to any Rosey/RCC code.

## Notes

- Base hydration of `[data-editable]` regions is provided by CloudCannon's visual
  editor at runtime (the static build intentionally has no hydration client —
  same as a working site; the `astro-integration` only handles build/SSR setup).
  `register-components` is loaded under `inEditorMode` purely to register the
  component for re-rendering.
- The `<li>` also prints its `_uuid` as visible text; that text is the same
  computed markup as `data-ns-bound`, so it goes stale together — the console
  `data.get()` is the source of truth for the real `_uuid`.
