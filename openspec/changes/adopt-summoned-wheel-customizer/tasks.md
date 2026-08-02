# Tasks — the summoned wheel

Owner gates are marked **USER**. Nothing that moves a pixel self-certifies.

## 1. The gesture layer

- [x] 1.1 `lib/hud/pointer-intent.ts` — one reducer over pointer samples returning
      `idle | orbiting | summoning | throwing`. Movement beyond the orbit threshold before the
      hold threshold locks `orbiting` for the rest of the press (Buxton three-state; see
      `design.md` D1). Pure, no DOM, node-testable.
- [x] 1.2 Test: a press that travels 9px at 40ms never reaches `summoning`, at any hold duration.
- [x] 1.3 Test: a press held 400ms within 8px reaches `summoning` on both a mouse and a
      synthesized touch sample stream.
- [x] 1.4 `lib/hud/arcball.ts` — virtual-sphere mapping from pointer delta to azimuth/elevation.
      Pure function of (start, current, viewport, radius).
- [x] 1.5 Test: a diagonal drag produces one rotation about one axis, not a composed pair; asserted
      by value at 16 drag angles.

## 2. The throw

- [x] 2.1 `lib/hud/throw-to-edit.ts` — release samples → `TrackEdit {gain, phase, curve}`. Reads
      `lib/motion/track-edit.ts`; writes nothing new. No wall clock, no random.
- [x] 2.2 Test: identical sample sequence replayed twice yields byte-identical tracks.
- [x] 2.3 Test: the authoring threshold — a release below it writes no track and holds the pose.
- [x] 2.4 Test: `readTrackEdit(base, applyTrackEdit(base, fromThrow(samples)))` round-trips at 64 phases.
- [x] 2.5 Confirm by test that no format field, no `FINGERPRINT_VERSION` and no `docHash` input
      changes. A green test here is what lets this change ship without a migration.

## 3. The wheel

- [x] 3.1 `components/ipod/hud/summon-wheel.tsx` — DOM, positioned by projecting a 3D anchor to
      screen space per frame, clamped to the viewport, shadow direction from the key light.
- [x] 3.2 Wedge labels are nouns or values. Top level: Case, Wheel, Screen, Light, Motion, Views.
- [ ] 3.3 Flick-without-hold fires the same command as hold-then-release, from the same handler.
      The resolver landed — `wheelCommandFor` is called by the wheel's release and takes a
      velocity as readily as an offset, asserted equal at 120 angles. What is not routed is
      which presses reach it: a fast release on the object is a THROW today (D2), so the two
      gestures collide until §5.2 gives the wheel its own summon surface.
- [x] 3.4 Keyboard and screen-reader path: the wheel is a listbox; the command palette remains the
      full alternative.
- [x] 3.5 Test: a summon within one radius of each of the four edges clamps with zero clipped wedges.
- [ ] 3.6 **USER** — visual review of the wheel: proportion, type sizes, bloom and settle timing.

## 4. The ghost arc

- [x] 4.1 One dynamic line in the existing scene: great-circle arc from the release point, cycle
      marked, fade ~600ms. No new render pass.
- [x] 4.2 Test: the arc's sampled points equal `poseAtProgress` for the authored track at 32 phases —
      the arc is the move, not a decoration that resembles it.
- [ ] 4.3 **USER** — visual review of the arc: weight, opacity ramp, fade curve.

## 4b. The arc takes a hand — custom paths without a curve pad

- [x] 4b.1 `lib/theatre/bezier-split.ts` — exact de Casteljau split of a keyframe segment's ease,
      with x→t by bisection because the split runs once per placement, not per frame.
- [x] 4b.2 Test: every easing in the vocabulary reproduces from its two halves, at 5 cut positions
      × 65 samples. Reading: under 1e-5 in value fraction for all 22 splittable curves.
