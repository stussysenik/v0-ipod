# Tasks: Viewport Compose Toolkit

## 1. Shared foundations (lib/studio-camera.ts)

- [ ] 1.1 Extract the mobile gizmo's view list into a shared `CANONICAL_VIEWS`
  (Front/Back/Left/Right/Top/¾ hero) and re-point `ipod-3d-touch-controls.tsx` at it (pure
  refactor — verify the mobile gizmo still snaps identically).
- [ ] 1.2 Add `reachToOrthoZoom(reach, opts)` mapping (monotonic; size-continuous at switch
  time) and an ortho-fit helper that derives min zoom from device half-extents + aspect.
- [ ] 1.3 Unit-test the reach↔ortho-zoom mapping and ortho-fit math (mirrors the existing
  `studio-camera`/`studio-control-tokens` test style).

## 2. Camera mode: perspective ↔ orthographic (highest risk first)

- [ ] 2.1 Mount both `PerspectiveCamera` and `OrthographicCamera` in the Canvas; `makeDefault`
  the active one from a new `cameraMode` prop on `ThreeDIpod`.
- [ ] 2.2 `OrbitRig`: write position/lookAt to the active camera (read `useThree().camera`);
  in ortho, drive `zoom` from `reach` via `reachToOrthoZoom`; branch the responsive-fit effect
  on mode (fov-fit vs ortho-zoom-fit).
- [ ] 2.3 Keep size continuous across a mode switch (solve ortho zoom to match the perspective
  on-screen size at the current reach at switch time).
- [ ] 2.4 Capture path (`SceneCapture` + clip recorder): render through the active camera and
  branch off-screen frustum setup on camera type (perspective: aspect+fov; ortho: extents+zoom).
- [ ] 2.5 Verify visually: ortho **still** and ortho **clip** are WYSIWYG with the live ortho
  view; perspective export is unchanged.

## 3. Lens / FOV control (D)

- [ ] 3.1 Add `fov` state (stage) + prop to `ThreeDIpod`; set the perspective camera fov live
  and recompute the fit floor (add fov to the fit effect deps).
- [ ] 3.2 Lens slider in the Camera cockpit; disabled in ortho mode with a clear label.
- [ ] 3.3 Verify: longer/wider lens reframes without cropping on a narrow viewport; the chosen
  fov carries into a still export (WYSIWYG).

## 4. Export-aspect framing overlay (A)

- [ ] 4.1 New framing-overlay component: given canvas rect + active `aspect`, letterbox the
  centered export-crop rectangle; draw rule-of-thirds, center crosshair, and margin insets.
- [ ] 4.2 Thread `aspect` (already lifted in the stage) into the overlay; mount above the
  canvas, below the control panels; hide while `preview` is non-null.
- [ ] 4.3 Cockpit toggle (follow the `showOrigin` pattern). Decide + record the default
  (overlay on vs off) for the compose surface.
- [ ] 4.4 Verify: rectangle matches each aspect's real crop; updates live on aspect change;
  absent from preview and from exports.

## 5. Orientation gizmo (B)

- [ ] 5.1 Compose-surface gizmo driving `setCameraGoal` from `CANONICAL_VIEWS`; highlighted
  face tracks the live pose via `getCameraPose` (poll like the cockpit readout).
- [ ] 5.2 Cockpit/compose mount + toggle; suppressed during preview/export; correct z-order
  vs the floating panel system.
- [ ] 5.3 Verify: each face snaps to the exact canonical pose; highlight tracks free orbit;
  not present in exports.

## 6. Ground grid + axes (C)

- [ ] 6.1 Add drei `Grid` ground plane + world axes helper, rendered `&& !preview`.
- [ ] 6.2 Cockpit toggle; tune grid scale/fade to the device footprint.
- [ ] 6.3 Verify: toggles cleanly; never appears in preview or export.

## 7. Cockpit integration + non-baked guarantee

- [ ] 7.1 Group the new controls in `Ipod3DCameraCockpit` (mode toggle, lens, framing, grid,
  gizmo) using the existing studio-control primitives; keep the panel coherent.
- [ ] 7.2 Single regression pass: enable **every** aid, export a still and a clip, confirm none
  appear; confirm canvas drag-orbit, origin gizmo, mobile touch layer, and lock all still work.

## 8. Validation

- [ ] 8.1 `oxlint` + `tsc --noEmit` clean for all touched files.
- [ ] 8.2 Run the `studio-camera` unit tests (incl. new mapping tests) green.
- [ ] 8.3 Visual verification on a running dev viewport across both camera modes, all aspects,
  every aid — and a clean export with all aids on.
