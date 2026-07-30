# IR — the locked data contract

This file is the **parameter lock**. It names every canonical type in the product, where it
lives, what values it may hold, and which boundary heals it. Nothing here is a suggestion.
A change that contradicts this file is a defect against a ratified spec (`openspec/specs/`)
and preempts all other work.

Read this before writing any code that touches state, colour, motion, or export.

**Rule zero: this file does not own the code, it indexes it.** Every row names a
`file.ts:line`. When a value and this file disagree, the code is authoritative and this file
is the bug — fix it in the same commit. Never copy a value out of here into a second
constant.

---

## 1. One model, five projections

There is exactly one product state: **`IpodWorkbenchModel`** — `lib/ipod-state/model.ts:242`.

```ts
interface IpodWorkbenchModel {
  metadata:     SongMetadata            // what the screen says
  playback:     IpodPlaybackSnapshot    // where the playhead sits, what range is selected
  presentation: IpodPresentationState   // the physical finish: 7 colours + view mode + hardware preset
  interaction:  IpodInteractionState    // on-device OS state: screen, menu index, battery, playing
  studio:       IpodStudioState         // /3d direction: lighting rig, motion, toggles
  panelLayout:  PanelLayoutState        // per-mode floating panel frames
  savedColors:  SavedColorHistory       // recent custom colours, per target
}
```

Everything else in the product is a **projection of this one value**. There are five, and
adding a sixth without a spec is how the product stops being one product:

| # | Projection | Home | Shape |
|---|---|---|---|
| 1 | Render | `components/ipod/**` | React reads the model; no component owns state the model could hold |
| 2 | Storage | `lib/ipod-state/storage.ts` | localStorage, healed on read |
| 3 | Share link | `lib/ipod-state/portable-state.ts` | `?s=<encoded>`, `PORTABLE_STATE_VERSION = 1`, param `PORTABLE_STATE_PARAM = "s"` |
| 4 | Export identity | `lib/export/export-fingerprint.ts` | `ExportSnapshot`, `FINGERPRINT_VERSION = 2` |
| 5 | Decision log | `add-customizer-decision-log` (open) | wraps the reducer; coalesces actions into entries |

**The projection law.** A new feature is only finished when it appears in every projection
that logically contains it. A camera motion you can author but cannot share, or can share
but cannot re-open from an export, is half-built. This is the exact defect that made motion
a modelled slice rather than six `useState` calls in the stage — see the doc-comment at
`lib/ipod-state/model.ts:158`.

### 1a. The known structural defect — read before touching the reducer

**Two folds of one model, on two routes.** `ipodCentralMachine` is mounted app-wide
(`app/layout.tsx:126`) and drives `/` plus the floating panels. `/3d` runs its own
`useReducer(ipodWorkbenchReducer)` (`components/ipod/scenes/ipod-3d-stage.tsx:112`). They do
not conflict today only because they sit on different routes.

Consequence: any reducer-wrapping feature (the decision log) lands on `/3d` and silently
misses `/`. No proposal owns this yet. If your task wraps the reducer, say so and stop —
this is an owner decision, not an implementation detail.

---

## 2. State transitions — the action inventory

All mutation goes through `IpodWorkbenchAction` — `lib/ipod-state/update.ts:43`. There is no
`setState` path into the model.

**Why one action per authored field, never a single `SET_MOTION` patch:** the decision log
coalesces by action type. Fifty `SET_MOTION_REPEAT`s from one stepper drag fold into one log
entry; a repeat edit and a curve edit stay two entries because they are two decisions. A
generic patch action destroys that. Follow the pattern for any new authored field.