- [x] 4b.3 Test: the one curve that cannot be cut. `easeInOutExpo` leaves the storable x domain at
      52/99 positions by up to 0.089; clamping would have shipped a 3.5e-2 reshape. Asserted at the
      QUARTER as well as the midpoint — a symmetric curve cuts fine at its centre, so a gate that
      only asked at 0.5 would have called it splittable. No shipped document authors it.
- [x] 4b.4 `lib/hud/motion-path.ts` — knots, wrap-aware falloff, `applyPath` as an edit over the
      base. Pure, no DOM, no wall clock, no random.
- [x] 4b.5 Test: reading a move as one arc round-trips. Four catalogue moves are bit-identical;
      `crane` costs 3.60e-5° because its axes are keyframed apart. Both are the shipped sampler's
      1e-6 x→t epsilon, not the split's 2^-40.
- [x] 4b.6 Test: placement moves no pixel — 2.60e-5° of azimuth against a 17° amplitude, over 128
      phases at 15 insertion positions, including three knots inside one segment.
- [x] 4b.7 Test: the deform is local outside the falloff, carries the closing knot with the opening
      one so the loop still closes, and returns bit-identical values when a drag goes out and back.
- [x] 4b.8 Test: a deformed arc writes `keyframes` and `phase` only — no format field, no
      `FINGERPRINT_VERSION`, no migration. Same claim as 2.5, re-asserted for the harder gesture.
- [x] 4b.9 Beads on the held arc: instanced points at knot positions on the line §4 already draws.
      No new pass, no new material.
- [x] 4b.10 Grab, place and remove wired through `pointer-intent.ts` — a bead grab is an orbit that
      started on a bead, so the same reducer decides it and no fourth phase is introduced.
- [x] 4b.11 Test: a tap on a segment the format cannot cut places no bead and leaves the move
      byte-identical, rather than placing one and bending.
- [ ] 4b.12 **USER** — visual review of the held arc: bead size, falloff read, how a pull looks.

**Batch readings — §3, §4.1–4.2, §4b.9–4b.11.** Seven files, 1408 lines:
`lib/hud/ghost-arc.ts` (237), `lib/hud/summon-wheel.ts` (154), their tests (250 + 128, 28 new
assertions), `components/ipod/hud/ghost-arc.tsx` (348),
`components/ipod/hud/summon-wheel.tsx` (185), `components/ipod/hooks/use-summon-intent.ts`
(106). One prop on the canvas (`sceneOverlay`) and one named group. Suite 1239/1240 — the one red is the
pre-existing `motion-tokens` literal gate on files this batch never opened.

Three rulings worth not re-deriving:

- **`easeInOutExpo` refuses the quarter and takes the midpoint.** It is splittable at 0.5,
  0.05 and 0.95 and refuses from 0.25 to 0.45 and from 0.55 to 0.75 — measured at twentieths.
  The dead spot is an interval around each shoulder, not the whole segment, which is the
  second time the midpoint has been the one position that would have reported the curve clean.
- **Projection is per gesture, not per frame.** Hit-testing the arc in screen space costs
  `ARC_SAMPLES` matrix multiplies; running it on every frame would spend them against a frame
  budget §7.2 has not read. It runs on pointer-down and on the moves of a live pull.
- **In-scene chrome is hidden by name, at four capture brackets.** `HUD_OVERLAY_NAME` is
  looked up and hidden wherever `capturingRef` flips, because a designer aid that survives one
  of the four export paths is a defect that only appears in the artifact.

## 5. Removing what it replaces

- [ ] 5.1 Delete the motion inspector's curve pad, keyframe lane, trace cards, repeat/length/style/
      turnaround rows and proof strip from the surface. The engine under them is untouched.
