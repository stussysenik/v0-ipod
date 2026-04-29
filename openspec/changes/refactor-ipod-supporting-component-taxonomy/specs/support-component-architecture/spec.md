## ADDED Requirements

### Requirement: Supporting Components Follow The Assembly Taxonomy
The system SHALL classify remaining iPod support components according to the same explicit architecture vocabulary used by the core workbench and display split.

#### Scenario: Locating A Shared Primitive
- **GIVEN** a contributor is looking for a support component such as the ASCII renderer, click wheel, progress bar, fixed editor, or image upload
- **WHEN** they inspect the repository
- **THEN** the component SHALL live under a category that reflects its architectural role such as `scene`, `control`, `editor`, or `export`
- **AND** remaining root-level placement SHALL be limited to documented compatibility shims or migration aids

### Requirement: Alternate Renderers Read As Display Concerns
The system SHALL treat alternate screen representations as display-scene concerns rather than unrelated one-off features.

#### Scenario: Working On ASCII Output
- **GIVEN** a contributor is modifying the ASCII representation of the iPod
- **WHEN** they inspect its ownership
- **THEN** the renderer SHALL read as a scene or alternate display mode within the broader assembly model
- **AND** it SHALL not be positioned as an unrelated top-level artifact
