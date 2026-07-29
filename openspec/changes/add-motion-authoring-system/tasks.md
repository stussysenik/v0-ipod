# Tasks — add-motion-authoring-system

Read `design.md` D1–D3 and D7 before starting. Two things are load-bearing and already correct
— do not rewrite them: `createClipPoseSampler`'s `(clip, hero) => (phase) => StudioPose`
interface (`lib/studio-clip.ts:55`), which is what keeps preview and export in parity, and
`UnitBezier` (`lib/theatre/unit-bezier.ts`), which is pinned to `@theatre/core` by
`lib/theatre/theatre-parity.test.ts`.

Sections 1–4 ship no pixels and can land alone. Section 6 moves pixels and **gates on the
owner's visual review** — state the deltas and stop.

## 1. The document format

- [ ] 1.1 Widen the easing type at its single narrowing point:
      `PresetKeyframe.easing: EasingName` → `Ease = EasingName | CubicBezierHandles`
      (`lib/theatre/motion-presets.ts:41`). Nothing downstream changes —
      `build-state.ts:69` already calls `easingHandles`, which already passes tuples through.
- [ ] 1.2 Clamp control-point X to `[0,1]` at the format boundary, never Y. Test both: a
      tuple with `y = 1.56` overshoots; a tuple with `x = 1.4` is clamped and the curve stays
      monotonic in time. `easeInOutBack` is the existing proof that Y overshoot works.
- [ ] 1.3 `lib/motion/doc.ts` — `MotionDoc`, `MotionTrack`, `TimeMap`, `Ease`. Track map keyed
      by `string`, not a camera-prop union (D9: lighting keyframes must not need a format
      change). Per-track `phase` offset.
- [ ] 1.4 `sampleMotionDoc(doc, phase)` — per-track sampling with per-track phase offset,
      built on the existing `sampleTrack`. Prove the phase offset is track-local: shifting one
      track's phase leaves every other track's samples bit-identical.
- [ ] 1.5 Canonical hash of a `MotionDoc` via the existing `stableStringify` + `hashString`
      (`lib/export/export-fingerprint.ts:102,117`). Do not add a second hash implementation.

## 2. The catalogue port — measurement before deletion

Per repo law, a measured value is never nudged to make a check pass. Record readings here as
they are taken; they are then never re-derived.

- [ ] 2.1 Harness: for a move, sample ≥1000 uniform phases and report max per-axis deviation
      between the ported doc and the generator, in degrees (azimuth, elevation) and world
      units (reach, target).
- [ ] 2.2 `turntable` first — the control case. `360 * t` is exactly two keyframes with a
      `linear` ease, so the expected reading is **0**. A nonzero reading means the harness is
      wrong, not the port.
      - Reading: `___`
- [ ] 2.3 Port `orbit` (`studio-camera.ts:182`). Quarter keyframes + `easeInOutSine`.
      - Reading: azimuth `___°` · elevation `___°` · reach `___`
- [ ] 2.4 Port `sweep` (`:241`). — Reading: `___`
- [ ] 2.5 Port `robo` (`:199`). — Reading: `___`
- [ ] 2.6 Port `crane` (`:260`). Hardest case: the second-harmonic `6 * sin(2φ)` elevation term
      needs eighth keyframes, not quarters. — Reading: `___`
- [ ] 2.7 Rule each move against the floor — **0.25°** angles, **0.01** units distance (below
      the fingerprint's own `ANGLE_PRECISION` 0.1° / `DISTANCE_PRECISION` 1e-3 by a margin, so
      a conforming port cannot change a cache key). Over the floor: add keyframes, re-measure,
      or keep the generator and record the ruling with its reading.
- [ ] 2.8 Parity test that fails on any move over its recorded floor, naming move and axis.
- [ ] 2.9 Only once every move has a ruling: delete `poseForMove`, `MOVE_CYCLE_SECONDS`,
      `cyclesForDuration` (`studio-camera.ts:151` — the duplicate of `clipCyclesForDuration`,
      finding F1) and the `ProceduralClip` branch of `createClipPoseSampler`.
- [ ] 2.10 Port the eight moment cards in `MOTION_PRESETS` to `MotionDoc`s. Pure re-expression
      — the sampled values must be identical, so this one is exact-equality, not a floor.

## 3. Authored repeat, and the death of three branches

- [ ] 3.1 `repeat: number` and `durationSec` are the authored inputs; `cycleSeconds` is derived
      and displayed. Delete `speed` and `clipCyclesForDuration`.
- [ ] 3.2 Migration in the existing `healSlice` path (`portable-state.ts:69`):
      `speed → repeat = max(1, round(durationSec × speed / cycleSeconds))` — the count that was
      actually being flown. One-way; `speed` is then dropped.
- [ ] 3.3 `repeat: 0` holds the hero through the ordinary sampling path. Delete all three
      `hold` branches: `three-d-ipod.tsx:1906`, `:2328`, `ipod-3d-export-dock.tsx:163`.
      Narrow `LoopStyle` to `loop | boomerang`.