| Group | Actions |
|---|---|
| Metadata | `UPDATE_TITLE` `UPDATE_ARTIST` `UPDATE_ALBUM` `UPDATE_ARTWORK` `UPDATE_CURRENT_TIME` `UPDATE_DURATION` `UPDATE_RATING` `UPDATE_TRACK_NUMBER` `UPDATE_TOTAL_TRACKS` |
| Finish | `SET_SKIN_COLOR` `SET_BG_COLOR` `SET_RING_COLOR` `SET_CENTER_COLOR` `SET_BACK_COLOR` `SET_EDGE_COLOR` `SET_BEZEL_COLOR` `SAVE_CUSTOM_COLOR` `SET_HARDWARE_PRESET` `SET_VIEW_MODE` |
| OS / interaction | `SET_INTERACTION_MODEL` `SET_OS_SCREEN` `SET_OS_MENU_INDEX` `CYCLE_OS_MENU` `SET_OS_ORIGINAL_MENU_SPLIT` `SET_OS_NOW_PLAYING_LAYOUT` `SET_OS_NOW_PLAYING_EDITABLE` `TOGGLE_OS_NOW_PLAYING_EDITABLE` `SET_IS_PLAYING` `TOGGLE_IS_PLAYING` `SET_BATTERY_LEVEL` `SET_BATTERY_MODE` |
| Snapshot | `SET_SELECTION_KIND` `SET_RANGE_START_TIME` `SET_RANGE_END_TIME` `APPLY_SONG_SNAPSHOT` |
| Lifecycle | `RESTORE_MODEL` `RESET_MODEL` |
| Lighting | `SET_LIGHTING` `PATCH_LIGHT` `PATCH_AMBIENT` `PATCH_ENV` `PATCH_SOFTBOX` `RESET_LIGHTING` |
| Studio toggles | `SET_TECHNICAL_FLAT` `SET_INTERACTION_LOCK` `SET_MARQUEE` `SET_SHOW_PORTS` `SET_LAYOUT_MODE` `SET_THEATRE_STUDIO` (+ a `TOGGLE_` for each) |
| Motion | `SET_MOTION_DOC` `SET_MOTION_TRACK` `CLEAR_MOTION_TRACK` `CLEAR_MOTION_OVERRIDES` `SET_MOTION_REPEAT` `SET_MOTION_DURATION` `SET_MOTION_TIME_MAP` `SET_MOTION_PLAYHEAD` `SET_MOTION_PLAYING` `TOGGLE_MOTION_PLAYING` `APPLY_MOTION` |

`normalizeModel` (`lib/ipod-state/update.ts:169`) runs on most actions and clamps:
`duration ≥ 1`, `currentTime ∈ [0, duration]`, `rating ∈ [0,5]`,
`trackNumber ∈ [1, totalTracks]`, and folds `sanitizeMotionState`.

**`normalizeModel` must never reset the playhead.** It runs on nearly every action, so a
playhead reset there would rewind the preview when the user edits the song title. Transport
exclusion belongs to the *boundary* (`withoutTransport`), not to healing. Healing and
excluding are different jobs — see §5.

---

## 3. Motion — the deepest sub-IR

Motion is the most heavily specified part of the product because it was rebuilt from six
local `useState`s into a document model. Five modules, one direction of dependency.

### 3.1 `MotionDoc` — what a camera move *is* · `lib/motion/doc.ts:82`

```ts
interface MotionKeyframe {          // doc.ts:51
  at: number                        // normalized position in one cycle, 0 = start, 1 = end
  value: number                     // OFFSET from the hero pose, in the track's native unit
  easing?: Ease                     // curve LEAVING this keyframe: a name or a bezier tuple
  hold?: boolean                    // step instead of tween
}

interface MotionTrack {             // doc.ts:62
  keyframes: MotionKeyframe[]
  phase?: number                    // sampling offset in [0,1) — the organic knob
}

type TimeMap =                      // doc.ts:80
  | { kind: "loop" }
  | { kind: "boomerang"; turnaround?: Ease }

interface MotionDoc {               // doc.ts:82
  id: string
  label: string
  hint?: string
  tracks: Record<string, MotionTrack>   // string-keyed on purpose
  loopable: boolean                     // does it return to its seam
  naturalCycleSeconds: number           // a default, not a constraint
  proofPositions?: readonly number[]    // where the timeline proof samples
}
```

Three load-bearing facts:

- **Keyframe values are offsets from the hero pose, never absolute poses.** This is why
  `repeat: 0` returns the hero *in closed form* — scaling offsets by zero *is* the hero.
  Sampling phase 0 is **not** the hero: orbit's dolly is a raised cosine, so `orbitPose(0)`
  sits 0.15 units inside its hero and 2° below it.
- **Tracks are string-keyed**, not a fixed pose struct, so one sampling engine serves any
  axis set. `TRACK_META` / `TRACK_ORDER` (`lib/motion/track-edit.ts:53,63`) supply labels
  and picker order.
- **This module arranges keyframes; it never computes a value.** Interpolation is
  `UnitBezier`, pinned to `@theatre/core` by `lib/theatre/theatre-parity.test.ts`, reached
  through the shared `buildTrack` / `sampleTrack` pair. Do not add a second interpolator.

