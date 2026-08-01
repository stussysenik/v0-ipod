# Change: A move is drawn, not dialled

## What you get, in gestures

Everything below is a thing you do with a pointer or a key on `/3d`, in the motion inspector
that already exists. Nothing here is a new panel, a new mode, or a new place.

| You do this | You get this |
|---|---|
| Click a track row's name | The row opens into a **lane** — the same trace picture the picker already draws, at editing size, with a dot on every keyframe |
| Drag a dot | That keyframe moves in time and value. The readout under your cursor says `Azimuth 24.0° at 0.35` while you drag |
| Double-click empty lane | A keyframe appears there. **The motion does not change** — the segment splits, it does not re-shape |
| Select a dot, press Delete | It goes. The two neighbours join with the curve that spanned them |
| Click the line *between* two dots | The curve pad opens **for that segment only**. Ease the way in, snap the way out |
| Drag the Amount past zero | The move runs backwards. `−1×` is the same shape mirrored, which is how a turntable spins the other way |
| Set Turns on a rotational track | `−2 … +2` whole revolutions. `2` spins twice per cycle; `−1` spins once, the other way |
| Orbit the rig with the mouse, press **Capture** | Where you are lands as a keyframe on all six tracks at the playhead. Fly, capture, scrub, fly, capture — that is a custom path |
| Read the Reach lane | Distance in world units **and** the absolute distance from the device, not only the offset |
| Look at the Path lane | The camera's route through space for the whole cycle, drawn from the tracks. Read-only, because it *is* the tracks |
| Press arrows on a selected dot | Nudge it. Shift for ten. Escape mid-drag puts it back |

## Why

`add-motion-authoring-system` made motion a document and gave it an inspector. What that
inspector can do to a track is exactly three scalars — `TrackEdit = { gain, phase, curve }`
(`lib/motion/track-edit.ts:144`) — applied over a base whose keyframes it cannot touch.

So the shape of every move is still whatever `lib/motion/catalogue.ts` baked, and five things
are unreachable from the surface:

1. **Keyframe count and position.** Orbit's azimuth is a two-keyframe sine
   (`sineTrack(17)`). There is no gesture that makes it three, or that moves the peak off
   `0.25`. Every move in the product is therefore a scaled, phase-shifted, re-curved copy of
   five baked shapes.

2. **Per-segment curve.** The pad edits the track — `applyTrackEdit` writes the same `Ease`
   onto every keyframe (`track-edit.ts:200`). A move that eases in and snaps out cannot be
   expressed, which is most of what "not robotic" means.

3. **Direction.** `MAX_TRACK_GAIN = 2` and the slider floor is `0`, so gain is a magnitude.
   Turntable spins one way. Reversing it means editing `linearTurnTrack(360)` in TypeScript.

4. **Turn count.** `360` is a literal in the catalogue. Two turns in one cycle is not a value
   the surface holds — the only nearby knob is `repeat`, which repeats the whole clip
   including the other five tracks.

5. **Any pose the three baked shapes do not pass through.** The rig can be orbited freely
   (`camera-control-truth`) and there is no gesture that says "the move should go *there*".
   The live camera is an output of motion and never an input to it.

Distance is the same defect wearing a different hat: `reach` has been a first-class track since
the port, and the only thing the surface can do to it is scale a baked raised-cosine.

**A "custom path" is not a sixth missing feature — it is (1) plus (5) plus a picture.**
`azimuth` / `elevation` / `reach` around `targetX/Y/Z` is a complete coordinate system for a
camera; any route through space is already expressible in the tracks the document has. What is
missing is the ability to *put keyframes where you want them* and a view that shows the route.
Storing a spline beside the tracks would be a second copy of the same path, and the two would
disagree within a week. See `design.md` D2.

## What changes

**On the surface**

- **The trace becomes the editor.** `components/ipod/scenes/ipod-3d-motion-trace.tsx` already
  draws a track as a normalised polyline in a unit viewBox and already serves a 32px card and a
  16px shelf row. At lane size it gains keyframe dots, a value axis, and a drag surface. One
  picture, three sizes, read at two of them and written at one — a second graph component would
  be a second truth about the same polyline.
