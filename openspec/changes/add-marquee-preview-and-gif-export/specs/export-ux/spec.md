## ADDED Requirements

### Requirement: Preview-Mode Animated GIF Export
The system SHALL provide a dedicated animated GIF export action for Preview Mode that captures the full flat iPod frame with the now-playing marquee in motion.

#### Scenario: Preview mode exports a full-frame GIF
- **WHEN** the user switches to Preview Mode
- **AND** starts an animated export
- **THEN** the system SHALL generate a `.gif` download of the full flat iPod composition
- **AND** the title marquee SHALL follow the same timing profile as the live preview

#### Scenario: Flat PNG export remains unchanged
- **WHEN** the user is in Flat View
- **AND** starts the existing still export
- **THEN** the system SHALL continue to generate a `.png` export using the current deterministic flat-image pipeline

### Requirement: Animated Export Feedback
The system SHALL surface animated-export progress distinctly from still-image export so the user understands when GIF rendering is still encoding.

#### Scenario: GIF export enters encoding state
- **WHEN** animated GIF export starts
- **THEN** the system SHALL show a preparing state followed by an encoding state before success or error

#### Scenario: GIF export resets interaction chrome
- **WHEN** animated GIF export starts
- **THEN** toolbox and settings panels SHALL be closed before capture begins

### Requirement: Animated Export Traceability
The system SHALL keep animated exports aligned with existing filename traceability conventions.

#### Scenario: GIF filenames include incremental export ids
- **WHEN** a GIF export succeeds
- **THEN** the downloaded filename SHALL include the next incremental export identifier
- **AND** use the `.gif` extension