`DEFAULT_PROOF_POSITIONS = [0, 0.25, 0.5, 0.75, 0.999]` (`doc.ts:108`). `0.999` not `1`,
because an export's last frame sits just *before* the seam (`i / total` never reaches 1), so
proving position 1 would prove a frame no export renders.

### 3.2 `MotionOverrides` — identity plus sparse diff · `doc.ts:134`

```ts
interface MotionOverrides { tracks?: Record<string, MotionTrack>; naturalCycleSeconds?: number }
```

**The unit of override is the TRACK, not the keyframe.** A track is what an edit gesture
produces (drag a curve, that axis changes as a whole). A keyframe-level diff would have to
answer what a re-timed keyframe means against a base that moved underneath it. An absent
track keeps tracking the catalogue.

This is the same ruling `update-studio-theme-authoring` settled for rigs — see §5.3.

### 3.3 `MotionState` — the model slice · `lib/motion/motion-state.ts:26`

```ts
interface MotionState {
  docId: string                 // catalogue id, or a user-saved document's id
  overrides?: MotionOverrides   // absent = pristine
  repeat: number                // whole cycles across the clip; 0 HOLDS the hero
  durationSec: number           // clip length
  timeMap: TimeMap
  playhead: number              // [0,1) over the whole clip — excluded at the codec boundary
  playing: boolean              // excluded at the codec boundary
}
type MotionCadence = Pick<MotionState, "repeat" | "durationSec" | "timeMap">   // :50
```

| Constant | Value | Home | Why bounded there |
|---|---|---|---|
| `DEFAULT_REPEAT` | 1 | `transport.ts:62` | |
| `MAX_REPEAT` | 240 | `motion-state.ts:70` | at 60 s × 240 a cycle is 0.25 s — below where a camera move reads as a move |
| `MIN_DURATION_SEC` | 2 | `motion-state.ts:62` | export dock slider floor |
| `MAX_DURATION_SEC` | 60 | `motion-state.ts:63` | export dock slider ceiling |
| `DEFAULT_DURATION_SEC` | 5 | `transport.ts:65` | |
| `DEFAULT_TIME_MAP` | `{kind:"loop"}` | `transport.ts:59` | |
| `DEFAULT_TURNAROUND` | `[0.5, 0, 0.5, 1]` | `transport.ts:56` | measured pick — see §7 |
| `MAX_TRACK_GAIN` | 2 | `track-edit.ts:161` | |
| `PRISTINE_TRACK_EDIT` | `{gain:1, phase:0, curve:null}` | `track-edit.ts:153` | |
| `MAX_SAVED_MOTIONS` | 50 | `motion-shelf.ts:48` | past this a shelf is a file browser and needs a different surface |

`seamState(repeat)` → `"held" | "seamless" | "open"` (`transport.ts:77`).
`motionReadout(repeat, durationSec)` renders the row value, e.g. `3× · 1.7s · seamless`.

### 3.4 `SavedMotion` — the shelf · `lib/motion/motion-shelf.ts:32`

```ts
interface SavedMotion { id: string; label: string; doc: MotionDoc; cadence: MotionCadence }
```

Storage key `ipodStudioMotions` (`motion-shelf.ts:45`).

**A shelf entry stores the document WHOLE** — the one place the identity-plus-overrides
ruling does *not* apply, because a shelf entry is a *definition*, not a reference to one.

**A row states a value, so the value has to be stored.** `cadence` exists because
`3× · seamless` is not readable off a `MotionDoc` — repeat, clip length and time map live in
`MotionState`. Generalises: when a task specifies a readout, the readout is a spec for the
**stored shape**, not for the formatting.

**One list, not two.** `motionCatalogue()` (`:60`) returns every selectable document in
picker order: five shipped moves, then saved ones, then (behind the dev toggle) moment cards.
A saved motion is opened, applied and exported by the same code path as a shipped one — there
is no "custom motion" mode to discover. Shelf rows are `documents` MINUS the shipped set, a
set difference, so a motion cannot appear twice.

`motionClipFor` / `flownMotionDoc` (`:119,140`) are the single home of *"a document is
present IFF the document engine flies it"* — `undefined` for an untouched preset. Boundaries
take `doc?: MotionDoc`. **Never hand `resolveFlownDoc` to a consumer instead**: every preset
resolves to a document whether or not anything was tuned, so that silently performs the
gated engine swap (§7, 0.2116°).

