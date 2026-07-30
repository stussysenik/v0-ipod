# Tasks — add-motion-authoring-system

Read `design.md` D1–D3 and D7 before starting. Two things are load-bearing and already correct
— do not rewrite them: `createClipPoseSampler`'s `(clip, hero) => (phase) => StudioPose`
interface (`lib/studio-clip.ts:55`), which is what keeps preview and export in parity, and
`UnitBezier` (`lib/theatre/unit-bezier.ts`), which is pinned to `@theatre/core` by
`lib/theatre/theatre-parity.test.ts`.

Sections 1–4 ship no pixels and can land alone. Section 6 moves pixels and **gates on the
owner's visual review** — state the deltas and stop.

## 1. The document format

- [x] 1.1 Widen the easing type at its single narrowing point:
      `PresetKeyframe.easing: EasingName` → `Ease = EasingName | CubicBezierHandles`
      (`lib/theatre/motion-presets.ts:41`). Nothing downstream changes —
      `build-state.ts:69` already calls `easingHandles`, which already passes tuples through.
- [x] 1.2 Clamp control-point X to `[0,1]` at the format boundary, never Y. Test both: a
      tuple with `y = 1.56` overshoots; a tuple with `x = 1.4` is clamped and the curve stays
      monotonic in time. `easeInOutBack` is the existing proof that Y overshoot works.
- [x] 1.3 `lib/motion/doc.ts` — `MotionDoc`, `MotionTrack`, `TimeMap`, `Ease`. Track map keyed
      by `string`, not a camera-prop union (D9: lighting keyframes must not need a format
      change). Per-track `phase` offset.
- [x] 1.4 `sampleMotionDoc(doc, phase)` — per-track sampling with per-track phase offset,
      built on the existing `sampleTrack`. Prove the phase offset is track-local: shifting one
      track's phase leaves every other track's samples bit-identical.
- [x] 1.5 Canonical hash of a `MotionDoc` via the existing `stableStringify` + `hashString`
      (`lib/export/export-fingerprint.ts:102,117`). Do not add a second hash implementation.

## 2. The catalogue port — measurement before deletion

Per repo law, a measured value is never nudged to make a check pass. Record readings here as
they are taken; they are then never re-derived.

- [x] 2.1 Harness: `lib/motion/port-deviation.ts`, 2000 uniform phases over the half-open cycle
      `[0,1)`, max per-axis deviation in native units. Hero-independent by construction — every
      generator has the form `hero + f(t)`, so the reading is a property of the port, not of a
      framing.

**THE RECIPE CHANGED, and the change is the finding.** `design.md` D3 proposed quarter keyframes
plus `easeInOutSine` everywhere. That is wrong, and measurably so: `easeInOutSine` has a FLAT
TANGENT at both ends, which is right for motion that rests at each keyframe and wrong for a
smooth curve sampled mid-slope. A quarter of a sine is not approximated by a named curve — it
*is* one, exactly: `easeOutSine(x) = sin(πx/2)` rising, `easeInSine(x) = 1 − cos(πx/2)` falling.
So sine tracks alternate those two, and cosine tracks use the same pair in the opposite order.

- [x] 2.2 `turntable` — the control case. `360 * t` is two keyframes with a `linear` ease.
      - Reading: azimuth **2.842e-14°** (float noise; exact). Harness confirmed.
      - Also: elevation **3.022e-2°** · reach **3.778e-3** — both PASS.
- [x] 2.3 `orbit` — Reading: azimuth **1.285e-1°** · elevation **1.511e-2°** · reach **3.022e-3**.
      All PASS.
- [x] 2.4 `sweep` — Reading: azimuth **3.778e-2°** · elevation **2.116e-1°** · reach **6.045e-3**.
      All PASS. Elevation is the **tightest axis in the catalogue** at 85% of the 0.25° floor,
      because its amplitude (28°) is the largest shipped.
- [x] 2.5 `robo` — Reading: azimuth **1.360e-1°** · elevation **6.045e-2°** · reach **6.800e-3**.
      All PASS.
- [x] 2.6 `crane` — the hard case, and the one that forced a second finding.
      - First reading, 16 even segments + `easeInOutSine`: elevation **1.243°** — **OVER** the
        0.25° floor by 5×. Subdividing further would have hidden it behind a 30-keyframe track
        no human can edit, which defeats the reason for porting at all.
      - Ruling: fit the tangents instead of adding keyframes. `lib/motion/fit.ts` emits a cubic
        Hermite as a bezier easing — control points `(1/3, m₀/3)` and `(2/3, 1 − m₁/3)` give
        slope exactly `m₀` leaving and `m₁` arriving, dropping error from O(h²) to O(h⁴).
      - Final reading, **8** segments (9 keyframes, editable) + tangent matching: azimuth
        **1.813e-1°** · elevation **7.919e-2°** · reach **8.312e-3**. All PASS. Elevation
        improved **15.7×** while the keyframe count *halved*.
