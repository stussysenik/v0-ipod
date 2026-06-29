# Design: Viewport Compose Toolkit

## Context

The `/3d` camera is a custom `OrbitRig` (`three-d-ipod.tsx:1570`) — the *sole* writer of
camera state. Every frame it eases spherical state (`az`, `pol`, `rad`) toward a goal and
writes `camera.position` + `camera.lookAt`. There is intentionally **no `OrbitControls`**,
so there is never a two-writer fight. The public `ThreeDIpodHandle` exposes
`getCameraPose` / `setCameraGoal` / `resetCamera` in **studio coordinates**
(azimuth°, elevation°, reach), and `studio-camera.ts` owns the coordinate math and the
`ELEVATION_RANGE` / `REACH_RANGE` clamps.

Everything here must preserve two invariants:
1. **One camera writer per frame** — the rig stays the only thing that moves the camera.
2. **WYSIWYG export** — the offline capture/clip path renders the *same* camera the user
   sees, so a still/clip matches the live viewport exactly.

The new aids split cleanly into two classes:
- **DOM overlays** (framing overlay A, optionally the gizmo B) live *over* the canvas in
  the DOM. They are inherently absent from `gl.render` canvas capture, so they are
  export-safe by construction.
- **In-scene helpers** (grid + axes C, ortho camera) live *inside* `gl`. These must be
  conditionally rendered / handled so they never appear in a captured frame.

## Goals / Non-Goals

**Goals**
- Compose inside the true export crop (A).
- One-click canonical perspective changes on the compose surface (B).
- Spatial reference floor + axes (C).
- Adjustable lens length and a real orthographic mode (D + mode).
- Zero new camera-writer; zero new bake artifacts.

**Non-Goals**
- No second control system (no drei `OrbitControls` / `CameraControls`).
- No change to the motion-preset clips, the proof cache, or the export machine state graph.
- No change to studio coordinates as the public language (ortho is expressed in the same
  az/el/reach; reach maps to zoom internally).

## Decision 1 — Orthographic mode via dual camera ownership

three.js cannot morph a `PerspectiveCamera` into an `OrthographicCamera`; they are distinct
objects with different projection math. So:

- Mount **both** a `PerspectiveCamera` and an `OrthographicCamera` in the Canvas. The active
  one is `makeDefault` based on `cameraMode` state.
- `OrbitRig` writes `position` + `lookAt` to **whichever camera is active** (it reads
  `useThree().camera`, which tracks `makeDefault`). Position math is identical — both
  cameras sit at `poseToPosition(pose)` and look at the target.
- **Apparent size:** perspective uses *dolly* (distance = size). Ortho has no perspective
  foreshortening, so distance does not change size — `zoom` does. Map the same `reach` dial
  to ortho zoom via a helper `reachToOrthoZoom(reach)` in `studio-camera.ts` (monotonic:
  smaller reach → larger zoom → bigger device), so the Reach stepper and pinch keep working
  unchanged in both modes. The camera still physically moves to `poseToPosition` so the
  *angle* (az/el) reads correctly; only the size channel switches from dolly to zoom.
- **Responsive fit:** the perspective fit derives the min reach from `fov` + aspect. For
  ortho, derive the min `zoom` from the same device half-extents + aspect (no `tan`), and
  clamp. Keep both paths in the existing fit effect, branched on mode.
- **Capture path:** `SceneCapture` and the clip recorder currently assume the perspective
  camera. They must render through the **active** camera (`gl.render(scene, activeCamera)`),
  and any frustum/aspect recompute the capture does for off-screen dimensions must branch on
  camera type (perspective: set `aspect` + `fov`; ortho: set `left/right/top/bottom` from the
  ortho frustum + zoom). This is the highest-risk change and gets explicit visual verification
  in both modes.

**Alternative considered:** a single perspective camera faking ortho with a very long lens +
large reach. Rejected — it is never truly parallel-projected, breaks at the edges, and an
engineer asking for an orthographic elevation would not get one. The dual-camera cost is a
real ortho.

## Decision 2 — Orientation gizmo drives the public API, not drei controls

