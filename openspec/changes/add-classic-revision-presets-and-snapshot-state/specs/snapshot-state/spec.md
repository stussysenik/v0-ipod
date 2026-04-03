## ADDED Requirements

### Requirement: Versioned Full-State Snapshot Contract
The system SHALL persist a versioned full-state snapshot format that captures metadata, playback, device preset, and render-affecting presentation state.

#### Scenario: Saving A Full Snapshot
- **GIVEN** the user saves the current iPod state
- **WHEN** the snapshot is serialized
- **THEN** the saved payload SHALL include song metadata, playback state, hardware preset, interaction model, and presentation-affecting settings
- **AND** the payload SHALL include a schema version so future migrations are possible

### Requirement: Moment And Range Capture
The system SHALL support saving either a single playback moment or a playback range.

#### Scenario: Saving A Playback Range
- **GIVEN** the user wants to preserve a meaningful excerpt rather than one instant
- **WHEN** they save a snapshot with a start and end time
- **THEN** the saved state SHALL preserve both boundaries
- **AND** restoring the snapshot SHALL recover that same range selection

### Requirement: Deterministic Restoration
The system SHALL restore a saved snapshot into the same logical device, playback, and export context.

#### Scenario: Reloading A Saved Snapshot
- **GIVEN** a previously saved snapshot exists
- **WHEN** the user loads it later
- **THEN** the restored state SHALL reproduce the same active preset, playback context, and presentation settings
- **AND** exports derived from that restored state SHALL begin from the same intended source state

### Requirement: Legacy Snapshot Migration
The system SHALL migrate the current legacy snapshot format into the canonical full-state model.

#### Scenario: Loading An Older Saved Snapshot
- **GIVEN** the browser still contains a snapshot saved in the older metadata-plus-ui format
- **WHEN** the app loads that snapshot
- **THEN** the system SHALL convert it into the current full-state structure using safe defaults for missing fields
- **AND** the user SHALL not lose their previously saved content
