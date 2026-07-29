# Tasks — add-customizer-decision-log

Read `design.md` §3 (coalescing), §4 (two views) and §7 (the invariant) before starting. The
fold is **wrapped, never rewritten** — `ipodWorkbenchReducer` is this repo's most load-bearing
pure function and it is already correct.

**This change ships no pixels.** If a diff here moves one, it belongs in
`refactor-3d-control-surface-to-inspector`. That constraint is what keeps the keystone
reviewable while three other changes are mid-flight.

- [ ] 1. Model the decision. `lib/customizer/decision.ts`:
  - [ ] 1.1 `DecisionTarget` — a **closed union** derived from the model's addressable
        fields (case, wheel-ring, wheel-centre, back, edge, bezel, backdrop, lighting.*,
        camera, metadata.*). Stringly-typed keys are not acceptable: the layer projection and
        the commutativity rule both index on this.
  - [ ] 1.2 `Decision = { id, target, value, source: "preset" | "custom" | "measured", at }`.
        `source` is a factual claim about where the value came from, in the same sense the
        manifest attests hardware — it is what change three's provenance badge reads.
  - [ ] 1.3 `at` is supplied by the caller, never read from `Date.now()` inside the module,
        so the fold stays pure and unit-testable in the node project.
- [ ] 2. `foldDecisions(base, log)` — delegates each decision to `ipodWorkbenchReducer`.
- [ ] 3. `coalesce(log)` — the normalisation pass of `design.md` §3. Same target **and** same
      gesture window merge; a `preset` decision never absorbs into an adjacent `custom` one.
- [ ] 4. **The invariant, before any consumer.** Property test over randomised dispatch
      sequences: `foldDecisions(base, log)` deep-equals the model produced by dispatching
      those same actions through the bare reducer. Red first, then green.
- [ ] 5. `toLayers(log)` — `dedupeByTarget(keepLast)`. Test that disabling a layer resurfaces
      the prior decision on that target (the acceptance test for the projection, `design.md` §4).
- [ ] 6. Commutativity, pinned in **both** directions: reordering decisions on independent
      targets yields an identical model; reordering two on the same target does not.
- [ ] 7. `useDecisionLog(reducer, init)` → `[model, dispatch, log]`. Swap in at the sole host
      `components/ipod/scenes/ipod-3d-stage.tsx:112`. No downstream prop changes.
  - [ ] 7.1 Verify the debounced persistence at `:133` still lands the latest model — the log
        must not reintroduce the per-frame localStorage jank that debouncer exists to prevent.
- [ ] 8. Carry the log in the portable codec as an **optional** field. A v1 payload without a
      log must still decode (the codec's existing rule: malformed input yields null, absent
      input heals to default — never throw). Round-trip must stay byte-stable under
      `stableStringify`.
- [ ] 9. Attach the log to the export record so provenance answers *how*, not only *what*.
      `exportFingerprint` is unchanged — identity and derivation are separate claims and
      folding the log into the hash would bust every cached proof frame for no gain.
- [ ] 10. Green tree: `pnpm test:unit`, `pnpm type-check`, `pnpm lint`. Confirm `/3d` is
      pixel-identical to `main` — this change is invisible by construction, so any visual
      diff is a bug, not a feature.
