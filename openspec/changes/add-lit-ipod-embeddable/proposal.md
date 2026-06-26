# Change: Lit `<ipod-classic>` Embeddable & /whitelabel

## Why

The sellable, framework-agnostic artifact — droppable into any page like an RSS feed item — must be a native custom element, not a React component hostage to React's runtime. Lit compiles to a browser-native `<ipod-classic>` that ingests a feed URL/object and renders the container-query stage anywhere: a blog, Webflow, plain HTML, or a car-company demo. The React workbench remains the authoring studio; the Lit element is the published output.

## What Changes

- Add a `packages/ipod-wc/` Lit element `<ipod-classic>` that accepts a `feed` (URL or inline object) and `theme` attributes/properties and renders the keep-out stage + browser navigation using the shared core (feed model, nav model, container-query CSS).
- The element is **self-contained and container-query responsive** — it never reads the viewport, so it is correct at any embed size.
- Add a `/whitelabel` route in the app demonstrating the element with a swappable feed + theme (the white-label proof).
- Keep the shared core framework-neutral (no React imports in `lib/feed`, `lib/nav`, `lib/layout`) so both React and Lit consume it.

## Impact

- Affected specs: `lit-embeddable` (new capability)
- Depends on: `add-ipod-content-feed`, `add-ipod-browser-navigation`, `refactor-stage-keepout-zones`
- Affected code: `packages/ipod-wc/*` (Lit element, build), `app/whitelabel/page.tsx`, `tests/ipod-wc.spec.ts`