### 3.5 The catalogue · `lib/motion/catalogue.ts`

Five shipped moves — `CameraMove = "orbit" | "robo" | "turntable" | "sweep" | "crane"`
(`lib/studio-camera.ts:88`). `CATALOGUE_DOCS` (`catalogue.ts:166`) is the ported document
form; the procedural generators (`orbitPose` … `cranePose`, `studio-camera.ts:124-214`) remain
the parity oracle. **No edit ever mutates `CATALOGUE_DOCS`** — that is what keeps the port
floor valid.

---

## 4. Studio direction — rig, pose, theme

### 4.1 `StudioLightingConfig` · `lib/studio-lighting-config.ts:74`

Spots (`SpotSpec:52`) carry `SpotRole = "key" | "fill" | "rim"`; softboxes are `SoftboxSpec:64`.

| Ceiling | Value | Line |
|---|---|---|
| `MAX_AMBIENT_INTENSITY` | 4 | `:577` |
| `MAX_SPOT_INTENSITY` | 1200 | `:578` |
| `MAX_SOFTBOX_INTENSITY` | 6 | `:579` |
| `MAX_ENV_INTENSITY` | 4 | `:580` |

Five rigs: `APPLE_PRODUCT_RIG` `DESIGNER_DARK_RIG` `EDGE_NOIR_RIG` `NATURAL_LIGHT_RIG`
`FLAT_TECHNICAL_RIG` (`:98,148,190,240,284`). **`DESIGNER_DARK_RIG` is the factory rig** —
the black device on the blue stage is the canonical first impression.

`RigOverrides = Partial<StudioLightingConfig>` (`:347`), with `diffFromPreset` (`:404`) and
`applyOverrides` (`:423`). `sanitizeLightingConfig` (`:612`) heals totally.

**The `castShadow: undefined` trap.** `sanitizeSpot` writes `castShadow: undefined`, so a
stored config carries keys a preset literal does not. A naive equality reads that as a
deviation and would pin every reloaded theme's rig, ending preset tracking after the first
reload. Compare structurally, never by key presence.

### 4.2 `StudioPose` · `lib/studio-camera.ts:23`

```ts
interface StudioPose { azimuth: number; elevation: number; reach: number; target?: [number,number,number] }
```

`REACH_RANGE = [5.5, 19]` (`:233`) · `ELEVATION_RANGE = [-78, 78]` (`:234`) ·
`DEFAULT_TARGET = [0,0,0]` (`:37`) · `clampPose` (`:236`) is the only clamp.
`PINCH_SPREAD_FLOOR_PX = 24` (`:255`).

### 4.3 `StudioTheme` · `lib/studio-themes.ts:56`

```ts
interface StudioThemeRig { name: string; overrides: RigOverrides }   // :49 — preset name + sparse diff
interface StudioTheme { /* :56 */ }
```

Keys: `ipodStudioThemes` (`:132`), `ipodStudioDefaultTheme` (`:228`). `NOIR_THEME` (`:71`) is
the only built-in.

`createBootedWorkbenchModel` (`:273`) resolves the stored default-theme pointer and applies
its actions over the factory model, so **the booted look and the theme the shelf marks
default cannot disagree**. Deleting the default deliberately leaves the pointer dangling;
`resolveDefaultTheme` (`:255`) is the *one* place that heals it, to Noir. This wires `/3d`
only — `/` still boots through `ipodCentralMachine` (§1a).

---

## 5. The five boundary rules

These cost sessions to learn. Each has shipped as a bug at least once. Violating one is a
defect, not a style difference.

### 5.1 Healing is total and never throws
Every storage boundary heals: a field that is missing, wrong-typed or NaN becomes its
default; unknown fields are **dropped**, not carried. `sanitizeMotionState`
(`motion-state.ts:199`), `sanitizeMotionOverrides` (`:136`), `sanitizeLightingConfig`
(`studio-lighting-config.ts:612`).

### 5.2 One sanitizer, four boundaries — a migration lives where the id is known
`speed → repeat` is *converted*, not dropped, because it names a cadence really being flown.
It appears at four boundaries: `normalizeModel`, `loadStudioState`, `decodePortableState`,
`snapshotToModel`. Exactly one sanitizer serves all four, so the conversion cannot happen
twice or be missed once.

`healSlice` copies keys; **it cannot host a migration** — it does not know the docId that
`repeatFromSpeed` needs for the natural cycle length.

