# Change: Independently colorable device edges on /3d

## Why

On the `/3d` studio the device's **side rim** (the band of chassis the eye reads as the
"edge") is not its own part — it is geometry belonging to the steel back shell and is
therefore locked to whatever **Back** color is set. In `components/three/three-d-ipod.tsx`
the `bodyGeo` ExtrudeGeometry is the polished-steel back shell that **rolls over the
sides**, and it is painted with a single `backColor`. So a user who wants, say, a black
back with a brushed-silver rim — or a colored anodized edge — cannot express it; the sides
and the back are one material. To let the product be specified the way real anodized
hardware reads (a distinct rim finish around the body), the side/bevel faces need to become
their own addressable, colorable part — without changing how existing devices look until
someone actually edits the edge.

## What Changes

- **3D product fidelity** — separate the device **edges** (the side/rim band of the
  chassis) from the steel back so they can carry their own color, and expose an **Edges**
  color control alongside the existing Back control. The edge becomes a first-class,
  separately addressable material zone (a distinct material group on the back shell's side
  faces, or a thin edge-trim mesh — see `design.md`). The edge color **defaults to the back
  color**, so every existing finish, look, and saved shot renders identically until the
  edge is deliberately edited. The new `edgeColor` is plumbed through state, the reducer,
  defaults, persistence/normalization, and the color cockpit exactly the way `backColor`
  is, and it composes with the anodized-aluminum material model, the lighting rig, and the
  saved finishes/looks.

## Impact

- Affected specs: `3d-product-fidelity` (ADDED requirements)
- Affected code:
  - `components/three/three-d-ipod.tsx` — split the `bodyGeo` ExtrudeGeometry side faces
    into their own material group (or add an edge-trim mesh) and drive them from a new
    `edgeColor` prop; the back cap keeps `backColor`.
  - `lib/ipod-state/model.ts` — add `edgeColor` to `IpodPresentationState` and seed it in
    `createInitialIpodWorkbenchModel` (default = back color).
  - `lib/ipod-state/update.ts` — add a `SET_EDGE_COLOR` reducer action; default `edgeColor`
    to the back color on `SET_HARDWARE_PRESET` and snapshot apply.
  - `lib/ipod-state/storage.ts` — normalize/persist `edgeColor` (fallback to `backColor`).
  - `components/ipod/scenes/ipod-3d-color-cockpit.tsx` — add an **Edges** row to the
    `PARTS` array; default finishes/looks set `edgeColor` from their `backColor`.
