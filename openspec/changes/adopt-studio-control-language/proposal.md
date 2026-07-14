# Change: Adopt the studio control language across the /3d cockpits and /portfolio chrome

## Why

`components/ui/studio-controls.tsx` exists, is bounded, and is already the vocabulary of
the `/3d` camera bar and the 2D panels. The eight `/3d` cockpits and the `/portfolio`
stage chrome have not adopted it. The result is visible on the desktop `/3d` shot: a
machined blue camera bar sitting under white cards full of stock Tailwind corners. One
product, two design systems.

This was §4 of `unify-experience-truth`. It is split out because it is a **restyling
sweep on a page that is shipping**: ~2,500 lines across nine files, no behaviour change,
and real regression risk on exactly the surfaces the launch is about to expose. Holding
the launch for it would have been trading a real gate (a green tree, a verified deploy)
for a cosmetic one. Holding *it* for the launch costs nothing — the primitives are not
going anywhere.

## What Changes

- Migrate the eight `/3d` cockpits and `portfolio-feed-stage.tsx` to
  `StudioButton` / `Segment` / `Chip` / `Field` / `Row`, deleting the bespoke styles in
  place rather than visually approximating them.
- Take every corner radius from `CONTROL_RADIUS` / `SURFACE_RADIUS`. Stadium pills
  (`rounded-full`) and ad-hoc Tailwind radii come out.
- Remove `/3d` panel-registry entries that duplicate a cockpit's function; re-route their
  ⌘K commands to the cockpit so each function keeps exactly one control surface.

## Inventory (measured, not estimated)

Adoption is **partial**, not zero — `unify-experience-truth`'s §4 claimed zero, which the
count disproves: five of the nine files already import primitives. The real gap is the raw
elements that bypass them.

| File | Lines | Raw `<button>` | `rounded-full` | Ad-hoc radii | Imports primitives |
| --- | --- | --- | --- | --- | --- |
| `ipod-3d-color-cockpit.tsx` | 756 | 7 | 5 | 6 | yes |
| `ipod-3d-export-dock.tsx` | 560 | 7 | 4 | 12 | yes |
| `ipod-3d-lighting-cockpit.tsx` | 526 | 6 | 3 | 5 | yes |
| `ipod-3d-camera-cockpit.tsx` | 259 | 6 | 0 | 5 | no |
| `ipod-3d-nowplaying-cockpit.tsx` | 219 | 0 | 0 | 4 | yes |
| `ipod-3d-studio-cockpit.tsx` | 169 | 2 | 2 | 2 | yes |
| `ipod-3d-export-proof-panel.tsx` | 159 | 1 | 2 | 3 | no |
| `ipod-3d-battery-cockpit.tsx` | 82 | 1 | 1 | 2 | no |
| `portfolio-feed-stage.tsx` | 97 | 0 | 0 | 1 | no |
| **Total** | **2,627** | **30** | **17** | **40** | 5 / 9 |

The three numbers that must reach zero are **30 raw buttons, 17 pills, 40 ad-hoc radii**.
That is the whole change, and it is mechanically checkable — which is why it gets a lint
gate rather than a promise (task 4).

## Impact

- Affected specs: `studio-control-adoption` (moved here intact from
  `unify-experience-truth`, which shipped without it).
- Affected code: the eight `components/ipod/scenes/ipod-3d-*-cockpit.tsx` /
  `-dock` / `-panel` files, `components/ipod/scenes/portfolio-feed-stage.tsx`,
  `components/ipod/panels/panel-registry.tsx`,
  `components/ipod/command/command-registry.ts`.
- Depends on: `refactor-studio-controls-deterministic` (owns the primitives themselves).
- No behaviour change. Every task here is a restyle or a re-route; if a diff in this
  change alters what a control *does*, it belongs in a different change.
