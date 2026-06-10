# 3d-state-history

## ADDED Requirements

### Requirement: Studio dispatches SHALL be recorded in an append-only history tree

Every studio state change (color, lighting, camera, toggles) SHALL append a
node `{ id, parentId, timestamp, action, snapshotHash }` to a history tree.
Dispatching after an undo SHALL branch (undo-tree semantics) — history is never
destroyed, enabling provenance for every look.

#### Scenario: Branching preserves the abandoned path

- **WHEN** the user makes edits A→B→C, undoes to B, then makes edit D
- **THEN** the tree contains both B→C and B→D, and C remains reachable

#### Scenario: Every change is attributable

- **WHEN** any node is inspected
- **THEN** it exposes the action that produced it, its parent and its timestamp

### Requirement: History SHALL be persisted within a bounded budget

The most recent nodes (bounded, e.g. 500) SHALL persist across reloads in
local storage; persistence SHALL never block or slow dispatch.

#### Scenario: Reload keeps recent history

- **WHEN** the user reloads /3d after a session of edits
- **THEN** undo/redo and the recent-states list still work over the persisted
  window

### Requirement: History UI SHALL stay minimal

The surface SHALL expose undo, redo and a simple recent-states list — no graph
visualization in this change (useful and simple first).

#### Scenario: Undo from the cockpit

- **WHEN** the user activates Undo in the Studio cockpit
- **THEN** the studio state returns to the parent node and the render updates
