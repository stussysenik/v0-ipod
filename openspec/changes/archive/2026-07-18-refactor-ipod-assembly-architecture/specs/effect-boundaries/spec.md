## ADDED Requirements

### Requirement: Isolated Persistence And Export Effects
The system SHALL keep persistence and export orchestration outside visual leaf components.

#### Scenario: Saving Or Exporting
- **GIVEN** the user saves a snapshot or exports a PNG or GIF
- **WHEN** the app performs the operation
- **THEN** the side effect SHALL be coordinated through an explicit helper, adapter, or effect boundary
- **AND** scene, panel, and control components SHALL not own that orchestration logic directly

### Requirement: Intent-First View Components
The system SHALL prefer view components that dispatch intents over components that embed business-side effects inline.

#### Scenario: Editing A Display Scene
- **GIVEN** a contributor is modifying a scene or panel component
- **WHEN** they inspect how the component reacts to user input
- **THEN** the component SHALL primarily emit intents or callbacks describing the desired change
- **AND** side effects such as storage, click audio, or file handling SHALL remain at a higher boundary