- [x] 2.7 Ruled: **all five moves PASS on all three axes.** No move keeps its generator.
      **The residual is one constant.** Every sine and cosine track deviates by exactly
      **7.5561e-3 × amplitude** — identical for both families, because a cosine track is a
      phase-shifted sine over the same quarter shapes. The whole catalogue's 15 readings are
      that one number scaled. It buys a stated headroom:
      - angle tracks conform up to **33.09°** amplitude (largest shipped: sweep elevation, 28°)
      - reach tracks conform up to **1.323 units** (largest shipped: crane reach, 1.1)
      A future amplitude past those breaks the port; the gate below fails loudly rather than
      shipping a miss.
- [x] 2.8 Parity gate: `lib/motion/catalogue.test.ts` — per-move, per-axis, naming both in the
      failure message; the turntable control case; seam closure; absolute-pose reproduction held
      to the same floor; and the residual constant plus its headroom pinned.
- [ ] 2.9 **USER GATE.** Only once every move has a ruling: delete `poseForMove`,
      `MOVE_CYCLE_SECONDS` and the `ProceduralClip` branch of `createClipPoseSampler`.
      - `cyclesForDuration` is already gone — it took a `speed` argument, so it died with
        §3.1 rather than waiting here. `clipCyclesForDuration` went with it (finding F1
        closed).
      - What remains gated is the ENGINE swap, which moves the camera by up to 0.2116°
        (sweep elevation). `motionClipFor` (`lib/motion/motion-shelf.ts`) is the single line
        that changes: it returns the shipped `StudioClip` for an untouched preset today and
        a `documentClip` once this is ruled.
- [x] 2.10 Ported the eight moment cards via `presetToMotionDoc` (`MOMENT_DOCS`). Each card's
      six offset fields become six independently editable tracks that merely happen to share
      keyframe positions.
      **The "exact-equality" wording was wrong and the measurement says why.** A card
      interpolates ABSOLUTE values — `buildPresetState` adds the hero before the lerp — while a
      document interpolates OFFSETS and adds the hero after. In floating point
      `lerp(h+a, h+b) ≠ h + lerp(a,b)`, so bit-equality is unreachable *by construction*, not by
      defect. The document's order is the more correct one: offsets are small so relative
      precision is higher, and hero-independence is what makes a document portable across
      framings.
      - Reading: max **5.68e-14** absolute across all 8 cards × 20k phases (worst at
        `grand-turntable.azimuth`), against interpolated magnitudes of 13–381. Asserted bound is
        `1e-12` — ~17× headroom, still **eleven orders below** the 0.25° perceptual floor and
        four below the fingerprint's own `ANGLE_PRECISION`.

## 3. Authored repeat, and the death of three branches

All of §3 lands in `lib/motion/transport.ts` — one module that now owns clip-progress →
cycle-phase, replacing two cycle-count functions, two easing implementations and three
`hold` branches.

- [x] 3.1 `repeat: number` and `durationSec` are the authored inputs; `cycleSeconds` is derived
      and displayed (`motionReadout`, `seamState`). `speed`, `clipCyclesForDuration` and
      `cyclesForDuration` are deleted. Finding F1 is closed.
- [x] 3.2 Migration is `repeatFromSpeed` + `sanitizeMotionState`
      (`lib/motion/motion-state.ts`), reached from `normalizeModel`, `loadStudioState`,
      `decodePortableState` and `snapshotToModel`.
      **The ledger said `healSlice`; that was the wrong home.** `healSlice` copies keys and
      cannot convert one field into another, and `speed` appears in FOUR places (a stored
      studio slice, a share payload, an export record, a re-open). One sanitizer used by all
      four is the only shape where the conversion cannot happen twice or be missed once. It
      also absorbs the v1 `loop: "hold"` → `repeat: 0` case, which the ledger did not name.
- [x] 3.3 `repeat: 0` holds the hero through `poseAtProgress`. All three `hold` branches are
      gone (`three-d-ipod.tsx` preview + render loop, `ipod-3d-export-dock.tsx`), and
      `LoopStyle` is narrowed to `loop | boomerang`.
      **`repeat: 0` returns the hero in CLOSED FORM, not by pinning phase 0.** D6 called it
      amplitude zero and that is exactly right — a document's tracks are offsets, so scaling
      them by zero IS the hero. Sampling phase 0 would NOT have been: orbit's dolly is a
      raised cosine, so `orbitPose(0)` sits 0.15 units inside its hero and 2° below it. The
      closed form is exact, which is what keeps a held clip byte-identical to today's.
