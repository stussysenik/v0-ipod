## ADDED Requirements

### Requirement: Alpha-Safe Export Output
The system SHALL export PNG and GIF outputs without white-matte or rectangular compositing artifacts.

#### Scenario: Transparent Edge Preservation
- **GIVEN** the user exports a still or animated composition with rounded or transparent regions
- **WHEN** the file is encoded
- **THEN** transparent edges SHALL remain free of white rectangular artifacts
- **AND** the exported medium SHALL preserve the intended silhouette of the device and stage

### Requirement: Shared Preview And Capture Timing
The system SHALL use the same timing model for preview and animated capture when rendering marquee and progress motion.

#### Scenario: Marquee Consistency
- **GIVEN** a title overflows and activates marquee behavior
- **WHEN** the user watches the live preview and then exports an animated capture
- **THEN** the title SHALL start from the same visible state in both contexts
- **AND** the exported motion SHALL match the previewed motion closely enough to be perceived as the same animation

### Requirement: Worst-Case Metadata Robustness
The system SHALL remain stable under long title, artist, and album combinations in both still and animated exports.

#### Scenario: Long Metadata Export
- **GIVEN** a worst-case metadata fixture is active
- **WHEN** the user exports PNG or GIF output from a supported production surface
- **THEN** the layout SHALL remain legible and bounded
- **AND** the export SHALL not introduce clipping, overlap, or layout jumps that were absent from the live surface
