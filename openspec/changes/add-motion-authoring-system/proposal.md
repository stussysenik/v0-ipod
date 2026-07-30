# Change: Motion becomes an authored document, not a picked preset

## Why

`/3d` can fly eight camera moves and it can fly none of them *slightly differently*. The
motion feels robotic because every expressive parameter is a literal in a source file, and
the four dials the surface exposes — which move, `speed`, `loop`/`boomerang`/`hold`,
`durationSec` — cannot reach any of them.

Four causes, each verified in code:

1. **The catalogue is closed.** The five procedural moves are sin/cos generators with baked
   constants: `17 * Math.sin(phase)` (`lib/studio-camera.ts:185`), `360 * t` (`:223`),
   `24 * arc + 6 * Math.sin(2*phase)` (`:265`). Amplitude, axis, phase and curve are
   unreachable from the surface. Changing the feel of Orbit means editing TypeScript.

2. **The bezier pipe is fully built and capped at the last inch.** `easingHandles()` already
   accepts a raw `[c1x,c1y,c2x,c2y]` tuple (`lib/theatre/easings.ts:56`), and `KeyframeSpec.easing`
   is already typed `EasingName | CubicBezierHandles` (`lib/theatre/build-state.ts:31`). But
   `PresetKeyframe.easing` — the one field a moment card actually authors — narrows back to
   `EasingName` (`lib/theatre/motion-presets.ts:41`). A custom curve is one type away from
   working end to end, and the solver that consumes it (`lib/theatre/unit-bezier.ts`) is
   already pinned to `@theatre/core` by a parity test.

3. **Spin count is derived, so it is not controllable.**
   `clipCyclesForDuration = max(1, round(durationSec × speed / naturalCycleSeconds))`
   (`lib/studio-clip.ts:88`). There is no way to say "spin three times in six seconds"; the
   user nudges `speed` until the readout reads `3×`. Worse, `round()` creates dead zones — at
   `durationSec: 5` on Turntable (6s cycle), `speed` 0.5 / 0.75 / 1 all collapse to `1×`. The
   control moves and nothing happens. That is precisely "a little not right and I have no
   control to adjust."

4. **Motion has no per-axis independence.** A moment card's keyframes carry all six offsets on
   one shared time grid with one easing per keyframe (`motion-presets.ts:83-88`). Organic
   motion is axes running at *different* rates with *different* curves — elevation breathing
   slower than azimuth, reach lagging both. The underlying `SheetSpec` format already supports
   one independent track per prop; `buildPresetState` collapses them onto a single grid.

There is a second, structural half to this, which is why the change is scoped as a system
rather than as a curve editor:

5. **Motion state has no home.** `previewMove`, `previewPlaying`, `previewT`, `speed`,
   `loopStyle`, `durationSec`, `aspect` and `quality` are local `useState` in
   `components/ipod/scenes/ipod-3d-stage.tsx:164-175`. They are therefore absent from
   `IpodWorkbenchModel`, absent from `portable-state.ts` (a share link transmits the look with
   no motion), absent from persistence (a reload loses the move), and invisible to
   `add-customizer-decision-log`'s fold. Lighting lives in `model.studio.lighting`; motion is
   the one studio dimension with nowhere to live. This is why the parts do not feel linked —
   structurally, they are not.

6. **The export preview shows one frame, and it is frame 0 by design.** `proofFingerprint`
   deliberately excludes `move`/`loop`/`speed`/`durationSec` (`lib/export/export-fingerprint.ts:16-19`)
   because every move starts at the hero pose, so motion cannot change the anchor frame. That
   reasoning is correct and stays. Its consequence is that nothing in the product renders what
   the *motion* will export — the scrubber flies the live canvas, which is a preview of the
   scene, not a preview of the file.

The foundation to build on is already good and is not being replaced: `StudioClip`
(`lib/studio-clip.ts`) already presents procedural moves and keyframed cards behind one
interface, and the live preview (`components/three/three-d-ipod.tsx:1912`) and the offline
render loop (`:2330`) already call the *same* sampler with the *same* `phaseForProgress`. The
camera's WYSIWYG parity holds today. This change keeps that contract and widens what can be
put through it.

## What Changes

- **Add `MotionDoc` — one authored motion object** (`lib/motion/`): per-axis keyframe tracks
  (azimuth, elevation, reach, targetX/Y/Z), each track carrying its own keyframes, its own
  per-segment easing, and its own phase offset. Every easing is `EasingName | CubicBezierHandles`,
  so a named curve and a hand-dragged one are the same kind of value. This is the vocabulary
  "robotic" and "organic" are expressed *in*, rather than chosen *between*.
- **Open the easing type.** `PresetKeyframe.easing: EasingName` → `Ease = EasingName | CubicBezierHandles`.
  The rest of the path (`buildTheatreState` → `easingHandles` → `UnitBezier`) already accepts it.
  Overshoot already works and is proven by `easeInOutBack: [0.68, -0.6, 0.32, 1.6]`.
