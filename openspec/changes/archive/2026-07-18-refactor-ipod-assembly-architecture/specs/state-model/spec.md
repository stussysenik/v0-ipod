## ADDED Requirements

### Requirement: Canonical Snapshot Model
The system SHALL maintain one canonical snapshot-oriented domain model for metadata, playback, presentation, and interaction state.

#### Scenario: Reading App State
- **GIVEN** a contributor needs to understand the full logical state of the iPod
- **WHEN** they inspect the state model
- **THEN** the relevant metadata, playback, preset, and interaction fields SHALL be represented in one coherent domain model
- **AND** alternate views or modes SHALL derive from that model rather than define competing state shapes

### Requirement: Pure Update Layer
The system SHALL express state transitions through pure update functions rather than burying business rules inside presentation components.

#### Scenario: Applying A User Intent
- **GIVEN** a user action such as changing metadata, switching interaction mode, or adjusting playback state
- **WHEN** the app updates its state
- **THEN** the transition SHALL be represented by an explicit action and a pure state update
- **AND** the result SHALL be testable without requiring a component render