- [x] 3.4 Boomerang's turnaround is now `timeMap.turnaround: Ease`, defaulting to
      `DEFAULT_TURNAROUND = [0.5, 0, 0.5, 1]`.
      **RULED, AND THE LEDGER'S PREMISE WAS WRONG: the default is NOT a no-op.** The shipped
      turnaround is a smootherstep — a QUINTIC, `x³(6x² − 15x + 10)`. A cubic bezier easing
      cannot be one; the gap is a degree mismatch, not a fitting failure. Measured:
      | candidate | max phase error | verdict |
      |---|---|---|
      | best zero-end-slope bezier, `a = 0.49840` | **8.1312e-3** | the family optimum |
      | shipped pick `[0.5, 0, 0.5, 1]` | **8.6642e-3** | +5.3e-4, buys a readable tuple |
      | best unconstrained bezier `[0.44865, −0.05335, 0.55127, 1.05334]` | 2.3380e-3 | **rejected on mechanism** — end slopes −0.119 back the camera *through* the seam. Y overshoot is expression on a value track and a defect on a time map. |
      | tangent-matched track, 6 segments | 6.0294e-4 | clears the floor, but a 7-keyframe time warp is not a curve anyone can drag |
      The zero-end-slope family is what makes the turnaround decelerate into the reversal and
      out of the seam, so it is the family, and 8.6642e-3 of a cycle is its floor. Against
      the shipped catalogue that is a TIMING shift of 0.87% of a cycle:
      - turntable azimuth **3.1191°** · sweep elevation **1.3675°** · crane elevation
        **1.3356°** · crane reach **5.8340e-2** · orbit azimuth **8.3028e-1°** ·
        robo azimuth **8.7912e-1°**
      Above the 0.25° port floor, so **it moves the camera under `boomerang` and gates on the
      owner**. `loop` and held clips are bit-identical. Never re-derive these.
- [x] 3.5 Fractional `repeat` renders and `seamState` reports `open`; integer reports
      `seamless`; `0` reports `held`. The value is never refused.
- [x] 3.6 `lib/motion/transport.test.ts` re-measures 3.4's readings from the shipped
      constants, so re-tuning `DEFAULT_TURNAROUND` breaks a test instead of silently
      re-timing every boomerang clip. Also pins the closed-form hold (sampling the real
      orbit document to show phase 0 is NOT the hero first), the loop seam, and the
      `speed → repeat` conversion including the boomerang halving.
      **THE READINGS ARE ENGINE-SPECIFIC, and 3.4 did not say so.** They reproduce EXACTLY
      when measured on the procedural generators — the engine an untouched preset still
      flies — and shift when measured on the ported documents: turntable azimuth is
      unmoved at 3.1191° (its port is exact, `linearTurnTrack`), sweep elevation reads
      1.3627 vs 1.3675, crane elevation 1.3225 vs 1.3356, crane reach 5.8687e-2 vs
      5.8340e-2. The port residual displaces where the maximum sits. §2.9 will move these
      numbers by exactly that much when it swaps the engine; the test measures the
      procedural clip and says so at the assertion.

## 3b. Owner gate — what §3 changed that you can see

Two items, both measured, both stated rather than smuggled:

- [ ] 3b.1 **USER: the boomerang turnaround.** Per §3.4 — up to 3.1191° on turntable
      azimuth, 1.3675° on sweep elevation, at the mid-leg of a boomerang. Nothing changes
      for `loop` or for a held clip.
- [x] 3b.2 **USER: the export dock's Preview section.** The ledger claimed §1–4 ship no
      pixels; that is true of the engine and false of the controls, because §3.1 deleted the
      inputs two of them edited. What moved:
      - `Speed` (0.5/0.75/1/1.5/2×) → `Repeat` (Hold/1/2/3/4/6×), same row, same segmented
        pattern.
      - The `Hold` loop style is gone; holding is `Repeat · Hold`. `Loop | Boomerang` remain.
      - The move picker and the cadence row no longer dim under hold (finding F6 closed).
      - The readout is now `motionReadout` — `3× · 2.0s · seamless` — instead of `3× · hint`.
      §6 replaces this whole section with the inspector, so this is a bridge, not a design.
      **SUPERSEDED, and the ledger predicted it.** §6.6 deleted the section this gate names.
      There is nothing left here for the owner to look at that §6.8 does not cover, so the
      review folds into §6.8 and this item closes unreviewed rather than staying open against
      a surface that no longer exists.

## 4. Motion gets a home

- [x] 4.1 `IpodStudioState.motion: MotionState`. The interface, its default and its healing
      live in `lib/motion/motion-state.ts` and are re-exported from `model.ts`, so the motion
      library owns its own shape and migration and `model.ts` never imports back into it.
      Carries `playing` as well as `playhead` — 4.2 deletes `previewPlaying`, so it needed a
      home, and it is transient in exactly the same sense (see 4.4).
- [x] 4.2 The six stage-local `useState`s are gone; the stage destructures
      `model.studio.motion`. `aspect`/`quality` left alone as specified.
- [x] 4.3 Nine fine-grained actions: `SET_MOTION_DOC` / `SET_MOTION_TRACK` /
      `CLEAR_MOTION_OVERRIDES` / `SET_MOTION_REPEAT` / `SET_MOTION_DURATION` /
      `SET_MOTION_TIME_MAP` / `SET_MOTION_PLAYHEAD` / `SET_MOTION_PLAYING` /
      `TOGGLE_MOTION_PLAYING`, plus `APPLY_MOTION` for the shelf's one-tap recall.
      `SET_MOTION_DOC` clears overrides: a diff is against a specific base, so carrying it
      would apply Orbit's azimuth curve to Crane and still call the result Crane.
- [x] 4.4 `withoutTransport` at each boundary (encode, storage load, decode, re-open), NOT
      inside the sanitizer.
      **The subtle one, and it would have shipped as a bug.** `sanitizeMotionState` is folded
      through `normalizeModel`, which runs on most reducer actions. Resetting the playhead
      there would have rewound the preview every time the song title changed. The reset
      belongs to the boundary, which is exactly how `isNowPlayingEditable: false` is written
      — at each boundary, not in the fold.
