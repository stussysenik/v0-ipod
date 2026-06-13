# Change: Deterministic Export Proof Cache, Persistent Proof Panel, and Export Provenance

## Why

The `/3d` export is provably **deterministic** — the camera pose is a pure function of
its inputs, and the `theatre-parity` test pins our sampler to `@theatre/core`. So "exactly
how I set it is how I get it" is *true*. But the user can't **feel** it, for two reasons:

1. **Proof is a waited-on render.** Today, the only way to see export-fidelity pixels is
   to trigger a Hero still or run the clip — an on-demand offline render. A thing you wait
   for reads as a *guess*, not a guarantee. The distrust is structural: the proof is
   computed *when asked*, not already known.
2. **No record of what shipped.** After an export there is a `move · aspect · duration`
   history line, but nothing that says *what the frame actually looked like* or lets you
   return to the exact setup that produced it. "So I know what I exported" is unanswered.

Determinism makes both solvable with one idea: because export pixels are a pure function
of their inputs, the proof never needs to be computed at ask-time — it can be **content-
addressed and pre-computed**. A frame stored under its input fingerprint *is* the export,
not a preview of it. The same fingerprint that proves "what you'll get" before export
stamps "what you got" after it.

## What Changes

- **Export fingerprint** — a stable, deterministic hash of every input that determines the
  export pixels: hero pose (azimuth/elevation/reach/target), move, loop style, speed,
  aspect, quality, screen/metadata state (title/artist/album/time/marquee/battery),
  per-surface colors, and lighting. Same fingerprint ⇒ byte-identical export.
- **Proof cache** — a `fingerprint → offline proof frame` store rendered through the real
  export pipeline (the Hero `captureHighRes` path). In-memory LRU backed by an
  IndexedDB blob store, so deterministic keys make cross-reload persistence safely valid.
- **Speculative pre-compute** — when the studio goes idle (~300 ms after the last change),
  the current fingerprint's proof is rendered in a **background queue** (capped to 1
  concurrent, off the interaction path) so it is already present before the user looks.
- **Persistent proof panel** — a right-rail surface (not a transient confirm modal) that
  reads `cache[currentFingerprint]`: a hit shows instantly and is *guaranteed* to equal
  the export; a miss shows the last frame dimmed with a hairline "computing…" that resolves
  sub-second. The export spec (aspect · quality · fps · duration · frame count) and the
  Export action are docked with the proof they validate.
- **Export provenance** — each export record is stamped with its fingerprint and the cached
  proof thumbnail, so past exports are identifiable after the fact and **re-openable to the
  exact setup** (pose/move/aspect/colors) that produced them.

Scope guardrails: the proof frame is the **anchor frame (phase 0 = the composed angle)** —
fidelity is the only unproven gap; motion is already proven by the parity tests and the
live playhead. A multi-phase motion strip is explicitly a later layer, not in this change.

## Impact

- **New capabilities:** `3d-export-proof-cache`, `3d-export-proof-panel`,
  `3d-export-provenance`.
- **Affected code:** new `lib/export/export-fingerprint.ts`, `lib/export/proof-cache.ts`
  (+ IndexedDB blob store), a `useProofCache` orchestration hook, a right-rail panel
  component, and additive fields on the export-history record. Reuses the existing
  `captureHighRes` hero render path and the `studio-clip` sampler — no change to the
  deterministic render pipeline itself.
- **Risk:** background renders must never block interaction or contend with a real export
  bake (the export pipeline pauses the frameloop and owns the camera). Mitigated by a
  single-flight idle queue that yields to any in-progress export and is suspended during a
  capture. No change to export output; the cache only *observes* the pipeline.