- **Segment-scoped curve.** Clicking a segment opens the existing pad for that segment. The
  track row keeps reading `Mixed` when segments differ; `unifiedEase` (`track-edit.ts:178`)
  already computes exactly that and currently only ever reports it as a curiosity.
- **Amount goes signed** (`−2 … +2`), and rotational tracks additionally carry **Turns**
  (`−2 … +2` whole revolutions) because "one and a half turns" is not a thing anyone wants and
  a whole-turn control is the one that keeps the seam closed.
- **Capture** — one command in the inspector's title row. Reads the live rig's pose, subtracts
  the hero pose, writes six keyframes at the playhead. This is the only gesture in the product
  where the camera is an input.
- **The Path lane** — a derived, read-only plan view of the camera's route across the cycle,
  with the playhead's position marked and captured positions ghosted.
- **Reach reads absolute.** `+0.40 (2.85 units)`. The delta is what the document stores; the
  distance is what a person reads.
- **Step** — the `hold` boolean the format has always carried (`doc.ts:MotionKeyframe.hold`),
  exposed per keyframe. A stepped track is the robotic feel, on purpose, in one click.

**Underneath**

- **No format change.** `MotionKeyframe` is already `{ at, value, easing?, hold? }` and
  `at` is already a free `number`. Insert, move and delete are array edits on a shape that was
  designed for them.
- **A re-shaped track stores whole.** `TrackEdit`'s three scalars cannot express a track with a
  different number of keyframes, so a track edited in shape is stored as a **definition**
  (the whole `MotionTrack`) rather than a reference-plus-scalars. Untouched tracks stay
  references. This is the shelf's whole-document ruling applied one level down (D3).
- **Legacy scalar overrides convert by value.** Every stored `{ gain, phase, curve }` bakes
  through `applyTrackEdit` into a whole track, and the migration test asserts the **converted
  value**, not that it did not throw — the failure mode this repo has already shipped once.
- **Insertion is exact.** Splitting a segment subdivides its cubic bezier by de Casteljau and
  renormalises each half to its own box, so the sampled curve before and after an insert agrees
  to floating point. Gated by measurement, not assertion (D7).
- **Export identity is already correct.** `docHash` canonicalises the whole document including
  keyframes, so a re-shaped move fingerprints as a different move with no change to
  `lib/export/export-fingerprint.ts`.

## Impact

- Affected specs: `motion-authoring` (ADDED — shape editing, exact insertion, seam closure,
  signed direction and authored turns, whole-track override with a value-asserting migration,
  pose capture, the derived path view, distance readout, keyboard parity).
- Affected code: `lib/motion/track-edit.ts` (the override shape and its migration),
  `lib/motion/trace.ts` (extent and hit-testing for the lane), `lib/motion/doc.ts` (unchanged
  format; new pure keyframe operations may live beside it), `lib/motion/motion-state.ts`
  (new actions), `components/ipod/scenes/ipod-3d-motion-trace.tsx` (lane mode),
  `components/ipod/scenes/ipod-3d-motion-inspector.tsx` (lanes, Capture, Turns, Path),
  plus whichever component owns the live rig pose that Capture reads.
- Depends on: `add-motion-authoring-system` reaching 100%. Its four open items are all owner
  gates (§6.8, §6c.6, §2.9, §3b.1); this change touches the same files and must not start
  while they are open.
- Feeds: `add-community-state-gallery` (a shared look now carries a move nobody else has),
  `add-customizer-decision-log` (a captured keyframe is the most legible decision in the
  product), `add-binocular-dimension-machines` (a path authored once is flown by every barrel).
- Not breaking for users: stored motion overrides convert on read, and a document that was
  never shape-edited round-trips unchanged.
- Explicitly **out of scope**: dragging on the Path lane (D2), an edit history beyond
  cancel-in-drag (a finding, not a fold-in), lighting tracks (the format already admits them;
  nothing here needs them).
