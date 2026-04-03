## ADDED Requirements

### Requirement: Dual Interaction Models
The system SHALL provide both a direct authoring interaction model and an authentic iPod-style navigation model.

#### Scenario: Switching Interaction Models
- **GIVEN** the user is configuring the iPod experience
- **WHEN** they toggle the interaction model in settings
- **THEN** the interface SHALL switch between direct authoring controls and authentic iPod-style navigation behavior
- **AND** the underlying song and device state SHALL remain intact

### Requirement: Direct Mode Preserves Fast Authoring
The system SHALL keep a fast editing path for metadata, playback, and export preparation even when authentic navigation is also supported.

#### Scenario: Returning To Direct Authoring
- **GIVEN** the user has explored authentic navigation mode
- **WHEN** they switch back to direct authoring mode
- **THEN** they SHALL regain immediate access to editing and export-focused controls
- **AND** the system SHALL not require iPod-style navigation for basic authoring tasks