- [x] 4.5 Round-trip test in `lib/ipod-state/portable-state.test.ts`: a hand-authored curve
      (tuple easing + phase offset) encodes, decodes and SAMPLES the identical 33 poses —
      structural equality is the weaker claim and is not what is asserted. Also pins that
      the tuning changes what flies, that the transport settings travel while the position
      does not, and that a mid-flight look encodes to the same string as a composed one.
- [x] 4.6 Decode tests for a pre-motion v1 payload — no `studio.motion` at all heals to the
      default; `loop: "hold"` → `repeat: 0`; hostile field types heal without throwing;
      `durationSec` clamps to the dock's range. The v1 export record re-opening through
      `snapshotToModel` is in `lib/export/proof-restore.test.ts`, which owns that module.
      **THE MIGRATION WAS INERT AND THE TEST IS WHAT FOUND IT.** `repeatFromSpeed` needs the
      document's natural cycle length, `SanitizeMotionOptions.naturalCycleSeconds` carried
      it, and NOT ONE of the four boundaries passed it — so every legacy `speed` converted
      to `repeat: 1` regardless of what it had been flying, and 3.2's claim that the
      conversion "cannot be missed once" was false at every call site. Fixed inside
      `sanitizeMotionState`, which is the only place that knows the `docId`: the option now
      defaults to `CATALOGUE_DOCS[docId].naturalCycleSeconds`. Total for the legacy case —
      `speed` predates the shelf, so a v1 record can only name one of the five shipped
      moves. The option survives for a caller that knows a cadence the catalogue does not.

## 4b. The motion shelf — a tuned motion becomes yours

The signature half of §4. Mirrors `lib/studio-themes.ts` (`loadSavedThemes` / `persistSavedThemes`
/ `renameTheme` / `overwriteTheme` / `nextThemeLabel`) rather than inventing a second registry
shape. Deliberately **no default-motion pointer**: 4.1 already persists the selected doc, so the
boot needs no second pointer, and `add-workspace-storage-registry` is open on 21 keys already.

- [x] 4b.1 `lib/motion/motion-shelf.ts` — `loadSavedMotions` / `persistSavedMotions` /
      `saveMotionAs` / `renameMotion` / `overwriteMotion` / `deleteMotion` /
      `nextMotionLabel`. One key, `ipodStudioMotions`, matching `ipodStudioThemes`.
- [x] 4b.2 `saveMotionAs` copies the RESOLVED document (overrides folded in) field-by-field
      and re-identifies it. What is saved is what was flying, and it stops tracking its
      origin at that instant.
- [x] 4b.3 `lib/motion/motion-shelf.test.ts` tests the independence directly: a saved doc is
      derived from a catalogue doc, the catalogue doc is then revised (amplitude and cycle
      length), and the saved doc still samples its 33 poses identically — with the converse
      asserted too, so the revision is proven not to be a no-op. Covers 4b.4's single healer
      (delete leaves the pointer dangling, `resolveMotionDocById` heals it to Orbit),
      `motionClipFor`'s engine choice on all four paths, rename-preserves-`motionDocHash`,
      the storage round trip through a stubbed `window.localStorage`, and the cap.
