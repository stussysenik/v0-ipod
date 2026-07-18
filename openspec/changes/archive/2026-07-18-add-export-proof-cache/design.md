# Design: Export Proof Cache

## Context

`/3d` export pixels are a pure function of their inputs (proven: `lib/theatre/theatre-parity.test.ts`,
`lib/theatre/keyframe-sampler.ts`). The Hero still path (`captureHighRes` in
`components/three/three-d-ipod.tsx`) already renders the **anchor frame** — phase 0, the
composed angle — through the exact offline pipeline an export uses (snap-to-rest, screen
bake, baked background, supersample, NoToneMapping). This change adds a caching and
provenance layer *around* that path; it does not touch the render itself.

## Goals / Non-Goals

**Goals**
- A cache hit is *provably* the final visual (content-addressed by the deterministic
  fingerprint), so the proof is a guarantee, not a guess.
- Proof is **ambient**, never a waited-on action: pre-computed on idle, read instantly.
- The fingerprint doubles as export provenance: know and re-open what you exported.

**Non-Goals**
- No multi-phase motion strip (later layer). Anchor frame only.
- No change to the export render pipeline, determinism, or output.
- No full-clip pre-computation (too heavy to speculate); only the single proof frame.

## Key Decisions

### 1. Fingerprint = stable hash of the pixel-determining input set
The fingerprint is computed from a normalized, key-sorted snapshot of exactly the inputs
that affect the anchor frame's pixels:

```
poseQuantized (az,el,reach,target — rounded to a stable precision)
move · loopStyle · speed
aspect · quality
metadata (title, artist, album, currentTime, duration, marquee, batteryLevel, osScreen)
presentation (skin, bg, ring, center, back, edge, bezel, hardwarePreset)
lighting (the studio rig signature)
```

Hashing is a pure function (FNV-1a / djb2 over the canonical JSON) — no `Date`/random, so
it is unit-testable in the node project and stable across reloads. We store the **full
snapshot alongside the hash** in the entry so provenance can restore the exact setup later
(the hash alone is one-way).

*Why quantize the pose:* sub-pixel pose jitter must not thrash the cache. Rounding to a
precision below visible change keeps neighboring micro-nudges on the same key.

### 2. Cache = in-memory LRU + IndexedDB blob store
- In-memory `Map` LRU (≈30 entries) holds `{ fingerprint, snapshot, blobUrl, createdAt }`.
- IndexedDB persists `{ fingerprint → { snapshot, pngBlob, createdAt } }`. Deterministic
  keys make persistence correct by construction: a hit after reload is still the right
  frame. Bounded (≈60 entries, LRU by `createdAt`).
- On miss in memory, check IndexedDB before rendering (a reload-warm hit is free).

### 3. Speculative pre-compute via a single-flight idle queue
- A `useProofCache` hook watches the current fingerprint. On change, after a 300 ms idle
  debounce, if the fingerprint is uncached it enqueues a render.
- The queue runs **one render at a time**. It is *suspended* whenever a real export bake is
  in flight (the export owns the camera + pauses the frameloop). The proof render uses the
  same `captureHighRes` entry point, so it transparently snaps-to-rest and restores.
- Optional warming (behind the same single-flight queue, lower priority): pre-render the
  other aspect ratios and `hold` for the current pose so switching is instant. Warming is
  best-effort and droppable under load.

### 4. The panel is a pure reader
The right-rail panel never triggers a render directly — it renders `cache[currentFingerprint]`.
Hit → instant, guaranteed-correct. Miss → previous frame dimmed + "computing…" until the
queue fills the slot. This keeps the "ambient, already-true" property: the UI shows state,
it does not perform work.

### 5. Provenance shares the store
The export-history record gains `{ fingerprint, snapshot, thumbnailFingerprint }`. The proof
frame already in the cache is the thumbnail. "Re-open" dispatches the stored snapshot back
into studio state (pose via the camera goal, plus metadata/presentation/lighting), restoring
the exact setup. Pre-export the store answers "what you'll get"; post-export the same key
answers "what you got."

## Risks / Trade-offs

- **Contention with a real export.** Mitigation: the idle queue is single-flight and
  suspended during capture; both paths funnel through `captureHighRes`, which already
  saves/restores camera + background, so they cannot interleave destructively.
- **Background render cost.** Mitigation: debounce + single-flight + only the anchor frame;
  warming is droppable. A proof render is one Hero-still's cost, amortized off the
  interaction path.
- **IndexedDB unavailability** (private mode, quota). Mitigation: the store degrades to
  in-memory only; the feature still works for the session.
- **Snapshot drift.** If a future input affects pixels but is omitted from the fingerprint,
  a stale hit could mislead. Mitigation: a single `fingerprintInputs(model, options)`
  selector is the *only* source of the snapshot, unit-tested to include every pixel input;
  a `FINGERPRINT_VERSION` constant busts the whole cache when the input set changes.

## Migration

Purely additive. Existing exports without a fingerprint render a neutral placeholder in the
history (no thumbnail, no re-open) — no migration of old records required.
