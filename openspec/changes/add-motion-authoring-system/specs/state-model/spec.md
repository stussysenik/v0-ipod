## ADDED Requirements

### Requirement: Motion SHALL be a slice of the canonical model, not component state

The authored motion SHALL live in the canonical workbench model's studio slice: the document
identity, its sparse overrides, the repeat count, the clip duration, the time map and the
playhead. No motion parameter SHALL be owned by component-local state, so that persistence, share
links, the decision log and the export snapshot are all projections of one value rather than
four separate wirings.

#### Scenario: Motion survives a reload

- **WHEN** the user authors a motion document and reloads `/3d`
- **THEN** the same document, repeat count, duration and time map are restored

#### Scenario: There is one motion owner

- **WHEN** the motion is changed from any surface
- **THEN** every surface that displays it reflects the change, because all of them read the same
  model slice

### Requirement: A motion SHALL be stored by identity plus sparse overrides

A selected motion SHALL be stored as a catalogue or user-document id together with only the
per-track fields the user has changed. Storing a catalogue document by value SHALL NOT be used,
because it forks the catalogue; storing by id alone SHALL NOT be used, because it discards
tuning. A user-authored document SHALL receive its own id and be stored whole.

#### Scenario: A catalogue improvement reaches a tuned look

- **WHEN** a shipped motion document is improved and a saved look referenced it with overrides
  on one track
- **THEN** the saved look picks up the improvement on every track it did not override

#### Scenario: Tuning survives a save

- **WHEN** the user overrides a track's easing and saves the look
- **THEN** re-opening the look restores that override, not the catalogue default
