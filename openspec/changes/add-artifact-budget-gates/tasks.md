# Tasks: add-artifact-budget-gates

## 1. Declare the target

- [ ] 1.1 One module declares the target profile — T480s, Intel UHD 620, 1080p — and both gates
  read it from there. Two gates naming the same machine in two places is two homes for one fact.

## 2. Wire bytes

- [ ] 2.1 Measure transferred JS + CSS per route from the production build manifest, not from
  `.next/static` on disk. Record why in the module doc-comment: a disk total counts every route's
  chunks and its source maps, so it cannot answer what one visitor downloads.
- [ ] 2.2 Record the first reading for every route in this file. This is the number no later task
  re-derives, and the ceilings come from it.
- [ ] 2.3 Set per-route ceilings from §2.2 with no slack. A ceiling generous enough to pass a
  future miss is worse than no ceiling.
- [ ] 2.4 Gate fails naming route, reading, ceiling. Passes printing every reading.

## 3. Frames on the target

- [ ] 3.1 A deterministic scene walk: fixed camera path over a fixed configuration, driven by the
  same document engine the surface flies. Reuse `lib/state-fixtures.ts` for the configuration so
  the walk cannot drift from a state the app can actually reach.
- [ ] 3.2 Time it under a GPU profile matching UHD 620. Record the method and its limits — a
  profile is not the machine, and the gate's doc-comment says so rather than implying parity.
- [ ] 3.3 Record the first reading here. Set the frame budget from it.
- [ ] 3.4 Prove reproducibility: two runs, no intervening change, comparable readings. A gate
  whose readings scatter cannot attribute a regression to a diff.

## 4. Baked assets

- [ ] 4.1 Inventory what is currently shipped rather than generated, with each one's byte cost.
  Record the inventory here; do not re-derive it later.
- [ ] 4.2 Each entry states what its bytes bought, or is deleted.

## 5. Gates

- [ ] 5.1 Both gates join `pnpm validate`. Confirm the hook actually runs them — a gate hung off
  a command nobody can run is decoration, which has already happened once here.
- [ ] 5.2 `pnpm validate` exit 0; record readings in `tasks/state.json.gates`.
- [ ] 5.3 `openspec validate add-artifact-budget-gates --strict --no-interactive`.
