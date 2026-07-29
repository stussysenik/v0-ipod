# Tasks — add-finish-rig-pairing

Read `design.md` before starting, especially §D3. **Two of the three floors do not exist yet
and must be measured before they are stated.** Inventing a round number and confirming things
pass it is the failure mode this change is most exposed to, because a generated set that looks
full is indistinguishable from a correct one until someone checks the floor's provenance.

Blocked on `add-color-fidelity-verification` reaching 100% — its metrics are this change's
inputs.

- [ ] 1. **Defect first, before any new code.** `WHEEL_LABEL_CONTRAST_FLOOR = 3` is declared
      twice: `lib/color-manifest.ts:256` and `lib/color-verdict.ts:159`. `color-verdict`
      already imports from `color-manifest` (line 22) and redeclares the constant anyway, with
      a comment stating the manifest sets it. Make `color-verdict` re-export the manifest's
      constant. Same defect class as the `relativeLuminance` duplication already resolved on
      the board. A change premised on "one definition of each metric" cannot start with two.
- [ ] 2. `lib/look-pairing.ts` — the reading type and the scorer:
  - [ ] 2.1 `LookReading = { finishDelta, labelContrast: { low, high }, silhouette }`. Both
        gradient ends held separately; the verdict takes the worse. Do not collapse to one
        number at the point of measurement.
  - [ ] 2.2 `scoreLook(finish, rig, stage): LookReading` — pure. No clock, no storage, no
        renderer. Test that two calls with equal inputs are deep-equal.
  - [ ] 2.3 Each metric delegates to its owning module (`color-proximity`, `color-verdict`,
        `color-engine`). This change defines no new metric.
- [ ] 3. **Measure the `finishDelta` distribution.** Sweep the finish × rig product, record the
      ΔE00 of the lit case against each finish's attested hex, and write the distribution into
      this file — min, max, quartiles, and the pairings at each extreme. Read the floor off the
      distribution and record the reasoning beside the number.
  - [ ] 3.1 Record the result here so it is never re-derived, in the same form the fidelity
        envelope is recorded in `add-color-fidelity-verification/tasks.md`.
- [ ] 4. **Measure the `silhouette` floor.** Per `design.md` §D3, the floor is constrained
      before it is fitted: the black-on-dark pairings that "Edge Noir" was ratified for MUST
      pass, and the unlit black-on-dark case it was written to exclude MUST fail.
  - [ ] 4.1 Pin both constraint cases as tests *before* choosing the number.
  - [ ] 4.2 If no floor satisfies both, the metric is wrong, not the requirement. Say so and
        stop — do not widen until something passes.
  - [ ] 4.3 Record the number and its derivation here.
- [ ] 5. Floors module — all three as named constants, each with its source in a doc-comment:
      contrast inherited from the manifest, the other two from tasks 3 and 4. Test that every
      floor is attributable, per the spec scenario.
- [ ] 6. `namedLooks()` — sweep the registry product, keep what passes every floor.
  - [ ] 6.1 Derived, never transcribed. Test: adding a rig fixture extends the candidate set
        with no other edit.
  - [ ] 6.2 Test: a pairing failing any floor is absent from the set, and its reading names the
        failed floor and the margin.
  - [ ] 6.3 Test the manual path: a refused pairing selected by hand still applies.
- [ ] 7. Provenance, per the attestation rule:
  - [ ] 7.1 A look referencing an attested finish reads generation and year from the manifest
        at read time. It stores no copy.
  - [ ] 7.2 A house colour is labelled house, with no Apple product name. Reuse the existing
        `APPLE_PRODUCT_NAMES` guard from `lib/case-color-presets.ts` rather than a second list.
  - [ ] 7.3 Test that nothing in a look's presentation states the *pairing* shipped as a
        product.
- [ ] 8. Live reading on the surface:
  - [ ] 8.1 Extend the existing pre-gesture-value pattern at
        `ipod-3d-color-cockpit.tsx:322-325`. Do not introduce a second mechanism for the same
        idea.
  - [ ] 8.2 The reading updates during a drag and states current value plus direction from the
        pre-gesture value.
  - [ ] 8.3 A floor crossing is marked at the moment it occurs.
  - [ ] 8.4 Voice check: nouns and values only. No instruction, no recommendation, no second
        person. A reading that tells the user what to do fails the spec scenario.
- [ ] 9. Gates: `pnpm vitest run --project unit`, `pnpm validate` exit 0,
      `openspec validate add-finish-rig-pairing --strict --no-interactive`.
- [ ] 10. **USER:** the open question in `design.md` §D6 — refused pairings hidden, or shown
      greyed with their reading. Both satisfy the spec; it is a pixel decision.
- [ ] 11. **USER:** visual review of the named look set and the live reading.
