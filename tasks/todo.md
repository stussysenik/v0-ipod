# 3D Studio Control Suite — Session 3 Handoff

OpenSpec change: **`add-3d-studio-control-suite`** (re-validated `--strict` ✓). Read
`openspec/changes/add-3d-studio-control-suite/{proposal,design,tasks}.md` + `specs/*` —
durable source of truth (export-pop design is **D13**; ordered checklist is **§0b**).

## Landed Session 3 — export "pop" + lockable perspective (working tree — NOT committed)
`pnpm type-check` clean · `pnpm lint` 0 errors · `pnpm build` exit 0.
- **Studio sweep** — `StudioBackdrop` in `components/three/studio-lighting.tsx`: drei `<Backdrop>`
  cove with an UNLIT radial-gradient texture (`toneMapped={false}`) tinted from the **Stage
  colour**; brightest behind the device, ~24% falloff to the edges. Wired into the Canvas in
  `three-d-ipod.tsx`. Grounds the device instead of floating it on flat colour.
- **Contact shadow** — the existing `<ContactShadows>` now reads against the cove floor (was
  invisible edge-on before the sweep gave it a surface).
- **Rim separation** — `APPLE_PRODUCT_RIG.rim` retuned to rake from upper-back-LEFT
  (`[-6,7,-8]`, intensity 70, angle 0.5) so the silhouette pops off the sweep.
- **Two export framings** — new `ExportFraming` (`"front"｜"hero"`) threaded through
  `captureHighRes` → handle → stage → export dock. **Still · Front** = unchanged dead-on
  telephoto fidelity; **Still · Hero** = new `frameForHero` rendering the composed/locked
  angle, refit to fill the 9:16 portrait at a 24° lens (same RT+bake+colour-resolve path).
  Clips inherit the studio scene automatically.
- **Lockable perspective** — `cameraLocked` owned by `Ipod3DStage`, passed to `ThreeDIpod` →
  `OrbitRig` (ignores drag/wheel when locked) and to the **camera cockpit** (🔒 Lock toggle;
  steppers + Save frozen). Pose persists to `localStorage["ipod-3d-locked-pose"]`, restores on
  reload (polls `getCameraPose()` until the rig is live, then `setCameraGoal`), and is the
  angle every Hero/clip export flies. Verified: lock az30/el13 → reload → restored + Locked →
  Hero export flew it.
- **Build fix** — `colorResolveRef` lazy-init changed `!ref.current` → `ref.current == null`
  (the pre-existing form failed `next build` via `react-hooks/refs`; see lessons).

## NOT done this session (deliberate)
- **Highlight roll-off** (§0b, gated) — gentle filmic shoulder in BOTH the live `EffectComposer`
  AND `ColorResolvePass`, pixel-verified live-vs-PNG. Deferred: the hero already pops, and
  tone-mapping touches the WYSIWYG-critical colour tail (high regression risk per lessons).
  Pick this up first if export polish is wanted.

## NEXT SESSION — remaining export-first items (§0c) + phased plan
1. **Highlight roll-off** (above) — the one remaining piece of the export-pop headline.
2. **Hide-all-HUD toggle** — exports are ALREADY clean (HUD is DOM outside the WebGL
   framebuffer); the only missing piece is a live-stage toggle to hide all chrome (clean
   compose mode). *(3d-export)*
3. **Double-tap now-playing editing** — double-tap album art → image picker; double-tap
   text → inline input; bakes into exports. *(3d-interactive-playback)*
4. **Realistic outer-ring illusion** — the click-wheel annulus as a seated satin ring (soft
   sheen + edge micro-shadow). Known-hard; study real-time edge-cue rendering. *(3d-product-fidelity)*
Then the phased plan: Phase 2 camera viz/snaps/detent → Phase 3 CMD+K + leva/D9 keyframe →
Phase 4 crane → Phase 5 static front mp4 → 6 playback → 7 choreography.

## Notes / gotchas
- Dev server: `pnpm dev` → http://localhost:4001/3d (logs `/tmp/ipod-dev.log`).
- Exports download to `~/Downloads/ipod-3d-{hero|front}-*.png`. Hero flies the composed/locked
  pose; Front always reframes to the dead-on telephoto.
- Sweep is UNLIT on purpose (predictable + WYSIWYG); don't make it env-lit or it blows to white.
- `setCameraGoal` no-ops until `OrbitRig` registers — poll `getCameraPose()` before restoring a pose.
- Uncommitted. Files touched this session: `components/three/studio-lighting.tsx`,
  `components/three/three-d-ipod.tsx`, `components/ipod/scenes/ipod-3d-stage.tsx`,
  `components/ipod/scenes/ipod-3d-camera-cockpit.tsx`, `components/ipod/scenes/ipod-3d-export-dock.tsx`.
