## Context

`/3d` drives its camera with a **custom `OrbitRig`** in `components/three/three-d-ipod.tsx`: it
holds spherical `azimuth / polar(elevation) / radius(reach)` state and eases the live camera
toward a goal each frame. It is **not** drei `OrbitControls`. The rig exposes a public
`ThreeDIpodHandle` (surfaced via `ipodApiRef` in
`components/ipod/scenes/ipod-3d-stage.tsx`):

- `getCameraPose()` → current `{ azimuth, elevation, reach }` (degrees)
- `setCameraGoal({ azimuth, elevation, reach })` → sets the eased goal; clamps `elevation` to
  `ELEVATION_RANGE` [-78, 78] and `reach` to `REACH_RANGE` [5.5, 19] (`lib/studio-camera.ts`)
- `resetCamera()` → back to the default pose
- `getCanvas()` → the live `<canvas>` element

The desktop cockpit `components/ipod/scenes/ipod-3d-camera-cockpit.tsx` already nudges the camera
with `getCameraPose()` + `setCameraGoal()`, so that pattern is proven.

Layout: a full-screen canvas; a responsive control sheet (mobile bottom-sheet via `controlsOpen`,
desktop floating panels at `lg:`); and an always-visible bottom bar `Ipod3DStudioShots`
(Product / Front / Back + saved shots). On mobile the only camera affordance today is a raw
canvas drag — no canonical-view snapping, no fine precision, no reach control — making the studio
awkward one-handed.

This change is scoped to the **mobile touch control layer only**. It complements
`add-3d-studio-control-suite`, which owns the desktop gimbal / ViewCube, saved studio shots, and
perspective lock under the same `3d-camera-system` capability.

## Goals / Non-Goals

- Goals:
  - One-thumb camera operation on mobile: snap to canonical views, fine continuous orbit, and
    pinch-to-zoom reach.
  - Drive the existing rig **only** through its public API — no second camera/controls system.
  - Toggleable from settings, with a sensible `(pointer: coarse)` default.
  - Zero regression to canvas drag, desktop cockpit, or clean exports.
- Non-Goals:
  - Replacing or reauthoring `OrbitRig`.
  - Desktop gizmo / ViewCube, saved shots, or perspective lock (owned by
    `add-3d-studio-control-suite`).
  - New persistence schema beyond an optional model-UI-state toggle flag.

## Decisions

- **Decision: Drive a custom adapter, not drei `<GizmoHelper>`.** drei's
  `<GizmoHelper>` / `<GizmoViewport>` are wired to drei `OrbitControls`; since the rig is the
  custom `OrbitRig`, the gizmo would have nothing to auto-control. The widget therefore reads
  `getCameraPose()` for its displayed orientation and writes canonical poses with
  `setCameraGoal()`.
  - Alternatives considered:
    - *Adopt drei `OrbitControls` so `GizmoHelper` auto-wires.* Rejected: replaces the bespoke
      eased rig and its clamps, a far larger and riskier change than the mobile feature warrants.
    - *Bridge drei `GizmoHelper` to the rig via an imperative ref shim.* Rejected: a fragile
      adapter against drei internals; a small custom widget over the public API is simpler and
      self-contained. (drei 10.7.7 / @react-three/fiber 9.5 / three 0.182 remain available if a
      future change wants the drei path.)

- **Decision: Accumulate orbit deltas from a start-of-gesture goal.** On `pointerdown`/`touchstart`
  capture the current goal via `getCameraPose()`; on each move add the accumulated pixel→degree
  delta to that captured base and call `setCameraGoal`. Re-reading the *eased* live pose mid-drag
  would let the goal chase a moving target and drift behind the finger.
  - Alternative considered: *increment the goal by per-frame deltas.* Rejected: compounds rounding
    and eases unevenly, producing the same drift.

- **Decision: Handle touch via pointer-count disambiguation on a dedicated pad/canvas surface.**
  Track active pointers; one pointer = orbit, two pointers = pinch (distance delta → `reach`). Use
  `getCanvas()` (or the pad element) for listeners with `touch-action: none` so the browser does
  not scroll/zoom the page. This keeps gestures from triggering each other and keeps the page
  still.
  - Alternative considered: *separate always-visible slider for reach instead of pinch.* Kept as a
    possible fallback only; pinch is the expected mobile idiom and the user asked for it explicitly.

- **Decision: Toggle state lives stage-local in `ipod-3d-stage.tsx`, defaulted by media query.**
  Initialize from `window.matchMedia('(pointer: coarse)').matches` (ON for coarse, OFF for fine);
  the cockpit toggle overrides it. Persisting to model UI state is an optional enhancement, not
  required for the default behavior.
  - Alternative considered: *persist exclusively in model UI state.* Deferred: adds schema surface;
    the media-query default already gives the right out-of-box behavior, and stage-local state is
    the lightest correct home.

## Risks / Trade-offs

- **Gesture conflict with existing canvas drag** → place the orbit-pad/gizmo as a distinct surface
  and/or suppress canvas drag-orbit while the touch layer owns the gesture; verify both paths on a
  real mobile viewport.
- **Page scroll/zoom hijacking the pinch** → set `touch-action: none` on the gesture surface and
  `preventDefault` on tracked touch events.
- **Drift / jitter in fine orbit** → mitigated by the start-of-gesture accumulation decision; tune
  the pixel→degree gain for comfortable precision.
- **Thumb occlusion of the model** → anchor controls above the bottom bar and keep them compact /
  semi-transparent so they do not cover the hero.
- **Clamp surprises at poles / reach limits** → rely on the API's own clamping
  (`ELEVATION_RANGE` / `REACH_RANGE`) as the single source of truth rather than re-clamping in the
  UI.

## Migration Plan

Additive only; no existing behavior changes. Ship the touch layer behind the toggle (default by
pointer media query). If a regression appears, the feature is disabled by toggling it off (and is
off by default on desktop), with no data migration required. Rollback = remove the layer mount and
the cockpit toggle row.

## Open Questions

- Should the enabled/disabled state persist across reloads (model UI state) or reset to the
  media-query default each load?
- Should engaging the touch layer fully suppress canvas drag-to-orbit, or should both coexist when
  they do not overlap?
- Do snaps deserve detent feedback (`navigator.vibrate`) here, or is that left to the
  `add-3d-studio-control-suite` detent requirement to avoid duplication?
