# Tasks: 3D Studio Control Suite

Every phase ends with a **visual verification** on the running `/3d` (vision check) —
the artifact must look trustworthy, not just compile.

## 0. Session 1 — landed in the working tree (not committed)
- [x] **Export WYSIWYG fix** — `lib/three-color-resolve.ts` `ColorResolvePass` (vignette + sRGB
  encode); both still + clip paths route through it. Verified PNG matches live exposure. *(D10)*
- [x] **Named "Apple product" lighting rig** extracted → `components/three/studio-lighting.tsx`
  (`APPLE_PRODUCT_RIG`, data-driven for Phase 3 tuning); env-first + front-fill softbox.
- [x] **Silver finish fidelity** — front-fill softbox + env intensity lift; Silver now reads as
  brushed satin (was near-black), Black still rich. Verified both live.
- [x] **Responsive control surface** — `lg:contents` one-tree layout (desktop corner HUD /
  mobile bottom sheet + Controls toggle); fluid panel widths. *(D11)*
- [x] **Aspect-aware stage framing** — OrbitRig fit-reach floor so portrait/mobile no longer
  crops the device; zoom-out clamp raised to 22.
- [x] **Battery cockpit** — `ipod-3d-battery-cockpit.tsx` (level + manual/solar), wired into stage.
- [x] **Telephoto distortion-free front framing** for export (round wheel / square screen) —
  fov 14 @ `[1.5,0.5,36.6]`, near-dead-on; fov saved/restored. Verified PNG: round wheel,
  square screen, zero keystone.
- [x] **Personalized back engraving** — carrot 🥕 vector mark, "Designed by Stüssy Senik",
  "Manufactured in Czech Republic" (`createBackEngravingTexture`). Verified live. *(D12)*
- [x] **Storage (GB) single source of truth** — `capacityLabel` added to every preset; stage
  title + back engraving both read `activePreset.capacityLabel` (verified "120GB" on both).
- [x] **Saved studio shots** — `ipod-3d-studio-shots.tsx` bottom bar (orientation pills +
  shot chips); save bundles pose + finish, recall restores both. Focus lifted to a controlled
  prop on `ThreeDIpod`. Verified save→change→recall.
- [x] **Wheel form matches the 2D authority** — `ipod-3d-dimensions.ts` now projects
  `wheel.size`/`centerSize`/`controlMarginTop` (was hand-tuned 0.55 → too small / dead band).
  Wheel fills the face, center at ~0.74H. Verified live.
- [x] **Screen-bake hardening** — `bakeNodeOnto` force-unhides any `occlude`-hidden ancestor
  so a back-pose export bakes the now-playing screen instead of a blank idle LCD.
- [ ] **Saturated custom cockpit colors** sanity-check under the brighter env — TODO
- [ ] Fold cockpits into the unified clean-minimal HUD (Phase 3)

## 0b. NEW — export-pop + lockable perspective (this session; design D13, 2026-06-07 pm)
**Export is THE focus — make it pop; attention order = album art → music → assembly.**
Approved scope: studio "pop" recipe + two framings + lockable hero pose. Live `/3d` mirrors
the export (WYSIWYG). Pure optical craft — NO DOF/bloom; everything stays tack-sharp.
Each step captures a real export, reads it back, and judges it vs the baseline + 2D export.
- [x] **Studio sweep** — `StudioBackdrop` in `studio-lighting.tsx`: drei `<Backdrop>` cove with
  an UNLIT radial-gradient texture (`toneMapped={false}`, predictable + WYSIWYG) tinted from the
  **Stage colour**; brightest behind the device, ~24% falloff to the edges. Live + export.
  Verified: device is grounded in a cove instead of floating on flat colour. *(3d-export)*
- [x] **Soft contact shadow** — existing `<ContactShadows>` now reads against the cove floor
  (it was invisible edge-on before); grounds the device. Verified in both still framings. *(3d-export)*
- [x] **Rim / kicker separation light** — retuned the `rim` spot to rake from upper-back-LEFT
  (`[-6,7,-8]`, intensity 70, angle 0.5) so the silhouette separates from the sweep. *(3d-export)*
- [x] **Verify "pop"** — Hero export read back: depth + separation + grounding clearly beat the
  baseline; album art still reads first. *(meets-or-beats 2D)*
- [x] **Hero (3/4) still mode** — new `frameForHero` + `ExportFraming` ("front"|"hero") threaded
  through `captureHighRes`/handle/dock; renders from the composed/locked angle, refit to fill the
  9:16 portrait at a 24° lens (same RT+bake+colour-resolve). Dock has "Still · Hero" + "Still ·
  Front". Verified both. *(3d-export)*
- [x] **Verify framings** — Front = undistorted fidelity (round wheel / square screen); Hero =
  dimensional 3/4 filling the frame; both clean (HUD is DOM outside the framebuffer).
- [x] **Lockable perspective** — lock toggle in the **camera cockpit** (`cameraLocked` owned by
  the stage → `OrbitRig` ignores drag/wheel; steppers + Save frozen); pose persists to
  `localStorage` (`ipod-3d-locked-pose`), restores on reload (poll until the rig registers before
  `setCameraGoal`), drives Hero + clips. *(3d-camera-system)*
- [x] **Verify lock** — locked az 30°/el 13°, reloaded → restored + still Locked; Hero export
  flew the locked angle.
- [ ] **Highlight roll-off (polish, gated)** — DEFERRED. Gentle filmic shoulder in BOTH the live
  `EffectComposer` and `ColorResolvePass`. Deferred because the hero already pops via
  grounding+sweep+rim, and tone-mapping touches the WYSIWYG-critical colour tail (high regression
  risk per lessons). Offer as a separate follow-up.
