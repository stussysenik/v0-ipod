# Design: Independently colorable device edges

## Context

On `/3d` the chassis is built from two ExtrudeGeometries in
`components/three/three-d-ipod.tsx`: `faceGeo` (the aluminum front face, driven by
`skinColor`) and `bodyGeo` (the polished-steel back shell, driven by `backColor`). The back
shell's extrusion **rolls over the sides** — its bevel/side faces ARE the visible rim of the
device. So the band a user reads as the "edge" is geometrically part of the back and shares
`backColor`; there is no way to color the rim separately.

The state backbone for colors is uniform: each color is a field on
`IpodPresentationState` (`lib/ipod-state/model.ts`), set by a `SET_*_COLOR` reducer action
(`lib/ipod-state/update.ts`), normalized/persisted in `lib/ipod-state/storage.ts`, and
edited through a row in the `PARTS` array of
`components/ipod/scenes/ipod-3d-color-cockpit.tsx`. The clean way to add an edge color is to
mirror `backColor` through that same backbone; the only genuinely new decision is **how to
give the rim its own material in the geometry**, which is why this `design.md` exists.

A `design.md` is warranted: this touches geometry/material-group construction (an
architectural choice with real trade-offs in render correctness and capture fidelity), not
just a flat field addition.

## Goals / Non-Goals

- Goals:
  - Make the side/rim band a separately addressable, colorable material zone.
  - Expose an **Edges** color control beside the existing **Back** control.
  - Default edge == back so nothing existing changes look until edited.
  - Persist + compose the edge color exactly like the other part colors (finishes, looks,
    studio shots, anodized material model, lighting rig, export path).
- Non-Goals:
  - No new export framing, lighting, or camera behavior.
  - No separate per-edge roughness/finish control (edge inherits the steel material
    treatment; only its color is user-set). A distinct edge *finish* can be a later change.
  - No change to `faceGeo` / `skinColor` (front face) or the wheel.

## Decisions

### D1 — Split strategy: material-group on the back shell's side faces (preferred), edge-trim mesh as fallback

The rim must become its own material zone. Two viable approaches:

- **(A) Material-group split on `bodyGeo` (preferred).** `THREE.ExtrudeGeometry` already
  emits geometry groups for its sub-surfaces: the front cap, the back cap, and the
  extruded side/bevel walls. By assigning the side/wall group a second material index and
  rendering the mesh with a **material array** (`[backMaterial, edgeMaterial]`), the back
  cap keeps `backColor` and the rim takes `edgeColor` — one mesh, one geometry, zero extra
  draw setup beyond a second material. This is the most faithful: the colored band is the
  actual rolled-over chassis edge, so it captures correctly in the offscreen
  `WebGLRenderTarget` export path for free and the seam geometry is unchanged.
  - Risk: the exact group indices emitted by `ExtrudeGeometry` for the bevel + straight
    side walls must be confirmed empirically (inspect `geometry.groups` /
    `materialIndex`); if the bevel rounds onto the front/back, the boundary of "edge" vs
    "cap" needs a deliberate choice (assign the full straight wall + outer bevel ring to
    the edge group; leave the flat cap to the back).

- **(B) Thin edge-trim mesh (fallback).** Add a separate thin ring/band mesh hugging the
  silhouette, driven by `edgeColor`, layered over the back shell. Simpler to reason about
  the boundary, but it adds a mesh, risks z-fighting / a visible parting seam against the
  body, and must be kept in lockstep with `dims` and the bevel — more places to drift and
  another object to keep clean in capture.

**Decision: pursue (A); fall back to (B) only if the ExtrudeGeometry groups cannot be cleanly
separated into "edge wall" vs "back cap."** Either way the rim resolves to its own material
bound to `edgeColor`, satisfying the spec's "separately addressable material zone."

### D2 — State plumbing mirrors `backColor` exactly

`edgeColor` is added as a sibling of `backColor` everywhere `backColor` already appears:
field on `IpodPresentationState` + seed in `createInitialIpodWorkbenchModel`
(`lib/ipod-state/model.ts`); `SET_EDGE_COLOR` case plus default-on-preset and
default-on-snapshot-apply in `lib/ipod-state/update.ts`; normalize/persist with a
`backColor` fallback in `lib/ipod-state/storage.ts`; an **Edges** row in the cockpit `PARTS`
array. This keeps the change boring and uniform — no new state pattern.

### D3 — Default = back color (zero-visual-regression by construction)

The edge color is never independently seeded; it is initialized, preset-reset,
look-applied, and snapshot-fallback-resolved **from the current back color**. A device that
is never edge-edited is therefore pixel-identical to today. This also makes legacy snapshots
(no `edgeColor`) safe: they resolve edge to their stored back color.

## Risks / Trade-offs

- **ExtrudeGeometry group indices are version/parameter dependent** → confirm
  `geometry.groups` at the current three version and bevel settings before wiring the
  material array; encode the chosen index mapping in a commented constant.
- **Capture fidelity** → because (A) colors real chassis geometry, the offscreen export path
  needs no special handling; (B) would require the trim mesh to be present and clean in the
  bake. This is a reason to prefer (A).
- **Saturated edge colors under the brighter env** → like other cockpit colors, a
  fully-saturated edge will read as anodized-dyed metal; verify it still looks intentional
  (same caveat already tracked for the case color).
- **Boundary ambiguity (where "edge" ends and "back" begins)** → the rolled bevel blurs the
  line; pick and document the wall/cap split so the colored zone matches what a user calls
  "the edge."

## Migration Plan

- No data migration required. `edgeColor` is additive and optional in persistence.
- Loading any pre-existing snapshot: `storage.ts` resolves a missing `edgeColor` to that
  snapshot's `backColor`, so old saves render unchanged.
- Rollback: removing the `PARTS` row, the `SET_EDGE_COLOR` case, the field, and the geometry
  split reverts to today's single-back-color behavior; persisted `edgeColor` values are
  simply ignored by the older code path.

## Open Questions

- Should the edge eventually get its own roughness/finish (not just color)? Out of scope
  here; the field name `edgeColor` leaves room for a later `edgeFinish` sibling.