- [x] 4b.4 `resolveMotionDocById` heals a dangling `docId` to Orbit in exactly one place —
      deletion deliberately leaves the pointer dangling, the same ruling `resolveDefaultTheme`
      settled. Not yet covered by a test (see 4b.3's file).
- [x] 4b.5 `motionCatalogue` is the one list (shipped → saved → moment cards behind the dev
      toggle) and `motionClipFor` is the one open/apply. **The picker UI is not yet wired to
      it** — the dock still lists `STUDIO_CLIPS`. See §6.7; the data path is done, the rows
      are the inspector's job.

## 5. The timeline proof

- [x] 5.1 `timelineFingerprint(inputs, motionIdentity, positions)` + `timelineFrameKey`.
      `proofFingerprint` untouched.
- [x] 5.2 `exportFingerprint` now hashes a `MotionIdentity`; `FINGERPRINT_VERSION` → 2.
      **The identity is `docHash`, not `docId`.** `move: "orbit"` named both a pristine and a
      hand-tuned Orbit, so two visibly different exports carried one identity — and the
      timeline proof would have served stale frames for edited motion. `docHash` is
      `motionDocHash` of the RESOLVED document. `overrides` rides along for re-open but is
      deliberately NOT hashed: `docHash` already covers it, and hashing both would make two
      encodings of one motion into two identities.
- [x] 5.3 `selectExportSnapshot` takes `{ motion, doc }` and calls `selectMotionIdentity`,
      which resolves the overrides itself so a tuning can never miss the hash.
- [x] 5.4 `lib/export/timeline-proof.ts` — `planTimelineProof` returns one set key plus one
      frame per position. Positions are `MotionDoc.proofPositions`, healed by
      `proofPositions()`, defaulting to `[0, .25, .5, .75, .999]` and folded into the key.
      `0.999` not `1`: an export's `i / total` never reaches 1, so proving position 1 would
      prove a frame no export renders.
- [x] 5.5 `tick(proofKey, snapshot, plan?)` walks `TimelineProofPlan.frames` through the SAME
      `ProofRenderQueue`, anchor at priority 1 and frames at 0. One `warm(key, snapshot,
      priority)` body serves both, so a frame cannot acquire a second render path: a timeline
      frame is the anchor snapshot **with the frame's pose substituted**, which means the
      stage's `captureHighRes` adapter needed no new parameter and the stored `ProofEntry`
      names the pose it actually proves rather than the hero it was derived from.
      `use-proof-cache.ts` plans per tick, passes the plan to `tick`, and exposes
      `timelineFrames` (key + position + pose) for the strip to `peek`; only a CHANGED plan key
      reaches React state. The stage resolves `flownClip` with `motionClipFor` and passes it in
      — the hook does not re-decide the engine.
      **MEASURED, and it moved the design: stability is tracked on the PLAN key, not the
      anchor key.** `timelineFingerprint` folds in the proof inputs, so plan stability implies
      input stability — but not the reverse: switching documents moves the plan key and leaves
      `proofFingerprint` untouched (§5.7). Gating the walk on anchor stability would have
      warmed a whole set on the first tick of every document, so a catalogue browse or a curve
      drag would burst one render per position with no idle debounce — the exact drag-storm the
      scheduler exists to absorb. Pinned by "resets timeline stability on a document change
      while the anchor key holds" in `proof-scheduler.test.ts`.
- [x] 5.6 `lib/export/timeline-proof.test.ts` simulates the export's frame loop (1000 frames,
      `poseAtProgress(i / total)`) and asserts every planned frame is EXACTLY a rendered one
      — including `index / total === position`, so a proved position is a frame the export
      renders rather than one merely near it. Run across boomerang, loop, a fractional
      count, and held (every position is the hero). Also pins that a tuning changes the
      planned poses and that authored `proofPositions` are sampled in the document's order.
- [x] 5.7 Same file: switching documents keeps `proofFingerprint` and changes
      `timelineFingerprint`. Extended past the letter of the task because the letter is the
      weak case — a tuned Orbit and a pristine Orbit share `docId` and must still split
      (they do, on `docHash`), a transport change with an unchanged document must split, and
      a positions change must split so a partial set can never read as a hit.

- [x] 5.8 **The prop that makes the proof true of the screen.** `CameraPreviewState` and
      `ClipRenderOptions` gained `doc?: MotionDoc`; `resolveClip(id, doc)` prefers
      `documentClip(doc)`; `ClipRecorderOptions` forwards it untouched. The stage resolves
      `flownClip` once ABOVE every consumer and derives the prop with `flownMotionDoc`, so the
      live rig, the encoded MP4 and the timeline proof read one decision instead of three.
      **The document is passed, not the clip, and `flownMotionDoc` is why that is safe:** it
      returns `undefined` for an untouched preset, so the generator keeps flying it and §2.9's
      0.2116° swap stays gated. Handing `resolveFlownDoc` to the rig instead would have
      performed that swap silently, since every preset resolves to a document whether or not
      anything was tuned.
      **MEASURED — the gap this closed was 25.9822° of azimuth** at its worst over one cycle
      (Orbit with a hand-authored azimuth track, 2000 phases), 260× the fingerprint's 0.1° pose
      quantisation. The screen was a different camera from the proof shown beside it, and would
      have keyed a different cache entry. Recorded at the assertion in `motion-shelf.test.ts`.
      **A second defect the prop created and the cache key had to absorb:** the rig re-baked its
      pose sampler on `move` alone, but tuning a curve keeps `docId` and changes the document —
      so dragging mid-preview would have held a stale sampler. The document's identity is now
      part of the cache key, compared by reference, which is why `CameraPreviewState.doc`
      carries a referential-stability contract in its doc-comment.
      The clip export re-derives the decision inside the bake from `savedMotionsRef` rather
      than closing over `flownClip`: the shelf is read through a ref precisely so a save cannot
      re-create the export callback and drop an in-flight bake's identity.

## 6. The motion inspector — gates on owner review

**Two units, split before starting rather than in the middle of it.** 6.1–6.4 + 6.6 are the
panel body and its one mount — the thing that has to exist before anything can hang off it.
6.5 and 6.7 hang off it: the proof strip aligns to the scrubber 6.1 renders, and the shelf rows
extend the document list 6.1 renders. Neither can be built first, and together the four are more
than one context budget can read, write, test and record.

