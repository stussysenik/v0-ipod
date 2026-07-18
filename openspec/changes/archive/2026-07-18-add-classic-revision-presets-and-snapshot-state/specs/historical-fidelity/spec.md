## ADDED Requirements

### Requirement: Source-Priority Visual Decisions
The system SHALL resolve revision geometry and UI details according to a documented source hierarchy.

#### Scenario: Conflicting References
- **GIVEN** two references disagree about a line weight, spacing relationship, or UI detail
- **WHEN** the team chooses an implementation target
- **THEN** Apple official product materials and manuals SHALL take precedence
- **AND** archival or anecdotal references SHALL only fill gaps where official material is insufficient

### Requirement: No Averaged Hybrid Device
The system SHALL avoid blending conflicting revision details into one hybrid device when preset-specific references exist.

#### Scenario: Preset Integrity
- **GIVEN** a supported preset has documented characteristics that differ from another preset
- **WHEN** the system renders that preset
- **THEN** the resulting device SHALL preserve those distinctions
- **AND** the UI SHALL not silently reuse a different preset's geometry as a convenience shortcut
