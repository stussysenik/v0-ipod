# Change: Reify the customizer's history as a decision log

## Why

`/3d` has state but no **document**. `IpodWorkbenchModel` is a blob that edits mutate in
place; every dispatch is folded and discarded. One absence, four symptoms:

- Nothing records that a *choice was made*, so there is nowhere for undo, "each edit is a
  layer", or "which decisions produced this export" to attach.
- An export carries a `exportFingerprint` — an identity — but no **derivation**. We can say
  two exports differ; we cannot say *how*.
- A share link (`portable-state.ts`) transmits a final state with no history, so a received
  look cannot be inspected, forked from a mid-point, or credited.
- The controls have no organising principle to be arranged *by*, which is why the surface
  grew into seven permanently-mounted cockpit cards.

The fix is not new machinery. `ipodWorkbenchReducer` is already a pure fold over ~60
serialisable action variants:

```
model = decisions.reduce(apply, base)
```

Keep the list instead of throwing it away, and history, layers, provenance, share links and
the export shelf stop being four features and become four **projections of one array**.

This is the keystone of a three-change arc for the iPod's 25th anniversary (23 Oct 2026) —
see `design.md` for the full narrative. It ships no pixels; it makes the next two possible.

## What Changes

- Add `lib/customizer/decision.ts`: a `Decision` record, a fold that **wraps** (never
  replaces) `ipodWorkbenchReducer`, a gesture-coalescing normalisation pass, and a layer
  projection.
- Add `useDecisionLog(reducer, init)` returning `[model, dispatch, log]`, swapped in at the
  single reducer host (`ipod-3d-stage.tsx:112`). Every downstream component keeps its props.
- Extend the portable-state codec to carry an optional log alongside the final state, so a
  share link can transmit derivation without breaking v1 payloads.
- Record the decision log against each export record so provenance answers *how*, not only
  *what*.

## Impact

- Affected specs: `customizer-decision-log` (ADDED). The payload and provenance requirements
  live there as additions rather than as MODIFIED deltas against `portable-customizer-state`
  and `3d-export-provenance`, because no existing requirement changes — the log rides
  alongside as an optional field, and both prior capabilities keep their contracts intact.
- Affected code: `lib/customizer/**` (new), `lib/ipod-state/portable-state.ts`,
  `lib/export/export-fingerprint.ts`, `components/ipod/scenes/ipod-3d-stage.tsx` (host only).
- Depends on: nothing. Deliberately first — it is pure library plus one host line, so it can
  land while `adopt-studio-control-language` is still in flight.
- Blocks: `refactor-3d-control-surface-to-inspector`, `add-community-state-gallery`.
- **No visual change.** If a diff in this change moves a pixel, it belongs in change two.
