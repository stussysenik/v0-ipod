# surface-node-tree

## ADDED Requirements

### Requirement: The surface is declared as runtime data

The surface's arrangement SHALL be declared as a tree of node descriptors evaluated at runtime,
and reordering, swapping or removing a node SHALL be an edit to that data rather than a change to
markup.

Every node SHALL carry a stable path, the slice of the document it reads, and the commands it
emits. A node SHALL read only its declared slice and SHALL NOT read or write a parent's or a
sibling's state.

#### Scenario: A node is swapped without touching another node

- **WHEN** one node in the tree is replaced by another with the same path
- **THEN** no other node's declaration or behaviour changes

#### Scenario: A node reaching outside its slice fails the gate

- **WHEN** a node reads or writes state outside its declared slice
- **THEN** the gate fails, naming the node and the state it reached

### Requirement: A node path is an address, and renaming one is a migration

A node path SHALL be stable, and SHALL be the name other records use to say what changed. A path
SHALL NOT be renamed without a migration that rewrites every stored reference to it.

A stored record citing a path that no longer exists SHALL be reported rather than silently
dropped, because a dropped reference makes a recovered version differ from the version it claims
to be.

#### Scenario: Renaming a path without a migration fails

- **WHEN** a node path changes with no migration for stored references to it
- **THEN** the gate fails, naming the old path and the records that cite it

#### Scenario: A dangling path is reported

- **WHEN** a stored record cites a node path that no longer exists
- **THEN** the surface reports the dangling reference rather than discarding it

### Requirement: Mode and dimension are independent axes

Mode — Settings, Gallery, Customize — SHALL be independent of dimension. Every mode SHALL be
valid in every dimension, and changing one SHALL NOT change the other.

A mode SHALL be one subtree of the surface tree. The configurator SHALL be one node present in
every mode's subtree, occupying the centre, and SHALL remain live in every mode rather than being
re-mounted per mode.

#### Scenario: Changing mode preserves dimension

- **WHEN** the visitor changes mode
- **THEN** the dimension is unchanged, and the configurator remains mounted and live

#### Scenario: Changing dimension preserves mode

- **WHEN** the visitor changes dimension
- **THEN** the mode is unchanged

#### Scenario: The configurator is declared once

- **WHEN** the three mode subtrees are read
- **THEN** the configurator appears as one node declaration, referenced by each, not copied into each

### Requirement: An empty surface shows its structure, not a sentence

A mode with nothing to list SHALL render its real structure with zero rows. It SHALL NOT render
explanatory prose, a description of its purpose, or any statement about future functionality.

#### Scenario: An empty mode renders zero rows

- **WHEN** a mode's collection is empty
- **THEN** the surface renders its title row and controls with zero entry rows, and no sentence
