# workspace-storage-registry

## ADDED Requirements

### Requirement: One declaration per persisted key

Every key the application writes to browser storage SHALL be declared once, in a single
registry module, carrying its key string, the module that owns it, and its class. No key
string SHALL be written as a literal anywhere else in the codebase; owning modules SHALL read
their key from the registry.

Each key SHALL be classed as `settings` (user intent that outlives a reset), `content` (the
current document), `cache` (derived or advisory data), or `legacy` (read for migration only).

#### Scenario: A key literal outside the registry fails the build

- **WHEN** a browser-storage key literal appears in application source outside the registry module
- **THEN** the gate fails and names the offending file and key

#### Scenario: Every declared key states its owner and class

- **WHEN** the registry is read
- **THEN** every entry carries a key string, an owning module, and one of the four classes

#### Scenario: No two entries share a key string

- **WHEN** the registry is read
- **THEN** every key string appears exactly once

### Requirement: The workspace can be returned to factory

The system SHALL provide a single operation that returns the workspace to the state a
first-load visitor sees. It SHALL clear every `content` and `cache` key, SHALL sweep every
`legacy` key, and SHALL clear `settings` keys only when explicitly asked. It SHALL report the
keys it cleared.

Reset SHALL be reachable from the surface, and SHALL confirm before clearing, naming what will
be cleared. After a reset the studio SHALL show the default look without requiring a reload.

#### Scenario: Reset produces a fresh-boot state

- **WHEN** the workspace is reset after arbitrary edits, saved themes, and exports
- **THEN** no `content` or `cache` key remains in storage, and the studio shows the default look

#### Scenario: Settings survive a content reset

- **WHEN** the workspace is reset without the setting scope requested
- **THEN** keys classed `settings` retain their values and keys classed `content` do not

#### Scenario: Reset reports what it cleared

- **WHEN** a reset completes
- **THEN** it returns the list of keys removed, and the confirmation shown beforehand named the same scope

#### Scenario: Reset is confirmed before it runs

- **WHEN** the reset command is invoked from the surface
- **THEN** nothing is cleared until the action is confirmed

### Requirement: Legacy keys are swept, not merely ignored

A key classed `legacy` SHALL be removed from storage once its value has been migrated, so that
migrated data is not carried indefinitely. Migration SHALL remain tolerant of the key being
absent.

#### Scenario: A migrated legacy key is removed

- **WHEN** a legacy key is read and its value migrated into the current key
- **THEN** the legacy key is removed from storage and the migrated value is intact

#### Scenario: Absent legacy keys are not an error

- **WHEN** migration runs with no legacy keys present
- **THEN** it completes without error and removes nothing

### Requirement: The device's states are enumerable

The system SHALL declare its named device states as data — at minimum a fresh state, the
default look, one state per hardware preset, and one carrying a hand-tuned rig. Tests and
component stories SHALL render from that declaration rather than constructing states by hand,
so a state added to the list is covered everywhere without further edits.

#### Scenario: Adding a state extends coverage without further edits

- **WHEN** a new named state is added to the declaration
- **THEN** the state matrix story and the state-coverage test include it with no other change

#### Scenario: Every named state renders

- **WHEN** the state matrix is rendered
- **THEN** every declared state produces a device without error

#### Scenario: The fresh state is genuinely fresh

- **WHEN** the fresh state is constructed
- **THEN** no `content` or `cache` key declared in the registry is present
