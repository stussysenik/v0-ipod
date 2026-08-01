# Tasks — add-motion-shape-authoring

Read `design.md` D3 and D7 before starting. Two things are load-bearing and already correct —
do not rewrite them: `UnitBezier` (`lib/theatre/unit-bezier.ts`), pinned to `@theatre/core` by
`lib/theatre/theatre-parity.test.ts`, which is the only bezier solver this change may reach; and
`ipod-3d-motion-trace.tsx`'s unit-viewBox polyline, which becomes the lane rather than being
copied into one.

**Do not start while `add-motion-authoring-system` has open items.** Its four remaining items are
owner gates on the same files (§6.8, §6c.6, §2.9, §3b.1). Starting here first means editing an
inspector whose look has not been ratified.

Sections 1–3 ship no pixels and can land alone. Sections 4–6 move pixels and **gate on the
owner's visual review** — state what moved and stop.

## 1. Exact keyframe operations — pure, no pixels

- [ ] 1.1 `splitEase(ease, x)` — resolve through `easingHandles()`, solve the bezier parameter
      with the existing `UnitBezier`, subdivide by de Casteljau, renormalise each half to its own
      box. Returns `{ left: Ease, right: Ease, at: number, valueFraction: number }`. D7 lists the
      three degenerate cases; each is exact, none is approximate.
- [ ] 1.2 `insertKeyframe(track, at)` — split the containing segment via 1.1, write the new
      keyframe's `value` and `easing`, carry `hold` onto both halves. Reject an `at` that an
      existing keyframe occupies.
- [ ] 1.3 `deleteKeyframe(track, index)` — neighbours join, spanned by the curve that led into
      the deleted keyframe. Refuse to delete below two keyframes.
- [ ] 1.4 `moveKeyframe(track, index, { at, value })` — clamp `at` strictly between its
      neighbours; seam keyframes are pinned in `at` and linked in `value` (D6).
- [ ] 1.5 `setSegmentEase(track, index, ease)` — one segment, not the track. This is the
      operation `applyTrackEdit`'s `curve` field cannot express.
- [ ] 1.6 `recomputeLoopable(doc)` — every track closes within epsilon. Called after every
      shape edit; never asserted (D6).
- [ ] 1.7 **MEASURE.** Sample all tracks of all five `CATALOGUE_DOCS` at 256 phases, insert at
      each of 9 positions, re-sample. Record the worst absolute deviation per document in this
      file. The floor is floating point — this is the same curve subdivided, not a re-fit. If any
      document exceeds `1e-9`, the subdivision is wrong; do not widen the floor.

## 2. The override union and its migration

- [ ] 2.1 Widen the stored track override to `{ kind: "scaled", gain, phase, curve } |
      { kind: "defined", track: MotionTrack }`, defaulting a legacy object with no `kind` to
      `scaled` so nothing already stored changes meaning.
- [ ] 2.2 Promote on first shape edit: `applyTrackEdit(base, edit)` produces the definition. The
      promotion happens at the edit, not on read (D3).
- [ ] 2.3 **The migration test asserts the converted VALUE.** A scaled override with a non-unit
      gain, a non-zero phase and a custom curve, promoted, must sample identically to the scaled
      track at 64 phases. A test that only asserts the promotion did not throw does not close
      this item — that failure has already shipped here once.
- [ ] 2.4 Sanitizer and migration for a `defined` override arriving from storage or a share
      payload: keyframe count, monotone `at`, finite values. Prove all four persistence
      boundaries honour it — stored slice, share payload, export record, re-open.
- [ ] 2.5 Confirm `docHash` already distinguishes a re-shaped document; add the assertion, not a
      version bump (D8).

## 3. Direction and turns

- [ ] 3.1 Signed amount: widen the gain domain to `[−2, 2]`. A negative gain mirrors the track
      about the hero. `MAX_TRACK_GAIN` becomes a magnitude bound.
- [ ] 3.2 `isTurnTrack(key, track)` — unit is `deg`, monotone across the cycle, span at least a
      half turn (D4). Test all five catalogue documents: turntable azimuth true, every other
      track false.
- [ ] 3.3 `setTurns(track, n)` — rewrite values to span `n × 360`, preserving segment curves and
      relative positions. Test that `−1` mirrors turntable exactly and that `2` still closes.
- [ ] 3.4 `hold` exposed per keyframe as a value the surface can toggle. The format has always
      carried it; only the reach into it is new.

## 4. The lane — pixels

- [ ] 4.1 Lane mode on `ipod-3d-motion-trace.tsx`: a third size, keyframe dots, a value axis. One
      component (D1). A second graph component does not close this item.
- [ ] 4.2 Hit-testing and drag: dot → move, empty lane double-click → insert, segment click →
      the existing curve pad scoped to that segment. Live readout under the cursor naming the
      track, the value and the position.
- [ ] 4.3 Keyboard parity: selection, arrow nudge, modified arrow for the larger step, Delete,
      Enter to open the segment curve, Escape to cancel an in-flight drag by restoring the
      pre-drag document.
- [ ] 4.4 The track row's curve readout reads `Mixed` once segments differ — `unifiedEase`
      already computes it and nothing has ever consumed the result.
- [ ] 4.5 Row expand/collapse: a track row opens into its lane and closes back to the row that
      states its value. Rows stay 24px closed.

## 5. Capture — the rig as input

- [ ] 5.1 Thread the hero pose the document is expressed against, from wherever the stage already
      resolves it. Do not re-derive a hero (design.md, Findings).
- [ ] 5.2 `captureKeyframes(doc, pose, hero, phase)` — one keyframe per camera track at `phase`,
      valued `pose − hero`, replacing any keyframe within snapping distance.
- [ ] 5.3 The `Capture` command in the inspector title row. Disabled with a stated reason when
      there is no live rig to read.
- [ ] 5.4 Test the loop end to end at the library level: three captures at three phases produce a
      document whose sampler returns the three captured poses at those phases.

## 6. The route and the distance

- [ ] 6.1 The Path lane: sample the document across the cycle, project to the plan view, draw the
      route with the playhead marked and captured positions ghosted. Derived, read-only, no
      stored geometry (D2).
- [ ] 6.2 Reach readouts state the offset and the absolute distance from the device.
- [ ] 6.3 Confirm the byte cost: the lane, the route and the capture command are SVG and state,
      no new dependency. Record the route's delta against the artifact budget gate.

## 7. Gates

- [ ] 7.1 `pnpm validate` exits 0; record the readings in `tasks/state.json.gates`.
- [ ] 7.2 Unit count before and after, recorded here. No new oxlint warnings above the 24
      baseline; `tsc` 0.
- [ ] 7.3 Frame rate on the target machine while dragging a keyframe with the rig flying — the
      lane redraws per pointer move and the rig re-samples with it. If it costs frames on Intel
      UHD 620, the drag coalesces to animation frames and the reading is recorded either way.
- [ ] 7.4 **USER: visual review.** The lane, the segment curve, Turns, Capture, the route lane
      and the `Mixed` label change. State what moved and stop. Nothing here hardens first.
- [ ] 7.5 **USER: the split label change.** Splitting a named curve yields two custom tuples and
      the row consequently reads `Mixed` (D7). Confirm that is the wanted reading rather than
      re-fitting halves back onto names.

## 8. Resume here

Nothing started. First eligible item is §1.1, and it is blocked until
`add-motion-authoring-system` closes its four owner gates.
