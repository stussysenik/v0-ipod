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
- [x] 3.6 Audit remaining stark "doodle" lines on the all-white theme (seam/bezel/chamfer) and ensure none are auto-darkened beyond user colour controls — the two culprits (wheel luminance floor, well-floor 0.82 tint) were already removed; face/back/wheel/bezel all render the picked hex faithfully (bezel is user-controlled, default near-black by intent). Remaining seam/chamfer definition is natural form-shading (AO/shadow), not auto-darkening.

## 4. Boomerang loop + motion speed (landed this session)
- [x] 4.1 Add a ping-pong (boomerang) time map in `lib/studio-camera.ts`, applied in both preview and export — `LoopStyle` + `pingPong` (eased triangle, C¹ at the turnaround) drive `phaseForProgress`
- [x] 4.2 Add a user-settable motion-speed control to the export dock, lifted to the stage — Speed stops (0.5×–2×) + Loop/Boomerang/Hold style, lifted to `Ipod3DStage`
- [x] 4.3 Thread speed into the preview rig and the offline clip render identically — both call `cyclesForDuration(move, dur, speed, loop)`; verified 30s turntable reads 5×/10×/3× at 1×/2×/0.5×
- [x] 4.4 Verify boomerang seam + speed parity between preview and export — `pingPong(0)=0`, `pingPong(int)=0` (closes on hero), start≈end (7.98e-8); preview readout === export cadence

## 5. Custom-angle / motion-free export (landed this session)
- [x] 5.1 Allow saving any landed camera pose as a recallable preset (alongside snaps/studio shots) — satisfied by existing `Ipod3DStudioShots` (angle+finish chips) + camera-cockpit save-pose; a recalled pose becomes the captured hero anchor every Hero/clip export flies
- [x] 5.2 Add a "no motion" option so a still/clip exports the held composed angle — `loop: "hold"` pins the hero pose every frame; clip names as `ipod-3d-hold-…`
- [x] 5.3 Verify a motion-free export holds the exact composed pose — Hold disables move+speed, readout shows "still", clip hint reads "no motion"; rig + offline render both short-circuit to the hero pose

## 6. Control focus + responsive layout (landed this session)
- [x] 6.1 Ensure the control surface renders above the iPod canvas (z-order) and receives pointer events — canvas owns its own stacking context (z-0); control groups sit above with their own pointer ownership
- [x] 6.2 Verify no panel overlaps/clips across the breakpoint range (wide → narrow) — verified at 1280 (floating HUD), 820 (collapses to drawer toggle), drawer open (scrolling bottom sheet); device never occluded
- [x] 6.3 Visually delineate the preview transport from the export settings in the dock — the live transport now sits under its own labelled **Preview** header, set off from the **Export** settings (aspect/quality/length) above
- [x] 6.4 Verify usable layout at representative widths (desktop, tablet, mobile) — ≥lg floats at the corners; <lg collapses into a scrollable bottom sheet, no overlap

## 7. Validation & ship (landed this session)
- [x] 7.1 `pnpm type-check` and lint clean for all touched files — type-check 0 errors; lint 0 errors (43 pre-existing repo warnings in `ipod-click-wheel.tsx`, none mine)
- [x] 7.2 Re-verify display + click-wheel export correctly (stills + clip) after all changes — `/3d` renders with the baked Now Playing screen + MENU/◀◀/▶▶/▶❙❙ glyphs; no console errors through style/speed/hold/responsive interaction
- [x] 7.3 Commit and push the branch
