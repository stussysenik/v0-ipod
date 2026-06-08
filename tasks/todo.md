# /3d Backbone — Plan & OpenSpec Review (2026-06-09)

Operating order from the current ask, mapped to the **approved** umbrella change
`add-3d-studio-control-suite` (35/81 tasks). This session = **plan + review only**.
No half-builds: each subsystem ships as one whole vertical slice or not at all.

## OpenSpec review findings

- **Both relevant changes validate clean** (`--strict`): `add-3d-studio-control-suite`
  and `add-3d-export-screen-animation`. The 7 backbone subsystems are already specced as
  that umbrella's remaining sections (§2/§3/§5/§6/§7) — no new proposal needed, just build.
- **Session-3 export-pop work is now committed** (git log: sweep/rim/framings/lockable pose,
  crane, mobile touch, screen-anim Phase 1). The handoff below is preserved but stale on that point.
- **Libraries:** `cmdk@1.0.4` already a dep (CMD+K has its lib). `leva` **not** added yet —
  a real install step blocking §3 dev utility + the D9 keyframe engine.
- **Loose end #1 (clean, ready):** uncommitted SSR hydration fix —
  `components/ipod/scenes/ipod-3d-stage-client.tsx` (new) + `app/3d/page.tsx`. Self-contained
  bugfix, already recorded in `lessons.md`. Commit it; it is NOT a half-build.
- **Loose end #2 (needs a decision):** `lib/marquee.test.ts` fails — stale ping-pong-cadence
  assertion vs the branch's linear-loop `marquee.ts`. Can't be fixed honestly without picking
  the canonical marquee design.
- **Integrity gap (the real one):** many tasks are `[x]` but were verified only by
  type-check/lint/build — the spec's bar is a **live `/3d` vision check**, not done. The plan
  closes this with real live verification per slice.
- **Minor openspec hygiene:** `openspec/project.md` is still the empty template; `design.md`
  "Sequencing" lists 6 phases, omitting Phase 7 UI choreography (exists in tasks §7 + D8/D9).
- **Honest deferral (leave as-is):** export-screen-animation Phase 2 compositor is deliberately
  deferred + documented; Phase 1 (live re-sample) ships.

## Anti-half-build rule — Definition of Done per subsystem

Starts only when the prior is done; "done" = ALL of:
1. OpenSpec tasks implemented (no TODO stubs in the shipped path).
2. **Live `/3d` visual verification** (drive the real WebGL UI), not just build-green.
3. `pnpm type-check` + `pnpm lint` + `pnpm build` clean.
4. Committed locally with a vision-check note. One subsystem per session.

## Sequenced plan (one per future session)

- [ ] **0. Housekeeping (cheap, first):** commit hydration fix; resolve marquee decision;
  fill `project.md`; add Phase 7 to `design.md` Sequencing.
- [ ] **1. Static-front .mp4 export** (§5) — telephoto front pose → offscreen RT still →
  encode N identical frames via existing `mp4-muxer`; dock + palette control; verify motionless,
  front, fidelity == PNG.
- [ ] **2. Detent module** (§2) — `navigator.vibrate` + visual flash + audio tick on ortho snaps.
- [ ] **3. ViewCube + axis viz** (§2) — origin triad + custom corner cube from `getCameraPose()`;
  faces trigger snaps; single toggle; excluded from exports.
- [ ] **4. leva dev utility** (§3) — add dep; dev-toggle-gated panel on material/lighting/camera.
- [ ] **5. CMD+K palette** (§3) — central access: finishes, snaps, axis toggle, presets, export.
- [ ] **6. Interactive playback** (§6) — wheel/menu → OS reducer + real web-API events; 2D edits in /3d.
- [ ] **7. UI choreography engine** (§7, D9) — one `lib/studio-timeline.ts` for camera + UI;
  round-trippable human/machine-readable export.

> Note: the current ask orders static-MP4 first; the stale handoff below ordered camera-viz first.
> Honoring the current ask. Both are valid — §1 and §2 are independent.

## Decisions needed
1. Marquee canonical design (fix test ↔ fix impl ↔ defer).
2. Verification depth for build sessions (drive live WebGL ↔ build-green acceptable).

## Review section

### 2026-06-09 — export side-effects pass (this session)
Scope: "build what you can, defer iffy, build-green" + the hard requirement that the
marquee + song always progress under any export, + "treat all the side effects."

- **Song always progresses in clip exports** — `ipod-3d-stage.tsx` now force-advances the
  now-playing clock during a clip export (`isPlaying || exportingClip`), so a paused transport
  no longer freezes progress/time in the MP4. Marquee already scrolls via its always-on rAF.
- **Export can't wedge the UI** — `nextPaint` races its double-rAF against a 200ms timeout so a
  backgrounded tab can't hang the export and stick the loading veil.
- **noticeTimer unmount cleanup** — pending notice timer cleared on unmount (no post-unmount setState).
- **Hydration fix committed** — the uncommitted SSR client-only wrapper (loose end #1) is now landed.
- Verification: `pnpm type-check` clean · `pnpm lint` 0 errors (43 pre-existing warnings) ·
  `pnpm build` exit 0 (/3d route builds as the thin client wrapper). Per the agreed depth, build-green only.

Deferred (iffy, per your call): marquee ping-pong-vs-linear canonical decision (`marquee.test.ts`
still red); export-screen-animation Phase 2 compositor; the 7 backbone subsystems below.

---
_(future implementation sessions append here)_

---

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
