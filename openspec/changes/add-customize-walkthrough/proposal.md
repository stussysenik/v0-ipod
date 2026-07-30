# Change: Customize is a walkthrough you can move back through

## Why

Customize currently means a wall of controls. Every control is available, nothing is sequenced,
and nothing records that you went anywhere. A car configurator sequences the same choices and is
easier to finish, for one reason: it tells you where you are and lets you go back without losing
what you did.

The machinery for this already exists and is unbuilt. `add-customizer-decision-log` establishes
that the model is a fold over a list of decisions — `model = decisions.reduce(apply, base)` — and
states outright that history, layers, provenance and share links are four projections of that one
array. It deliberately ships no pixels. **The walkthrough is those pixels**, and it is the last
piece of that design rather than a new idea.

`add-surface-node-tree` supplies the other half: a node path is a stable address, so a step is a
set of node paths and a decision names the node it changed. Nothing new is stored to make history
navigable — the log already holds it.

The failure to avoid is a wizard: a mode you must complete, in order, that hides the object while
you work. The configurator stays centre and live at every step, and every step is reachable
directly, so a returning visitor lands where they left rather than at step one.

## What Changes

- Declare steps as ordered sets of node paths. A step is data, so adding, reordering or splitting
  one is a data edit.
- Traverse forward and back with no loss: moving back does not discard forward work, and moving
  forward again restores it.
- Project the decision log as the visible history: what changed, at which step, in what order,
  with any point reachable.
- Keep the configurator centre and live at every step, and keep every control still reachable
  outside the walkthrough — the sequence is an offer, not a gate.

## Impact

- Affected specs: `customize-walkthrough` (ADDED).
- Affected code: `lib/customize/**` (new), the Customize mode subtree from `add-surface-node-tree`.
- Depends on: `add-customizer-decision-log` (the history), `add-surface-node-tree` (the addresses),
  `add-interface-motion-system` (step transitions read their duration from the motion module).
- Blocks: nothing.
- **Stores nothing new.** If this change adds a persisted shape, the log is not being projected —
  it is being duplicated, and the copy will disagree with the log within a week.
- **Not a wizard.** Every control stays reachable outside the sequence, and no step is required to
  reach any other. First meaningful edit needs no instruction and no prior state.
