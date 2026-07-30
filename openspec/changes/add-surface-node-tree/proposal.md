# Change: The surface is a tree of nodes, read at runtime

## Why

Two axes were being conflated. **Dimension** — 2D, 2.5D, 3D — is how the object is drawn.
**Mode** — Settings, Gallery, Customize — is what surrounds it. They are independent: every
mode is valid in every dimension, and the configurator sits in the centre of all nine states.
Held as one axis, that is nine hard-coded surfaces. Held as two, it is one tree with a swapped
subtree.

The tree has to be **data read at runtime**, not JSX, for the reason the owner asked for it:
experiment without breaking anything. A node expressed as data can be reordered, swapped or
compared against another node by editing data. The same node expressed as markup can only be
refactored, and a refactor is what puts the other eight states at risk.

Two things fall out that were being designed separately:

- **`add-customizer-decision-log` needs a stable name for what changed.** A node path —
  `customize/step:case/field:finish` — is that name. The tree and the history are one structure
  read two ways, so this is one design rather than two.
- **The duplicate panel registry Act 2 was going to retire has a replacement.** `panel-layout.ts`
  plus that registry are a half-version of this tree. This change owns their replacement;
  `refactor-3d-control-surface-to-inspector` keeps the cockpit-card retirement. Neither claims
  the other's half, and Act 2's ledger is amended here so it cannot.

## What Changes

- Add `lib/surface/node.ts`: a node descriptor carrying a stable path, the slice of the document
  it reads, and the commands it emits. A node reads its own slice and emits commands; it does not
  reach a parent or a sibling.
- Declare the three mode subtrees, and the configurator as one node present in all three.
- Replace `lib/ipod-state/panel-layout.ts` and the duplicate panel registry with the tree.
- Gate node-path stability: a path is an address other records cite, so renaming one without a
  migration is a broken reference, not a rename.

## Impact

- Affected specs: `surface-node-tree` (ADDED). `floating-panel-system` and `3d-control-surface`
  are read in §1.1 and their deltas written before any code — this change does not guess at them.
- Affected code: `lib/surface/**` (new), `lib/ipod-state/panel-layout.ts` (deleted),
  the panel registry (deleted), `components/ipod/scenes/**` (call sites).
- Depends on: `add-interface-motion-system` (its rows and reveals are what nodes render),
  `add-customizer-decision-log` (the log adopts node paths as an optional origin; the log itself
  depends on nothing and can land first).
- Blocks: `add-customize-walkthrough`, `refactor-3d-control-surface-to-inspector`.
- **Net deletion expected.** Nine surfaces' worth of arrangement becomes one tree plus three
  subtrees, and two registries leave. If the diff grows, the tree is holding behaviour that
  belongs in a node.