**An option with a fallback is not a migration until a test asserts the converted VALUE.**
This shipped inert: `SanitizeMotionOptions.naturalCycleSeconds` existed, and not one of the
four boundaries passed it, so every legacy `speed` converted to `repeat: 1` regardless of
what it had been flying. A test asserting "does not throw" passed on the broken code.

### 5.3 When a BASE is rewritten to include a DIFF, the diff must be dropped in the same gesture
**Paid for four times**: the saved theme's rig, the `sanitizeSpot castShadow:undefined` false
deviation, `applyTrackEdit` chaining, and Save-over on the motion shelf. Folding the tuning
into the entry's document leaves the override a stored copy of its own base — it samples
identically today and **stops tracking the base forever after**.

Corollary, `applyTrackEdit` (`track-edit.ts:200`): a control that stores a derived value must
derive it **from the base**, never from the previous result. Chaining leaves
`17 × 0.4 × 2.5 = 16.999999999999996` after a drag away and back — permanently and invisibly
off the catalogue, with no gesture that returns it. And an edit landing back on the shipped
values **clears** its override (`CLEAR_MOTION_TRACK`, `withoutTrack` collapsing `{tracks:{}}`
to `undefined`) rather than storing a copy.

### 5.4 A name is not an identity — hash the behaviour
`move: "orbit"` named both a pristine and a hand-tuned Orbit, so two visibly different
exports carried one identity and the timeline proof served stale frames for edited motion.
`MotionIdentity.docHash` is `motionDocHash` of the **resolved** document
(`export-fingerprint.ts:81`). `overrides` rides along for re-open and is **deliberately not
hashed** — `docHash` already covers it, and hashing both makes two encodings of one motion
into two identities.

Same shape, second occurrence: the rig re-baked its pose sampler when `move` changed —
correct while a move was only a preset id, wrong the moment a curve could be dragged. The
document's **reference** is now part of the cache key, affordable only because `flownClip` is
memoized on `(docId, overrides, savedMotions)`. `CameraPreviewState.doc` therefore carries a
referential-stability contract in its doc-comment.

**Generalises: the key a cache or a debounce compares on is part of its contract, not an
implementation detail.** Third occurrence: plan stability is tracked on the *plan* key, not
the *anchor* key — `timelineFingerprint` folds in proof inputs, so plan stability implies
input stability but not the reverse.

### 5.5 Transport is excluded at the boundary, not healed in the middle
`withoutTransport(motion)` (`motion-state.ts:263`) at encode / storage-load / decode /
re-open. Where you are in a clip is a fact about this session, not about the motion.

---

## 6. Export identity · `lib/export/export-fingerprint.ts`

```ts
FINGERPRINT_VERSION = 2                          // :34 — v2 made the motion fields an IDENTITY
interface FingerprintPose { azimuth; elevation; reach; target: [number,number,number] }  // :36
interface ProofInputs { pose; aspect; quality; metadata{title,artist,album,currentTime,duration};
                        marquee; batteryLevel; osScreen; presentation{7 colours + hardwarePreset};
                        lighting: unknown }      // :44
interface MotionIdentity { docId; docHash; repeat; durationSec; timeMap: unknown; overrides?: unknown }  // :81
interface ExportSnapshot extends ProofInputs { motion: MotionIdentity }   // :98
```

Pose quantization (`:115`): angles to **0.1°**, distances to **1e-3**. A 0.01° nudge from an
orbit drag must not mint a new cache key, or speculative pre-compute thrashes. `-0` is
normalized to `0` so the two hash identically.

`stableStringify` + `hashString` (`:133,148`) are the **only** hash implementation. Import
direction today is one-way: `lib/motion/doc.ts` reads them out of this module. If this module
ever needs to import back from `lib/motion`, **extract the two helpers to a neutral module —
do not resolve the cycle in place.**

**A proof frame's provenance is its own pose.** One `warm(key, snapshot, priority)` body
serves the anchor and every timeline frame; a frame is the anchor snapshot with `frame.pose`
substituted. The stored `ProofEntry` restores the camera it actually proves.

---

## 7. Locked measurements — never re-derive these

Every number below is on the record. The owning `tasks.md` is authoritative; this table
exists so a cold session does not spend an hour rediscovering one.

### 7.1 Colour fidelity — `add-color-fidelity-verification/tasks.md`

`FIDELITY_ENVELOPE` (`lib/color-fidelity.ts:144`) — exhaustive, contiguous cover of
L\* ∈ [0,100], verified against an exhaustive **16.7 M-colour sweep**:

| L\* band | ΔE00 none | ΔE00 Neutral (measured) | published ceiling | verdict |
|---|---|---|---|---|
| 0–10 | 0 | 6.122 | 6.5 | accepted-compression |
| 10–20 | 0 | 11.2889 | 11.5 | accepted-compression |
| 20–30 | 0 | 11.4575 | 11.75 | accepted-compression |
| 30–50 | 0 | 10.0915 | 10.5 | accepted-compression |
| 50–70 | 0 | 6.2517 | 6.5 | accepted-compression |
| 70–90 | 0 | 4.2187 | 4.5 | accepted-compression |
| 90–100 | 0 | 3.3959 | 3.5 | accepted-compression |

- **Under `NoToneMapping` fidelity is EXACT — ΔE00 = 0 across the whole gamut.** Not "within
  1.0" as originally proposed. **Any nonzero reading is a defect, not a tolerance question.**
  The sRGB decode/encode are exact inverses at 8-bit precision, verified over all 256 code
  values.
- Error peaks middle-dark because Neutral subtracts a linear black offset of at most 0.04;
  near black the offset tapers (`x − 6.25x²`), at high L\* it is negligible, and in between
  the full offset applies where L\* is still steep in linear light.
- The top band is closed at `100 + 1e-4`: the sRGB→XYZ luminance row sums to 1.0000001, so
  `#FFFFFF` computes to L\* = 100.0000039. Without the slack the most-picked colour in the
  product is unbanded.
- **Latent defect, now gated:** three.js picks tone mapping per render target, so the export
  path never inherits `renderer.toneMapping`. `update-render-fidelity-launch-gate` **must**
  set `RESOLVE_TONE_MAPPING` when it swaps the operator, or exports diverge from the screen
  by up to **ΔE00 11.46**. `resolveMatchesRenderer` fails on mismatch.
- CIEDE2000 hue-average branch is conformant to Sharma eq. 14, all four cases. The pre-fix
  error measured **< 2e-4 ΔE over 400 k random Lab pairs** — real but four orders below any
  threshold.
- `relativeLuminance` has one implementation, `lib/color-engine.ts`; `color-manifest` and
  `studio-control-tokens` re-export it. The WCAG-vs-IEC knee difference is provably
  unobservable for 8-bit input (no code value falls between 0.03928 and 0.04045).

### 7.2 Motion port fidelity — `add-motion-authoring-system/tasks.md §2`

Floors: `ANGLE_FLOOR_DEG = 0.25`, `DISTANCE_FLOOR_UNITS = 0.01`
(`lib/motion/port-deviation.ts:79,80`). All 5 moves PASS all 3 axes.

- **The catalogue residual is ONE constant: `7.5561e-3 × amplitude`**, identical for sine and
  cosine tracks (a cosine track is a phase-shifted sine over the same quarter shapes). All 15
  readings are that number scaled.
- **Headroom:** angle tracks conform up to **33.09°** amplitude (largest shipped 28°, sweep
  elevation, 85 % of budget); reach tracks up to **1.323** units (largest shipped 1.1, crane
  reach). Raising an amplitude past those breaks the port and fails
  `lib/motion/catalogue.test.ts` loudly.
- **A quarter of a sine is not approximated by a named curve, it IS one exactly**:
  `easeOutSine = sin(πx/2)` rising, `easeInSine = 1 − cos(πx/2)` falling. Sine tracks
  alternate that pair; cosine tracks use it reversed. The originally prescribed
  `easeInOutSine` has a **flat tangent at both ends** — right for motion resting at each
  keyframe, wrong for a smooth curve sampled mid-slope.
- Crane's second harmonic missed at **1.243°** vs the 0.25° floor. Tangent-matched béziers
  (`lib/motion/fit.ts`, cubic Hermite as an easing) cut it **15.7×** to **0.0792°** while
  **halving** the keyframe count to **9**.
- **Why a pristine track's curve row reads `Mixed`:** the shipped alternation is what makes
  the tracks exact sines. The inspector draws the first segment dashed and unifies every
  segment on the first drag — a real change of character, which is the spec's
  `linear → easeInOutSine` axis, not a rounding. When a shipped value is a **structure** and
  the control is a **scalar**, the honest readout is that they differ.

### 7.3 Turnaround curve — measured, and it killed the ledger's premise