- [x] **Validate** — `pnpm type-check` clean; `pnpm lint` 0 errors; `pnpm build` exit 0
  (also fixed a pre-existing `react-hooks/refs` build failure on `colorResolveRef` lazy-init).

## 0c. DEFERRED — remaining export-first items (after 0b)
- [ ] **Clean export + hideable HUD toggle** — exports are already clean (HUD is DOM outside
  the WebGL framebuffer); remaining work is a live-stage hide-ALL-HUD toggle (clean compose
  mode). *(3d-export)*
- [ ] **Double-tap now-playing editing in /3d** — double-tap album art → image picker (insert
  cover); double-tap title/artist/album/track → inline text input; bakes into exports.
  *(3d-interactive-playback)*
- [ ] **Realistic outer-ring illusion** — make the click-wheel touch annulus read as a real
  seated, slightly-recessed satin ring (soft sheen + edge micro-shadow), not a flat disc; the
  known-hard fidelity problem. *(3d-product-fidelity)*

## 1. Product fidelity (baseline landed — ratify + finish)
- [x] Face material → anodized aluminum (metalness 1.0, satin roughness, env-driven)
- [x] Real 2008 palette: Silver/Black finishes; light finish is silver, not paper-white
- [x] Default wheel colors derive from the case (no hardcoded merging ring)
- [x] Conservative key light + env-first brightness (no blow-out)
- [x] Verify Silver finish live (no clipped highlights; reads as brushed metal)
- [x] Confirm concentric, CNC-correct wheel geometry dead-on
- [x] Define + name the default "Apple product" lighting rig; verify both finishes
- [ ] Sanity-check saturated custom cockpit colors still read as intentional anodized metal
- [ ] Personalized back engraving (carrot 🥕 + Stüssy Senik + Czech Republic), recessed etch
- [ ] Storage (GB) consistent across screen UI, back engraving, and preset

## 2. Camera system
- [ ] Resolve drei `GizmoHelper` ↔ custom `OrbitRig` binding (or custom cube on `getCameraPose()`)
- [ ] Origin X/Y/Z triad at model origin, labeled, in studio coordinates
- [ ] Corner ViewCube reflecting current orientation; faces trigger snaps
- [ ] Single toggle shows/hides axis viz (excluded from exports)
- [ ] Ortho snaps: Front/Back/Left/Right/Top/Bottom → exact poses via `setCameraGoal`
- [ ] Free orbit preserved between snaps; pose HUD updates continuously
- [ ] Detent module: `navigator.vibrate` (touch) + visual flash + audio tick (desktop)
- [ ] Settable + savable named poses (persisted, recallable)
- [ ] Saved **studio shots** = camera pose + product perspective (finish/colors/orientation)
  bundled as one "quick variable", recallable as toggles in the bottom bar (with Product/Front/Back)
- [ ] Resizable stage without proportion distortion
- [ ] Verify live: axis/cube/HUD agree in one coordinate system; snaps land dead-on

## 3. Control surface
- [x] Confirm library choice — **leva** (drives the D9 keyframe engine); dep not yet added
- [x] Responsive, touch-operable layout (corner HUD / mobile bottom sheet); aspect-aware framing
- [x] Battery control parity with 2D (level + manual/solar)
- [ ] Author each control as a portable module (for later `/portfolio` reuse)
- [ ] Add the leva dependency
- [ ] Dev-toggle-gated developer utility bound to material/lighting/camera params
- [ ] CMD+K command palette exposing finishes, snaps, axis toggle, presets, export, dev toggle
- [ ] Additive control-layer store with provenance + per-layer revert
- [ ] Clean-minimal translucent HUD styling (light-on-light, hairlines); tighter-bound as options grow
- [ ] On-screen game-dev/early-internet HUD verification utilities (pose/preset/layer inspectors)
- [ ] Verify live: palette runs every action; dev panel tunes scene; HUD shows live state

## 4. Motion presets
- [x] Make move presets additive + toggleable (orbit/robo/turntable/sweep retained)
- [x] Add MKBHD-style robotic-crane move in `lib/studio-camera.ts` (seamless loop)
- [x] Wire crane into export dock + palette
- [ ] Verify: switch presets without losing others; crane loop seam continuous (extend `tests/3d-clip-verify.spec.ts`)

## 5. Static front .mp4 export
- [x] Exports are WYSIWYG with the live view (color-resolve pass) — applies to all exports
- [ ] Distortion-free telephoto front framing (round wheel, square screen, no keystone)
- [ ] Static front export via offscreen `WebGLRenderTarget` (still pipeline), single fixed pose
- [ ] Encode N identical frames / 1-frame loop through existing WebCodecs `mp4-muxer` path
- [ ] Add control in export dock + palette; coexists with PNG + motion clips
- [ ] Verify: produced `.mp4` is motionless, front, fidelity == PNG still

## 6. Interactive playback
- [ ] Wire 3D wheel controls (Menu/‹‹/››/play-pause/center) to the shared OS reducer
- [ ] Dispatch real web-API interaction events on actuation
- [ ] Ensure 2D edits function inside `/3d`
- [ ] Verify: menu navigation + playback + edits behave identically to 2D

## 7. UI choreography
- [ ] Keyframed transition animating `NOW_PLAYING_LAYOUT_ELEMENT_IDS` into now-playing
- [ ] Resolve to user-authored positions as end state
- [ ] Human- + machine-readable choreography export (named keyframes), round-trippable
- [ ] Re-import reproduces the animation exactly
- [ ] Verify: transition plays; export → re-import is lossless

## 8. Program validation
- [ ] `pnpm type-check` + `pnpm lint` clean
- [ ] All phase vision checks captured (before/after screenshots)
- [ ] Confirm the artifact bar: trustworthy, clean-minimal, would pass Ive/Fadell/Vercel review
</content>