- [x] 6.1 One self-contained panel body owning no layout. Props explicit; no rail assumptions.
      Built on `components/ui/studio-controls.tsx` primitives with radii from `CONTROL_RADIUS`
      from the first commit, so it adds nothing to `adopt-studio-control-language`'s 30/17/40.
      `components/ipod/scenes/ipod-3d-motion-inspector.tsx`. It emits its own
      `StudioControlScope` against a `surface` prop and reads the tokens as bare
      `var(--studio-*)` with no fallback — the fallback table has an owner, and a second copy
      of a palette is how two surfaces come to disagree about what "hairline" means.
      **The testable half is not in this file.** `lib/motion/track-edit.ts` owns the algebra
      (readout, gain, phase, curve, pristine) and `track-edit.test.ts` proves it in the node
      project; there is no component test project here, so anything that could be got wrong
      had to be pure. 22 tests.
      **EVERY EDIT IS DERIVED FROM THE BASE, NEVER FROM THE PREVIOUS EDIT**, and the stored
      track is a projection of three scalars rather than an accumulator. Chaining would leave
      `17 × 0.4 × 2.5 = 16.999999999999996` after a drag away and back — a track permanently
      and invisibly off the catalogue, with no gesture that returns it. `readTrackEdit(base,
      stored)` recovers the scalars, so a control can still show the value it holds after a
      reload.
      **THE THIRD APPEARANCE OF THE PRESET-TRACKING DEFECT.** An edit that lands back on the
      shipped values must DROP its override, not store a copy of the base — a stored copy
      samples identically today and stops tracking the catalogue document forever after. New
      action `CLEAR_MOTION_TRACK` plus `withoutTrack`, which collapses `{ tracks: {} }` to
      `undefined` because an empty override survives the codec and a look that was tuned and
      untuned would encode differently from one never touched. `isPristineTrack` compares
      through `canonicalTrack` — extracted out of `motionDocHash` rather than written a second
      time — so a named curve and its control points are the same track. Seven reducer tests
      in `lib/ipod-state/motion-overrides.test.ts`, a file that also closes the gap where
      `SET_MOTION_TRACK` had shipped with no test at all.
      **Gain zero is the hero, in closed form**, proven on the POSE across 200 phases: the
      per-track knob and `repeat: 0` mean one thing at their zero rather than two things that
      resemble each other. (Asserted on the pose because a `-2 × 0` offset is `-0`, and the
      sign of a zero offset is not a property of the camera.)
