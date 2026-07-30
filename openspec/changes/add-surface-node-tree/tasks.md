# Tasks: add-surface-node-tree

## 1. Read before writing

- [ ] 1.1 Read `openspec/specs/floating-panel-system` and `openspec/specs/3d-control-surface`.
  Write any required MODIFIED deltas before any code. A guessed delta is worse than none.
- [ ] 1.2 Amend `refactor-3d-control-surface-to-inspector`'s ledger so the panel-registry
  retirement is claimed here and the cockpit-card retirement stays there. Two changes claiming one
  deletion is how a deletion happens twice or not at all.

## 2. The node

- [ ] 2.1 `lib/surface/node.ts` — path, document slice, commands. Doc-comment states the
  constraint: a node reads its slice and emits commands, and reaching a parent or sibling is what
  makes eight other states unsafe to change.
- [ ] 2.2 Gate: a node reading outside its declared slice fails, naming node and state.
- [ ] 2.3 Path stability gate: renaming a path without a migration fails, naming the citing records.
- [ ] 2.4 Dangling paths are reported, not dropped. A dropped reference makes a recovered version
  differ from the version it claims to be.

## 3. Two axes, one tree

- [ ] 3.1 Declare the three mode subtrees. Record the 60/30/10 split each mode uses; a mode that
  deviates states its ratio rather than improvising one.
- [ ] 3.2 The configurator is one node declaration referenced by all three subtrees, never copied.
  Test that it stays mounted across a mode change.
- [ ] 3.3 Test both independence directions: mode change preserves dimension, dimension change
  preserves mode. Checking one direction is the half-gate this repo has shipped twice.
- [ ] 3.4 Every empty mode renders zero rows and no sentence. A gate that only passes when prose
  exists is a defective gate.

## 4. Retire the half-version

- [ ] 4.1 Delete `lib/ipod-state/panel-layout.ts` and the duplicate panel registry; move their
  call sites to the tree.
- [ ] 4.2 Report the size: lines added, lines deleted, net, and concepts removed.

## 5. Gates

- [ ] 5.1 `pnpm validate` exit 0, including the budget gates; record readings in `tasks/state.json.gates`.
- [ ] 5.2 `openspec validate add-surface-node-tree --strict --no-interactive`.
- [ ] 5.3 USER: visual review of all three modes. This change moves every pixel of arrangement.