The plan asked for "a bezier that matches today's smootherstep, so the default is a no-op".
The shipped turnaround is a **quintic** `x³(6x² − 15x + 10)` and a cubic bezier cannot be one
— a **degree mismatch, not a fitting failure**.

| Candidate | Phase error | Ruling |
|---|---|---|
| best zero-end-slope bezier (a = 0.49840) | 8.1312e-3 | not shipped |
| **shipped `[0.5, 0, 0.5, 1]`** | **8.6642e-3** | **+5.3e-4 for a readable tuple** |
| best unconstrained bezier | 2.3380e-3 (3.7× better) | **REJECTED ON MECHANISM** — end slopes −0.119, the camera backs up through the loop seam |
| tangent-matched track, 6 segments | clears the floor | rejected: a 7-keyframe time warp is not a curve anyone can drag |

**Y overshoot is expression on a value track and a defect on a time map.** That asymmetry is
now load-bearing twice. The default moves the camera under boomerang and **gates on the
owner**.

### 7.4 Turnaround readings are ENGINE-SPECIFIC

They reproduce exactly on the procedural generators and **shift** on the ported documents,
because the port residual displaces where the maximum sits.
`lib/motion/transport.test.ts` measures the procedural clip and says so at the assertion.

| Reading | Procedural | Ported |
|---|---|---|
| turntable azimuth | 3.1191 | 3.1191 (its port is exact) |
| sweep elevation | 1.3675 | 1.3627 |
| crane elevation | 1.3356 | 1.3225 |
| crane reach | 5.8340e-2 | 5.8687e-2 |

The pending engine swap moves these by exactly that much, and is **gated on the owner** at
0.2116°.

### 7.5 Gate readings, as last observed

Never quote these as current — re-run. They are here so you know what "green" looks like.

| Gate | Command | Last observed |
|---|---|---|
| unit tests | `pnpm test:unit` | PASS 1083/1083 across 67 files |
| types | `pnpm type-check` | PASS 0 errors |
| lint | `pnpm lint` | PASS 0 errors, 24 warnings repo-wide |
| colour manifest | `bun run scripts/validate-color-manifest.ts` | PASS 58/58 |
| fidelity sweep | `pnpm fidelity:measure` | PASS, envelope holds |
| board drift | `pnpm board:check` | PASS no drift |
| full gate | `pnpm validate` | PASS exit 0 |
| storybook tests | `pnpm storybook:test` | CANNOT RUN — `pnpm exec playwright install` missing. Environment gap, not a code failure. |

---

## 8. Colour — the attestation rules

**Attestation is a factual claim.** `scripts/color-manifest.json` attests *hardware*.

- A constant whose name asserts a generation **must read its hex from `authenticFinishes`**
  via `finishHex()`, never a typed literal. Two shipped constants had drifted onto the wrong
  generation's value. Examples: `IPOD_5G_BLACK = finishHex("black-5g")`,
  `IPOD_6G_SILVER = finishHex("silver-6g")` (`lib/color-manifest.ts:157,159`).
- **House colours are not attested and do not belong in the manifest.** They live in
  `lib/case-color-presets.ts` (`HOUSE_PRESETS:112`). `AuthenticPreset` vs `HousePreset` is a
  discriminated union — `CasePreset` (`:44`).
- **Never nudge a measured value to make a check pass.** Change the check, or rule the value
  house and say so *with its reading*.
- **A gate that checks only the passing case is not a gate.** The wheel-label contrast pair
  covered the dark wheel and not the light one; the label solver checked the gradient
  midpoint and not the ends. Both passed while shipping the defect they existed to catch.

Factory colours: `DEFAULT_SHELL_COLOR = #F2F2F2`, `DEFAULT_BACKDROP_COLOR = #FFFFFF`
(`color-manifest.ts:153,154`), `DEFAULT_BACK_COLOR = #cfd3d7`, `DEFAULT_BEZEL_COLOR = #0a0a0a`
(`model.ts:142,143`).

Wheel derivation: `deriveWheelColors(caseHex)` (`:398`), three colourways
(`WHEEL_COLORWAY_DARK/MID/LIGHT`, `:342,350,362`) selected by
`wheelColorwayForLuminance` (`:371`). `WHEEL_LABEL_CONTRAST_FLOOR = 3` (`:256`) —
**declared twice**, also at `lib/color-verdict.ts:159` which already imports the module. Ruled
short-term fix: make it a re-export.

