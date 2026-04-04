## ADDED Requirements

### Requirement: Curated Repository Surface
The system SHALL keep the repository root focused on active product code, active specs, and essential project entry points.

#### Scenario: Root-Level Hygiene
- **GIVEN** planning notes, research files, or archived experiments accumulate over time
- **WHEN** those files are not required as active root-level entry points
- **THEN** they SHALL be grouped into intentional documentation or archive locations
- **AND** the root SHALL avoid becoming the default landing zone for unrelated markdown and asset clutter

### Requirement: Documentation Categories
The system SHALL provide intentional categories for current documentation, planning, research, and archive material.

#### Scenario: Design Note Placement
- **GIVEN** a new design note or research artifact is added
- **WHEN** it is stored in the repository
- **THEN** it SHALL be placed in a category that communicates whether it is active guidance, planning work, research, or archive material
- **AND** the file location SHALL support discoverability without polluting the primary product surface
