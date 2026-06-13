# Tasks: Export Proof Cache

## 1. Export fingerprint (pure, node-testable) — DONE
- [x] 1.1 `lib/export/export-fingerprint.ts`: `FINGERPRINT_VERSION`, `proofFingerprint`
  (anchor-frame subset = cache key) and `exportFingerprint` (full identity = provenance);
  `quantizePose`, `stableStringify`, `hashString` (FNV-1a, no Date/random). Plus
  `lib/export/proof-inputs.ts` — the single `selectProofInputs`/`selectExportSnapshot`
  source of the snapshot from model slices.
- [x] 1.2 `exportFingerprint(snapshot)` over canonical key-sorted JSON.
- [x] 1.3 Tests (`export-fingerprint.test.ts`, `proof-inputs.test.ts`): order-independence,
  per-input change sensitivity, pose-quantization stability, snapshot→proof-key identity,
  motion-only changes move export key but not proof key. (17 tests)

## 2. Proof cache store — DONE
- [x] 2.1 In-memory LRU `lib/export/proof-cache.ts` (`ProofLru` + `createProofStore`) holding
  `{ fingerprint, snapshot, blob, createdAt }`; pure recency = access order.
- [x] 2.2 IndexedDB blob store `lib/export/proof-cache-idb.ts`, bounded LRU-by-createdAt,
  no-op degrade when IndexedDB is unavailable.
- [x] 2.3 Read-through (memory → IDB → miss, warms memory) + write-through with mirrored
  eviction; non-bumping `peek` for the panel's per-frame read.
- [x] 2.4 Tests (`proof-cache.test.ts`): eviction, recency bump, peek non-bump, read/write-
  through, throwing-backend degrade. (8 tests)

## 3. Speculative pre-compute orchestration
- [x] 3.0 Single-flight queue primitive `lib/export/proof-render-queue.ts` (dedup, priority,
  suspend/resume, failure frees slot) + tests (`proof-render-queue.test.ts`, 6 tests).
- [x] 3.1 `useProofCache` hook (`lib/export/use-proof-cache.ts`): derives the current
  fingerprint from model+options, polls the live pose on a 300 ms idle clock, and enqueues a
  render once a key is stable. The WHEN-to-render policy lives in the pure, unit-tested
  `lib/export/proof-scheduler.ts` (stability gate, dedup, suspend, store-after-render).
- [x] 3.2 Suspend/resume wired to the export machine: the hook suspends the queue the instant
  `exporting` is true and resumes/drains when it returns to idle.
- [x] 3.3 Proof render adapter (`renderProof` in the stage): calls `captureHighRes` at the
  snapshot's hero pose + selected aspect's still dims, stored under the proof fingerprint.
- [ ] 3.4 Optional neighbor warming (other aspects, `hold`) at lower priority — intentionally
  deferred (spec marks it droppable; not needed for the core guarantee).

## 4. Persistent proof panel
- [x] 4.1 Right-rail `Ipod3DExportProofPanel` (`components/ipod/scenes/ipod-3d-export-proof-panel.tsx`)
  — a pure reader of `peek(currentFingerprint)`; never triggers a render.
- [x] 4.2 States: hit (instant + "Exact" stamp), miss (last frame dimmed + "computing…"),
  empty ("Composing…" first run). Object URLs minted per blob and revoked on change/unmount.
- [x] 4.3 Export spec line (aspect · quality · fps · duration · frame count) + docked
  "Export this proof" action; `hold` shows "still = whole clip" instead of a frame count.
- [x] 4.4 Mounted in the `/3d` right rail (06 Light → 07 Proof → 08 Export); inherits the
  same responsive one-tree/two-layout container, so it never overlaps the canvas.

## 5. Export provenance
- [x] 5.1 Extended `ExportRecord` with optional `{ fingerprint, snapshot }` (additive; legacy
  records show no thumbnail/re-open and cause no error).
- [x] 5.2 Clip export completion stamps `exportFingerprint` + the retained `ExportSnapshot`,
  re-attached locally so it survives a backend that drops unknown fields.
- [x] 5.3 History rows show the proof thumbnail, looked up by the record's *proof* key
  (re-derived from its snapshot, since the cache is keyed by the motion-excluded anchor key).
- [x] 5.4 "Re-open" restores the setup: `RESTORE_MODEL` for model state (via pure, tested
  `snapshotToModel`), lifted setters for aspect/quality/move/loop/speed/duration, camera goal
  for the pose. Round-trip proven: a restored model re-derives the same fingerprints.

## 6. Verification
- [x] 6.1 `bunx vitest run lib` green — 341 passing (+9: proof-scheduler, proof-restore).
- [x] 6.2 `bun run type-check` clean; lint 0 errors, no warnings on new/changed files.
- [ ] 6.3 Manual `/3d` pass (user visual check): idle pre-compute fills the panel; hit is
  instant; export anchor matches the proof; history shows thumbnail + re-open restores setup.
  **Watch item:** speculative `captureHighRes` runs on the live canvas during idle — confirm
  it doesn't visibly flash/hitch while composing (mitigated by snap-to-rest restore + the
  `enabled = !previewEngaged && !exporting` gate).
