# customize-walkthrough

## ADDED Requirements

### Requirement: A step is an ordered set of node paths, declared as data

Customize SHALL declare its steps as data: an ordered list, each step naming the node paths it
presents. Adding, reordering, splitting or removing a step SHALL be an edit to that data.

Every node path a step names SHALL exist, and a step naming a path that does not exist SHALL fail
the gate rather than render an empty step.

#### Scenario: Reordering steps is a data edit

- **WHEN** the step order changes
- **THEN** no node's declaration changes, and the walkthrough presents the new order

#### Scenario: A step naming a missing path fails

- **WHEN** a step names a node path that does not exist
- **THEN** the gate fails, naming the step and the path

### Requirement: Traversal is lossless in both directions and every step is reachable

Moving backward SHALL NOT discard work done at later steps, and moving forward again SHALL restore
it. Every step SHALL be reachable directly, without traversing the steps between.

A returning visitor SHALL land at the step they left, derived from the recorded history rather than
from a separately stored pointer.

#### Scenario: Backward then forward loses nothing

- **WHEN** the visitor moves back one or more steps and then forward again
- **THEN** every value set at the later steps is unchanged

#### Scenario: A step is reachable directly

- **WHEN** a step is selected without traversing intermediate steps
- **THEN** that step is presented with the current document

#### Scenario: A returning visitor resumes where they left

- **WHEN** the visitor returns to Customize after leaving it
- **THEN** the step presented is derived from the recorded history, with no separate stored pointer

### Requirement: The visible history is a projection of the decision log

The walkthrough's history SHALL be derived from the decision log at read time. It SHALL NOT
persist any record of its own.

The history SHALL state what changed, at which step, in what order, and every point in it SHALL be
reachable. A point reached from the history SHALL restore the document as it was at that point.

#### Scenario: History persists nothing of its own

- **WHEN** the walkthrough's history is read
- **THEN** it is derived from the decision log, and no walkthrough-owned record is persisted

#### Scenario: A history point restores its document

- **WHEN** a point in the history is selected
- **THEN** the document is restored to its state at that point, and the step containing it is presented

### Requirement: The configurator stays centre and live, and the sequence is not a gate

The configurator SHALL occupy the centre of Customize at every step and SHALL remain live — an
edit at any step SHALL be visible on the object without leaving the step.

Every control the walkthrough sequences SHALL remain reachable outside the sequence. No step SHALL
be required in order to reach another step, and no state SHALL be reachable only by completing the
walkthrough.

#### Scenario: An edit at any step is visible immediately

- **WHEN** a value is changed at any step
- **THEN** the configurator shows the change without a navigation or a confirmation

#### Scenario: Every control is reachable outside the sequence

- **WHEN** the visitor works outside the walkthrough
- **THEN** every control the walkthrough presents is still reachable, and every state remains attainable

#### Scenario: A first edit needs no prior state

- **WHEN** a first-time visitor opens Customize with no stored state
- **THEN** a meaningful edit is available immediately, with no instruction and no required step
