# Tasks

## 1. Neutral uniform field (landed this session)
- [x] 1.1 Replace radial-gradient `StudioBackdrop` with a flat, unlit Stage-colour field
- [x] 1.2 Verify the field is uniform on a colour stage (corners == stage colour) in live + export

## 2. WYSIWYG / deterministic capture (landed this session)
- [x] 2.1 Remove the post-processing `<Vignette>` and the whole `EffectComposer` layer
- [x] 2.2 Set renderer `toneMapping: NoToneMapping` directly (composer previously forced it)
- [x] 2.3 Strip vignette from `ColorResolvePass` (linear → sRGB only)
- [x] 2.4 Remove the ambient `<Float>` so capture (frameloop-paused) cannot freeze a random tilt
- [x] 2.5 Verify clip frame == live preview at the same t (camera pose + colour); confirm clean loop seam (f0 ≈ flast)

## 3. Absolute colour precision (landed this session)
- [x] 3.1 Remove the wheel `satinPlasticColor` luminance floor; use the exact picked hex
- [x] 3.2 Remove the wheel-well-floor darkening tint (matches ring colour now)
- [x] 3.3 Face: metalness → 0, low `envMapIntensity`, modest clearcoat (albedo-faithful)
- [x] 3.4 Back shell: reduce metalness/env so the picked albedo (incl. white) survives
- [x] 3.5 Verify true `#FFFFFF` (lit ≈ white) and `#000000` (≈ black) on every surface
- [ ] 3.6 Audit remaining stark "doodle" lines on the all-white theme (seam/bezel/chamfer) and ensure none are auto-darkened beyond user colour controls

## 4. Boomerang loop + motion speed (pending)
- [ ] 4.1 Add a ping-pong (boomerang) time map in `lib/studio-camera.ts`, applied in both preview and export
- [ ] 4.2 Add a user-settable motion-speed control to the export dock, lifted to the stage
- [ ] 4.3 Thread speed into the preview rig and the offline clip render identically
- [ ] 4.4 Verify boomerang seam + speed parity between preview and export

## 5. Custom-angle / motion-free export (pending)
- [ ] 5.1 Allow saving any landed camera pose as a recallable preset (alongside snaps/studio shots)
- [ ] 5.2 Add a "no motion" option so a still/clip exports the held composed angle
- [ ] 5.3 Verify a motion-free export holds the exact composed pose

## 6. Control focus + responsive layout (pending)
- [ ] 6.1 Ensure the control surface renders above the iPod canvas (z-order) and receives pointer events
- [ ] 6.2 Verify no panel overlaps/clips across the breakpoint range (wide → narrow)
- [ ] 6.3 Visually delineate the preview transport from the export settings in the dock
- [ ] 6.4 Verify usable layout at representative widths (desktop, tablet, mobile)

## 7. Validation & ship
- [ ] 7.1 `pnpm type-check` and lint clean for all touched files
- [ ] 7.2 Re-verify display + click-wheel export correctly (stills + clip) after all changes
- [ ] 7.3 Commit and push the branch