- [ ] 3.4 Move boomerang's turnaround into the document as `timeMap.turnaround: Ease`. Measure
      the bezier that matches today's smootherstep (`studio-camera.ts:69`, applied at `:96`)
      and record it, so the default is a no-op against shipped feel.
      - Reading: max deviation `___` at handles `___`
- [ ] 3.5 Fractional `repeat` renders and the readout says `open`; integer says `seamless`.
      Do not refuse the value — `dolly-out-reveal` is already a legitimate one-shot.

## 4. Motion gets a home

- [ ] 4.1 `IpodStudioState.motion: MotionState` — `{ docId, overrides?, repeat, durationSec,
      timeMap, playhead }` (`lib/ipod-state/model.ts:170`). Extend `DEFAULT_STUDIO_STATE` and
      `createInitialStudioState`.
- [ ] 4.2 Delete the six stage-local `useState`s at `ipod-3d-stage.tsx:164-175`
      (`durationSec`, `previewMove`, `previewPlaying`, `previewT`, `speed`, `loopStyle`) and
      read the model slice instead. Leave `aspect`/`quality` alone — they are export options,
      not motion, and moving them is a different change.
- [ ] 4.3 Reducer actions for motion edits, folded through `normalizeModel` like every other
      slice. Keep them fine-grained (one per authored field) so
      `add-customizer-decision-log`'s coalescing has something to coalesce.
- [ ] 4.4 Exclude `playhead` at the codec boundary exactly as `isNowPlayingEditable` already is
      (`portable-state.ts:147`) — excluded on encode, not omitted from the model.
- [ ] 4.5 Round-trip test: author a custom curve, encode, decode, sample — identical poses.
- [ ] 4.6 Decode test for a pre-motion v1 payload: decodes, `speed` converts, motion heals to
      the default document, never throws.

## 5. The timeline proof

- [ ] 5.1 `timelineFingerprint(inputs, motionIdentity, positions)` in
      `lib/export/export-fingerprint.ts`. Leave `proofFingerprint` untouched — its
      motion exclusion is correct and its reasoning is already on the record at `:16-19`.
- [ ] 5.2 Swap `exportFingerprint`'s `move`/`loop`/`speed`/`durationSec` for the motion
      identity. Bump `FINGERPRINT_VERSION`.
- [ ] 5.3 Extend `selectExportSnapshot` (`proof-inputs.ts:91`) — it is the spec's single source
      of the snapshot, so the motion identity enters there and nowhere else.
- [ ] 5.4 Timeline proof entries: N frames keyed by one timeline key. Default positions
      `[0, .25, .5, .75, .999]`, authored in the doc, folded into the key.
- [ ] 5.5 Reuse the existing scheduler's idle/ambient contract
      (`proof-scheduler.ts`) — do not add a second queue.
- [ ] 5.6 Test that a proof frame at position `p` is pixel-identical to the export's frame at
      `p`. This is the WYSIWYG claim; it must be a test, not a comment.
- [ ] 5.7 Test that switching documents without moving the pose reuses the anchor proof
      unchanged and recomputes only the timeline proof.

## 6. The motion inspector — gates on owner review

- [ ] 6.1 One self-contained panel body owning no layout. Props explicit; no rail assumptions.
      Built on `components/ui/studio-controls.tsx` primitives with radii from `CONTROL_RADIUS`
      from the first commit, so it adds nothing to `adopt-studio-control-language`'s 30/17/40.
- [ ] 6.2 Track rows: name **and** value (`Azimuth ±17°`, not `Azimuth`). 24px rows, 11px
      chrome type, 1px hairlines.
- [ ] 6.3 Curve editor: two draggable handles, tuple readout updating during the drag, named
      curve shown when the tuple matches exactly, `Custom` otherwise.
- [ ] 6.4 Repeat / duration / time map / turnaround, each showing its derived readout
      (`3× · 2.0s · seamless`).
- [ ] 6.5 Timeline proof strip beneath the playhead scrubber, aligned to it.
- [ ] 6.6 Mount in the export dock's Preview section (`ipod-3d-export-dock.tsx:224`) — the only
      place this change moves. `refactor-3d-control-surface-to-inspector` later re-parents it
      under the Camera part and deletes the mount, not the component.
- [ ] 6.7 **USER: visual review.** State what moved and stop. Nothing here hardens first.

## 7. Gates

- [ ] 7.1 `pnpm validate` green.
- [ ] 7.2 Theatre parity test still green — the sampler contract is unchanged.
- [ ] 7.3 Live-vs-export pose parity test still green across the ported catalogue.
- [ ] 7.4 `openspec validate add-motion-authoring-system --strict --no-interactive`.
- [ ] 7.5 Update `tasks/state.json` in the same commit as the work.