Verdict model (`lib/color-verdict.ts`): `Grade = "exact" | "strong" | "workable" | "poor"`,
four axes `AxisId = "authenticity" | "headroom" | "undertone" | "legibility"`.
The shell-to-wheel check is measured as **undertone** (CIEDE2000 at `kL = 1e9`) — the
physically true question; the earlier "miss" was a mis-specified rule, not a bad token.

---

## 9. Enumerations — the closed vocabularies

Adding a member to any of these is a spec change, not an implementation detail.

| Type | Members | Home |
|---|---|---|
| `IpodViewMode` | `flat` `3d` `focus` `preview` `ascii` | `model.ts:11` (`FALLBACK_VIEW_MODE = "preview"`, `view-modes.ts:27`) |
| `IpodInteractionModel` | `direct` `ipod-os` `ipod-os-original` | `model.ts:12` (default `direct`) |
| `IpodHardwarePresetId` | `classic-2007` `classic-2008` `classic-2008-black` `classic-2008-silver` `classic-2009` | `model.ts:13`, data in `lib/ipod-classic-presets.ts` |
| `IpodOsScreen` | `menu` `now-playing` | `model.ts:20` (default `menu`, `DEFAULT_MENU_INDEX = 6`) |
| `BatteryMode` | `manual` `solar` | `model.ts:25` |
| `ColorTarget` | `case` `bg` `ring` `center` | `model.ts:85` (`MAX_SAVED_COLORS = 6`) |
| `SnapshotSelectionKind` | `moment` `range` | `model.ts:19` |
| `CameraMove` | `orbit` `robo` `turntable` `sweep` `crane` | `studio-camera.ts:88` |
| `SpotRole` | `key` `fill` `rim` | `studio-lighting-config.ts:72` |
| `FinishMaterialClass` | `polycarbonate` `anodized-aluminum` | `color-manifest.ts:29` |
| `TrackUnit` | `deg` `unit` | `track-edit.ts:41` |
| `SeamState` | `held` `seamless` `open` | `transport.ts:75` |
| `DisplayTransform` | `none` `neutral` | `color-fidelity.ts:42` |
| `Grade` | `exact` `strong` `workable` `poor` | `color-verdict.ts:32` |

Version stamps: `PORTABLE_STATE_VERSION = 1`, `SONG_SNAPSHOT_SCHEMA_VERSION = 2`,
`FINGERPRINT_VERSION = 2`.

---

## 10. Storage — one registry, do not re-derive it

The full key inventory (**22 keys across 3 naming conventions**) is recorded in
`openspec/changes/add-workspace-storage-registry/tasks.md`. Read it there. Do not grep for
keys and write a second list.

New keys follow the `ipodStudio*` convention (`ipodStudioThemes`, `ipodStudioMotions`,
`ipodStudioDefaultTheme`). Every key's read path heals (§5.1).

---

## 11. Surfaces — what "one product" means

Six routes, one model. A surface that needs state the model cannot hold is a spec question.

| Route | Identity | Entry component |
|---|---|---|
| `/` | The product. Direct-manipulation iPod, floating panels, app-wide `ipodCentralMachine` | `app/page.tsx` |
| `/3d` | The studio. 3D stage, lighting cockpit, motion inspector, export dock. Own reducer (§1a) | `components/ipod/scenes/ipod-3d-stage-client` |
| `/portfolio` | iPod-as-interface. Portfolio content, media via `public/portfolio` + `pnpm media:sync` | `app/portfolio/page.tsx` |
| `/3d-portfolio` | The two composed | `app/3d-portfolio/page.tsx` |
| `/whitelabel` | The white-label proof: one element, two brands, by swapping feed + theme tokens | `components/ipod/browser/whitelabel-demo` |
| `/dev` | Dev surface. Never linked from product chrome | `app/dev/page.tsx` |

---

## 12. What is NOT in the IR

Deliberate exclusions. Re-adding one needs a proposal.

- **Camera framing** — survives reload through camera-lock persistence (`LOCKED_POSE_KEY` in
  the stage), not the studio slice.
- **A default-motion pointer** — `IpodStudioState.motion` already persists the selected
  document; a second pointer would be drift.
- **Playhead / playing in any codec** — §5.5.
- **`overrides` in `docHash`** — §5.4.
- **Labels in `motionDocHash`** — a rename must not change an identity.
- **House colours in the manifest** — §8.
- **Any second hash, interpolator, or `relativeLuminance`** — §6, §3.1, §7.1.