drei's `<GizmoHelper>` / `<GizmoViewport>` expect a controls object (it calls
`controls.setPosition` / relies on `OrbitControls`) to move the camera on a face click. We
have no controls. Two options:

- **(chosen) Hand-rolled gizmo → `setCameraGoal`.** Reuse the canonical view set already in
  the mobile touch gizmo (`ipod-3d-touch-controls.tsx` `VIEWS`), extracted to a shared
  `CANONICAL_VIEWS` in `studio-camera.ts`. A click sets the goal pose; the rig eases there.
  The gizmo's highlighted face tracks the live pose read via `getCameraPose`. Consistent with
  the existing mobile gizmo, no parallel control system, lowest risk.
- (rejected) Wire `<GizmoHelper>` with a custom `onUpdate`/fake-controls shim — fights drei's
  internal assumption of an `OrbitControls`-shaped object and risks a second writer.

The gizmo is rendered on the compose surface (DOM/HUD), suppressed during preview/export. It
is a *desktop* compose instrument; the mobile touch gizmo stays as-is (both now read the same
shared `CANONICAL_VIEWS`, removing the duplicated list).

## Decision 3 — Framing overlay is pure DOM, driven by `aspect`

The overlay is a positioned DOM layer above the `<Canvas>`, not an in-scene object. Given the
canvas rect and the active export aspect ratio (from `ASPECT_DIMS` / the `aspect` state lifted
in the stage), it letterboxes a centered crop rectangle matching the export, then draws
rule-of-thirds, center crosshair, and margin insets inside that rect. Because it is DOM over
the canvas (the same mechanism as `OriginMarker`'s drei `Html`, but a plain overlay), it is
**never** part of a `gl` canvas capture — export-safe by construction. It still must hide on
preview/export for a clean live read during playback. It re-renders on `aspect` change, so the
"preview is updating" requirement is satisfied by reading the single source of truth.

## Decision 4 — Lens slider recomputes the fit floor

The responsive fit effect already reads `cam.fov`. Today `fov` is constant; the lens slider
makes it stateful. Setting `fov` requires `camera.updateProjectionMatrix()` and a refit, so:
add `fov` to the fit effect's dependencies (or recompute fit inside the rig when fov changes)
and clamp the resulting reach floor as today. In ortho mode the slider is disabled (ortho has
no focal length) or repurposed to drive zoom directly — chosen: **disabled in ortho**, with a
clear label, to keep the size channel single-sourced through reach.

## Decision 5 — Compose aids are uniformly non-baked

A single rule, applied per aid:
- DOM overlays (framing, gizmo): excluded from capture by construction; additionally hidden
  while `preview` is non-null so playback reads clean.
- In-scene helpers (grid, axes): rendered `&& !preview` and the capture path already sets
  `capturingRef`, so gate them with the same `!preview` guard the `OriginMarker` uses, and
  rely on the existing capture suppression. Verified by exporting with every aid on and
  confirming none appear.

## Risks / Trade-offs

- **Ortho capture parity is the sharp edge.** Off-screen render-target sizing, the
  `ColorResolvePass`, and the clip recorder were written for a perspective camera. Mitigation:
  branch capture frustum setup on camera type; verify a still *and* a clip in ortho mode
  pixel-match the live view before claiming done.
- **Reach↔zoom mapping discontinuity on mode switch.** Switching modes could pop the apparent
  size. Mitigation: choose `reachToOrthoZoom` so the device's on-screen size is continuous at
  the current reach at the moment of switching (solve zoom so size matches the perspective
  size at switch time, then hold the mapping).
- **Gizmo/overlay z-order vs the floating panel system.** The compose aids must sit above the
  canvas but below the control panels (same stacking discipline as the existing chrome).
  Mitigation: mount within the established stacking context, `pointer-events` only on the
  interactive gizmo.

## Migration / Rollout

Additive and behind toggles (default off, except the framing overlay may default on for the
compose surface — decided in tasks). Existing perspective behavior is the default camera mode,
so nothing changes until the user opts into an aid. The shared `CANONICAL_VIEWS` extraction is
a pure refactor of an existing constant.