- [x] 6.2 Track rows: name **and** value (`Azimuth ±17°`, not `Azimuth`). 24px rows, 11px
      chrome type, 1px hairlines.
      **A track value is THREE shapes, and collapsing them states a falsehood about two.** A
      sway is `±17°`, a turn is `360°`, and a dolly that also sits further out is the range it
      covers (`-0.15…0.65`, orbit's raised-cosine reach). The turntable is what forces it:
      reading `0…360` as `±180°` names a half-turn either side of the hero, which is not the
      move. Pinned per case in `track-edit.test.ts`.
- [x] 6.3 Curve editor: two draggable handles, tuple readout updating during the drag, named
      curve shown when the tuple matches exactly, `Custom` otherwise.
      **A DRAG UNIFIES THE TRACK, and a pristine catalogue track therefore reads `Mixed`.**
      The shipped quarter-keyframe tracks alternate `easeOutSine` / `easeInSine` deliberately
      — that alternation is what makes them exact sines (§2) — so they have no single curve to
      show. The pad opens on the first segment's shape, drawn dashed, labelled `Mixed`; the
      first drag replaces every segment. That is the spec's "linear toward easeInOutSine"
      character axis, not a rounding, and the §2 port floor is untouched because no edit
      mutates `CATALOGUE_DOCS`. The closing keyframe is left alone — its outgoing curve is
      never read, and writing it would make a pristine track compare as tuned.
      X is clamped and Y is not, the same asymmetry `resolveEase` enforces; the pad carries
      ±0.64 of vertical headroom so `easeInOutBack`'s −0.6 … 1.6 draws inside the frame.
      Handles are real `<button>`s positioned over an inert SVG: a `role="button"` on an SVG
      node is a control the platform does not know about, and oxlint says so.
- [x] 6.4 Repeat / duration / time map / turnaround, each showing its derived readout
      (`3× · 2.0s · seamless`).
      The turnaround row reads `Custom`, and that is correct: `[0.5, 0, 0.5, 1]` is a measured
      pick (§3.4), not a vocabulary entry. A test pins it, so if a named curve ever equals it
      the ledger hears about it.
- [x] 6.5 Timeline proof strip beneath the playhead scrubber, aligned to it.
      The panel already renders the scrubber as its own full-width last row and takes a
      `belowScrubber` slot, so the alignment is composition rather than arithmetic.
      `components/ipod/scenes/ipod-3d-timeline-proof-strip.tsx` — one cell per planned frame,
      each carrying the clip time it proves (`0.0s · 1.3s · 2.5s · 3.8s · 5.0s` at 5s), a
      section reading `Proof  3/5` while the set warms, and a click that scrubs the playhead to
      the position the cell proves. The algebra is `lib/export/timeline-strip.ts` + 10 tests,
      for the same reason §6.1's was: there is no component test project.
      **`nearest`, NOT `current`.** The playhead is continuous and the set is five points on
      it. A cell claims "no proof is closer", which is true everywhere; a cell claiming to BE
      the playhead would be lying at 4 of every 5 pixels of a scrub. Ties resolve to the lower
      index so the mark never jumps backwards on a forward scrub.
      **Order is the document's, never sorted.** `proofPositions` heals but does not sort, and
      `timelineFrameKey` binds a frame to its index — a strip that sorted would hang one cell's
      label over another cell's cached frame. Pinned with an authored `[0.5, 0, 0.25]`.
      **NO `version` PROP, and that is the design.** The strip reads `peek` during render; a
      landed frame arrives through the stage's own re-render, since `version` is state there.
      A memo over the reads would have needed `version` as a dep it does not derive from —
      oxlint said so, and the rule was right. The constraint that replaces it is stated in the
      component's doc-comment: this component must not be wrapped in `React.memo`.
      **The strip is composed in the STAGE and forwarded through the dock as a `ReactNode`.**
      Reading the proof cache is a stage decision already made three times (panel, history
      thumbnail, timeline plan); the dock owns the inspector's mount and nothing else, so
      `refactor-3d-control-surface-to-inspector` re-parents the strip by moving one prop.
      `lib/export/use-blob-url.ts` now owns blob → object URL for the strip's cells and the
      dock's `ProofThumb` — the third copy of a manual allocation whose leak is invisible until
      a long session ends. The proof panel keeps its own: it holds TWO blobs alive to show the
      last frame dimmed while the next computes, which is a different lifetime.
      **A reading for §6.8, not a defect fixed silently:** with `repeat: 0` every position
      proves the hero (§5.6), so the strip shows five identical cells and the plan warms five
      identical renders under distinct keys. True, cheap, and possibly worth collapsing to one
      cell — the owner's call, since it moves pixels.
- [x] 6.6 Mount in the export dock's Preview section (`ipod-3d-export-dock.tsx:224`) — the only
      place this change moves. `refactor-3d-control-surface-to-inspector` later re-parents it
      under the Camera part and deletes the mount, not the component.
      The Preview section is gone: a style segment, a move picker, a repeat row and a
      transport — four controls that could SET a motion and not one that could open it. The
      dock's own `Clip length` slider went with it, because the inspector carries `Length` and
      two controls for one value is drift with a second opinion. `data-testid` moved with the
      control. The dock now resolves nothing about motion: `documents`, `doc` and `baseDoc`
      arrive from the stage, which already made that decision once for the rig, the encoder
      and the proof.
- [x] 6.7 Shelf rows: saved motions listed beside the catalogue, 24px rows carrying name **and**
      value (`Orbit — slow · 3× · seamless`). Save / Rename / Save over in an overlay transparent
      at rest — the same pattern the Themes shelf settled, not a second one.
      **A ROW STATES A VALUE, SO THE VALUE HAD TO BE STORED.** `3× · seamless` is not readable
      off a `MotionDoc` — repeat, clip length and time map live in `MotionState`, so the row as
      specified was showing a value the entry did not hold. `SavedMotion.cadence`
      (`MotionCadence = Pick<MotionState, "repeat" | "durationSec" | "timeMap">`) closes it, and
      the unused `APPLY_MOTION` action — payload `MotionState`, comment "the shelf's one-tap
      recall" — is evidence this was always the shape: the shelf half of §4 was built for a
      whole slice and §4b.1 stored a third of one. Corollary the sketch omitted: the row reads
      `3× · 1.7s · seamless`, the full `motionReadout`, because the cycle length is now a value
      the entry holds rather than a derivation from whatever the transport is set to.
      **SAVE OVER THE OPEN ENTRY CLEARS THE OVERRIDES.** Folding the tuning into the entry's
      document makes the surviving override a stored copy of its own base — the
      preset-tracking defect this project has now paid for four times (saved rig, `castShadow:
      undefined`, `applyTrackEdit`, this). One extra dispatch, guarded on `id === docId`.
      **DELETING THE OPEN ENTRY RECORDS WHAT THE ONE HEALER RESOLVES TO**, via
      `resolveMotionDocById(id, next).id` rather than the literal `"orbit"`. §4b.4's ruling
      (deletion leaves the pointer dangling; one healer decides) is about not having two
      healers, not about leaving the picker marking nothing while Orbit flies — the resolver
      still decides, the reducer stores its answer.
      **THE ROWS ARE `documents` MINUS THE SHELF**, not a second list. §4b.5's one list stays
      the only source of picker order; a set difference cannot list a motion twice, and two
      arrays passed in could.
      **THE CADENCE HEALS THROUGH `sanitizeMotionState`**, not through a second set of clamps
      — and it is the FIRST caller of `SanitizeMotionOptions.naturalCycleSeconds`, the option
      documented for "a caller that knows a cadence the catalogue does not". Pinned by value
      (a stored `speed: 1` over 20s on a 10s shelf document converts to `repeat: 2`, not the
      `DEFAULT_REPEAT` fallback), which is the §4.6 lesson applied on the way in.
      Two smaller calls: saving does NOT switch to the new entry (one gesture, one effect —
      the copy flies identically, so switching would change identity with nothing to show);
      and `RowCommand` is local to the inspector rather than shared with the cockpit's, because
      that one is hard-coded to black-on-white and this one solves against the scope's control
      tokens — a shared component would need a palette handed to it by both callers to say the
      same thing. The six shelf inputs travel as ONE `shelf` prop (`MotionShelfControls`) so
      `refactor-3d-control-surface-to-inspector` re-parents them by moving one line.
      `lib/motion/motion-shelf.test.ts` +6 (26), unit 1083/1083 across 67 files.
- [ ] 6.8 **USER: visual review.** State what moved and stop. Nothing here hardens first.

## 7. Gates

- [x] 7.1 `pnpm validate` green.
- [x] 7.2 Theatre parity test still green — the sampler contract is unchanged.
- [x] 7.3 Live-vs-export pose parity test still green across the ported catalogue.
- [x] 7.4 `openspec validate add-motion-authoring-system --strict --no-interactive`.
- [x] 7.5 Update `tasks/state.json` in the same commit as the work.

## 8. Resume here — the state of the work

Rewritten at the end of the 2026-07-30 session that landed §6.7. `tsc --noEmit` exits 0,
`vitest --project unit` is **1083/1083 across 67 files** (was 1077), `oxlint` adds no
warnings (24, unchanged). Every implementable task in this change is done: a motion can be
opened, its tracks read by value, its curves dragged, its edits cleared back to the
catalogue, the frames the export will render sit under the scrubber that flies them, and a
tuned motion can be saved, named, overwritten and re-opened at the cadence it was flying —
all from the surface, none of it from TypeScript.

### What is left is three owner gates, and nothing else

1. **§6.8**, the visual review of §6. Nothing hardens first.
2. **§2.9**, the engine swap — the measured 0.2116° port floor, waiting on a veto.
3. **§3b.1**, the boomerang turnaround — up to 3.1191° on turntable azimuth, measured and
   ruled, waiting on a veto.

None of them can be closed by writing code, and none of them blocks the others.

### What the tests found — two defects the 968 could not see

- **The `speed → repeat` migration was inert.** Written, documented, reached from four
  boundaries, and passed the cycle length it needs by NONE of them, so every legacy `speed`
  converted to one cycle. Fixed in `sanitizeMotionState` (§4.6). The lesson generalises: an
  option with a fallback is not a migration until a test asserts the converted VALUE.
- **§3.4's readings are engine-specific and did not say so.** They reproduce exactly on the
  procedural generators and shift on the ported documents (§3.6). §2.9 will move them by
  that amount when it swaps the engine.

### Things that are true now and were not before

- **`lib/motion/transport.ts` is the only owner of clip-time → phase.** Nothing else may
  compute a cycle count or a ping-pong. `studio-camera.ts` has lost `easeInOut`, `pingPong`,
  `phaseForProgress` and `cyclesForDuration`; `studio-clip.ts` has lost
  `clipCyclesForDuration`.
- **`motionClipFor` (`lib/motion/motion-shelf.ts`) is the only place that decides WHICH
  ENGINE flies a motion, and all three consumers now reach it through ONE call.** Untouched
  preset → its shipped `StudioClip` (generator). Tuned or saved → `documentClip`. The stage
  resolves `flownClip` above every consumer (§5.5, §5.8); the proof takes the clip, and the
  live rig plus the MP4 take `flownMotionDoc(flownClip)` as `doc?: MotionDoc`. `resolveClip`
  in `three-d-ipod.tsx` prefers the document when one is present, and its ABSENCE is what
  keeps a preset on its generator — the invariant is `flownMotionDoc`'s, not the caller's.
- **`MotionState.playing` exists** and D7's field list does not mention it. §4.2 required
  deleting `previewPlaying`, so it needed an owner; it is excluded at the codec boundary
  alongside `playhead`.
- **`DocumentClip` is a third `StudioClip` kind**, added rather than swapped. §2.9 deletes
  the procedural branch; it does not need to add this one.
- **`MotionDoc` gained `proofPositions?`** (§5.4) and `MotionOverrides` + `resolveMotionDoc`
  (§4.1). The unit of override is the TRACK, not the keyframe.

### Known gaps, named so they are not rediscovered

- **A shelf entry now carries a cadence, and the picker does not.** Opening a saved motion
  restores `repeat`, `durationSec` and `timeMap` (§6.7); picking a catalogue move leaves the
  transport where it stands, because a shipped move has no authored cadence to restore — only
  a `naturalCycleSeconds` the Repeat row already reads. Deliberate, and the asymmetry is
  visible: a shelf row states its cadence, a catalogue chip does not.
- **A held clip proves one pose five times.** With `repeat: 0` every planned position is the
  hero, so the plan warms five identical renders under five distinct keys and the strip shows
  five identical cells (§6.5). Correct, not free. Collapsing it moves pixels, so it waits on
  §6.8 rather than being decided here.
- **`MOVE_CYCLE_SECONDS` is still read** by `studio-clip-presets.ts:20` for each procedural
  clip's `naturalCycleSeconds`. §2.9 deletes it, and the replacement is
  `CATALOGUE_DOCS[id].naturalCycleSeconds`, which already carries the same five numbers.
- **`repeat` no longer re-derives when `durationSec` changes.** That is D2 working as
  specified — three inputs collapsing through a `round()` was the defect — but it means
  dragging the clip length from 5s to 30s now stretches one cycle over 30s instead of
  spinning six times. The Repeat row is right beside the length slider so the correction is
  one tap, and §6.4's readout (`3× · 2.0s · seamless`) makes the consequence visible. Worth
  the owner's eye during 3b.2.
