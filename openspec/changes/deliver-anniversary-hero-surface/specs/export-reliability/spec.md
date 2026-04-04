## ADDED Requirements

### Requirement: Preview Export Parity
The system SHALL make exported PNG and GIF assets match the live hero preview in start state, timing, layout, and finish treatment as closely as the target medium allows.

#### Scenario: Still And Animated Capture
- **GIVEN** the user exports the anniversary hero surface
- **WHEN** the system captures a PNG or GIF
- **THEN** the exported asset SHALL preserve the same essential composition and marquee/progress timing expectations as the live preview
- **AND** the user SHALL not need to compensate for a different hidden export state

### Requirement: Artifact-Free Anniversary Output
The system SHALL avoid white rectangles, matte seams, and other capture artifacts that break the realism of the exported artifact.

#### Scenario: Clean Export Surface
- **GIVEN** the device is exported from `Flat` or `Preview`
- **WHEN** the resulting asset is inspected against light and dark surrounding contexts
- **THEN** the export SHALL avoid obvious alpha-matte or white-box artifacts
- **AND** the hero object SHALL remain visually intact and presentation-ready

### Requirement: Export Stability Under Stress Content
The system SHALL preserve legibility and composition under worst-case metadata in exported assets.

#### Scenario: Long Metadata Export
- **GIVEN** the content uses long title, artist, or album values
- **WHEN** the user exports PNG or GIF output
- **THEN** metadata SHALL remain legible within the intended composition
- **AND** the export SHALL not introduce layout drift that is absent from the live preview