- **Make repeat authored, not derived.** The user owns `repeat` (whole cycles across the clip)
  and `durationSec`; cycle length becomes the readout. `speed` is retired as a worse spelling
  of the same fact, and `clipCyclesForDuration`'s `round()` dead zone goes with it.
- **Fold `hold` into the model instead of branching around it.** `hold` is `repeat: 0`, which
  removes three special cases (`three-d-ipod.tsx:1906`, `:2328`, `ipod-3d-export-dock.tsx:163`).
  `loop` and `boomerang` become time maps, and boomerang's turnaround becomes an authorable
  bezier instead of the hardcoded smootherstep in `pingPong` (`lib/studio-camera.ts:96`).
- **Port the five procedural moves to `MotionDoc`s and retire the second engine.** Every
  shipped move becomes an editable document — open Orbit, drag its azimuth curve, save it as
  yours. **The port is gated on a measured parity ruling, not on assertion** (design D3): a
  cubic bezier cannot reproduce a sine exactly, so the maximum per-axis deviation across the
  cycle is measured in degrees and units and recorded before `poseForMove` is deleted. If a
  move cannot meet the floor, it keeps its generator and says so.
- **Give motion a home in the model.** `IpodStudioState.motion` — the doc (or its catalogue
  id plus sparse overrides), `repeat`, `durationSec`, time map, and playhead. Motion then
  persists, travels in `?s=` links, enters the decision log, and appears in the export
  snapshot for free, because those are all projections of the model.
- **Give a tuned motion a shelf, so it becomes yours.** Save the authored document under a name,
  rename it, save over it, delete it; saved documents sit in the picker beside the catalogue with
  no second code path. The shelf entry stores the document **whole** — this is the one place the
  identity-plus-overrides ruling deliberately does not apply, because a shelf entry *is* a
  definition rather than a reference to one. Mirrors `lib/studio-themes.ts` rather than inventing
  a second registry shape. No default-motion pointer: the model already persists the selected
  document, so the boot needs no second one.
- **Add a timeline proof.** Extend the proof cache from one anchor frame to N frames sampled
  at authored positions across the clip, keyed by a new `timelineFingerprint` that *does*
  include motion. The anchor `proofFingerprint` is unchanged and still excludes motion — the
  two answer different questions. The scrubber then shows rendered export frames, which is the
  "place to directly see how the export will be."
- **Ship one authoring surface: the motion inspector** — track list, curve editor with
  draggable bezier handles, live numeric readout, repeat/duration/time-map, and the timeline
  proof strip under the playhead. Built as a single self-contained panel so
  `refactor-3d-control-surface-to-inspector` adopts it as the Camera part's inspector rather
  than reinventing it. **This moves pixels and gates on the owner's visual review.**

## Impact

- Affected specs:
  - `motion-authoring` (ADDED — the doc format, the engine contract, authoring, parity).
  - `3d-export-proof-cache` (MODIFIED — the fingerprint's motion inputs are now a motion doc
    identity rather than `move`/`loop`/`speed`; ADDED — the timeline proof).
  - `portable-customizer-state` (ADDED — motion travels in the payload).
  - `state-model` (ADDED — motion is a slice of the canonical model, not component state).
- Affected code: `lib/motion/**` (new, incl. `motion-shelf.ts`), `lib/theatre/motion-presets.ts`,
  `lib/theatre/easings.ts`,
  `lib/studio-clip.ts`, `lib/studio-clip-presets.ts`, `lib/studio-camera.ts` (procedural
  generators retired on the parity ruling), `lib/ipod-state/model.ts`, `lib/ipod-state/update.ts`,
  `lib/ipod-state/portable-state.ts`, `lib/export/export-fingerprint.ts`,
  `lib/export/proof-inputs.ts`, `lib/export/proof-cache.ts`, `lib/export/proof-scheduler.ts`,
  `components/ipod/scenes/ipod-3d-stage.tsx`, `components/ipod/scenes/ipod-3d-export-dock.tsx`,
  `components/three/three-d-ipod.tsx`, plus one new motion inspector component.
- Depends on: nothing hard. It reads better *after* `add-customizer-decision-log` lands (motion
  edits then become log entries automatically), but does not require it.
- Feeds: `refactor-3d-control-surface-to-inspector` (adopts the motion inspector as the Camera
  part), `add-community-state-gallery` (a shared look now carries its motion).
- **BREAKING** at the persistence boundary: `speed` is retired and `FINGERPRINT_VERSION` is
  bumped, so stored export records and cached proof frames from before this change no longer
  match. Handled by the existing heal-on-decode path plus a one-way `speed → repeat` migration
  (design D2); no user-visible data loss.
- Explicitly **out of scope**, recorded as findings rather than folded in: the duplicate model
  fold (`ipodCentralMachine` vs `ipodWorkbenchReducer`) and the duplicate export lifecycle
  (central-machine `exportStatus` vs `exportMachine`). See `design.md` §Findings.
