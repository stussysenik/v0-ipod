# Tasks: add-binocular-dimension-machines

## 1. Extract the focus

- [ ] 1.1 Inventory what `ipodCentralMachine` and `ipodWorkbenchReducer` each hold. Record the
  overlap and the disagreements here; this is the measurement no later task re-derives.
- [ ] 1.2 One document type owns the shared configuration. Neither existing model is deleted —
  each becomes a barrel reading the document. Deleting one is the merge this change exists to
  avoid.
- [ ] 1.3 Prove neutrality: 2D and 3D render identically before and after the extraction. A
  pixel move here is a defect in the extraction, not a consequence of it.

## 2. The barrel contract

- [ ] 2.1 Declare the contract in one module doc-comment: a barrel reads the focus and its own
  diopter, and imports no sibling. State the defect it prevents.
- [ ] 2.2 Import-graph gate: a barrel importing a sibling fails, naming both modules,
  transitively. The gate must fail on a deliberately broken tree before it is trusted.
- [ ] 2.3 Diopter as sparse override. Reuse the shape already proven four times; do not write a
  fifth. Test the clear-on-identity case, not only the store case — that is the half every prior
  instance got wrong.
- [ ] 2.4 Test that absorbing an override clears it in the same gesture. Fifth appearance.

## 3. Projection translation

- [ ] 3.1 One declared map per dimension pair. One map, not one per consumer.
- [ ] 3.2 Measure round-trip deviation per axis, following `lib/motion/port-deviation.ts`. Record
  every reading here with the axis it belongs to; never re-derive.
- [ ] 3.3 Set per-axis floors from §3.2. State which axis is nearest its floor and by how much —
  headroom is a fact, not a feeling.
- [ ] 3.4 Note whether the readings are engine-specific. The §3.4 turnaround readings in
  `add-motion-authoring-system` were, and the ledger failed to say so, which cost a session.

## 4. The 2.5D barrel — BLOCKED

- [ ] 4.1 USER: name the art-style reference. This is an input, not a decision, and it is the only
  thing this section waits on.
- [ ] 4.2 Orthographic projection over the existing geometry, constrained rig. Reuses the material
  path, so attestation, export parity and the proof cache carry over unchanged.
- [ ] 4.3 Pointer response as a low-amplitude motion document returning to the hero seam. Not a
  bespoke parallax layer — the catalogue already guarantees the seam.
- [ ] 4.4 Record its wire-byte and frame readings against the ceilings set by
  `add-artifact-budget-gates`. A third renderer that misses the budget is not shipped.

## 5. Amend the ratified spec

- [ ] 5.1 `surface-mode-switching` MODIFIED deltas land with this change, not after it. A shipped
  dimension axis against the unamended spec is the defect class ranked above the arc.
- [ ] 5.2 Confirm `browser-navigation` needs no delta: a route still names a reachable address.
  If it does need one, write it before any code.
- [ ] 5.3 Confirm `SHOW_3D_VIEW_MODE` stays off and the archived inline path stays unreachable.
  This change is not its resurrection.

## 6. Gates

- [ ] 6.1 `pnpm validate` exit 0, including the two budget gates; record readings in
  `tasks/state.json.gates`.
- [ ] 6.2 `openspec validate add-binocular-dimension-machines --strict --no-interactive`.
- [ ] 6.3 USER: visual review of all three dimensions, and of the dimension control itself.