- [ ] 5.2 Move shelf (Save / Rename / Save over / Delete) and transport into the wheel's Motion branch.
- [x] 5.3 **AMENDED — a roster, not a flag.** The task said retire two named cockpits behind a
      `lib/feature-flags.ts` flag. A build-time flag answers "hide this one" and cannot answer
      "what is there", so it buys a clean stage by making the tools unreachable, which
      `pick-up-and-play` forbids. Replaced by a per-panel visibility value every panel reads:
      `lib/ipod-state/cockpit-roster.ts` declares the nine cockpits (id, index, label, side) and
      the total `CockpitVisibility` map; `PRODUCT_VIEW` and `ALL_COCKPITS_VISIBLE` are two values
      of that map, not two modes. Flagged-off is now a value the surface can write and undo.
- [x] 5.3a The roster is the ONE home of a panel's number and name. `Ipod3DCockpitHeader` takes
      `id` and reads `index`/`label` from the roster; the stage's nine `index={n}` props and the
      cockpits' nine `title="…"` literals and nine `index: number` props are deleted. Before: a
      panel's position lived in the stage and its name in the panel, so the SET of panels had no
      home at all — which is why nothing could offer them as a list.
- [x] 5.3b `components/ipod/scenes/ipod-3d-panels-roster.tsx` — the list, on the camera bar
      (the one always-present chrome). Nine 24px rows: checkbox, `NN`, label. Two commands,
      `Product` and `All`, writing the two extreme values. The trigger reads its own count.
- [x] 5.3c Visibility persists in the studio slice, so it survives reload and rides the share
      payload. Three boundaries heal through `sanitizeCockpitVisibility`: `loadStudioState`,
      `decodePortableState`, and the reducer's `SET_COCKPITS`. A record written before the roster
      existed has no `cockpits` key and every id heals to VISIBLE — asserted on the value, not on
      "does not throw", per the `repeatFromSpeed` lesson.
- [x] 5.3d Tests: `lib/ipod-state/cockpit-roster.test.ts`, 13 assertions. Numbering 01→09 once
      each, column split matches the stage's layout, toggling all nine reaches exactly
      `PRODUCT_VIEW`, a partial stored map heals to total, unknown keys are dropped, JSON
      round-trip is identity, and the id union is covered (a tenth cockpit that skips the roster
      fails here).
- [ ] 5.3e **USER** — visual review of the roster: row density, the checkbox, where the trigger
      sits on the bar, and the stage with every panel off.
- [ ] 5.4 Carve the spatial canvas out of the panel-inset path so its framing is pure
      (`camera-control-truth`). Verify the device occupies identical pixels with chrome up and down.
- [ ] 5.5 Report the size: lines deleted, files touched, concepts removed. A net addition here means
      the change did not converge.

## 6. First contact

- [ ] 6.1 One-time wheel ghost on first pointer movement, keyed off a `seen` flag registered in
      `add-workspace-storage-registry`. Drawn once, ever.
- [ ] 6.2 Test: the flag is written once and the ghost never re-renders after it is set.
- [ ] 6.3 **USER** — visual review of first contact.

## 7. Gates and records

- [ ] 7.1 `pnpm validate` green; record readings in `tasks/state.json.gates`.
- [ ] 7.2 Frame reading on the target machine (Intel UHD 620, 1080p) with the wheel summoned during
      an authored move. A HUD that only holds frame rate on the author's machine is a defect.
- [ ] 7.3 Retire `add-motion-shape-authoring` — record the retirement and the reasoning pointer
      (`design.md` D2 and D6) in `tasks/state.json`, then remove the change directory. Its D1 is
      absorbed rather than dismissed: the trace became the editor, in space.
- [ ] 7.4 Reshape `add-motion-authoring-system` §6/§6b/§6c to engine-only and release its three
      pending owner gates.
- [ ] 7.5 Record the WebGPU ruling and the condition that reopens it (`design.md` D7) in
      `tasks/state.json.carry`, so the next session does not re-litigate a closed fork.
- [ ] 7.6 **USER** — final visual review of the idle stage: object, six-view bar, mode pill, nothing else.
