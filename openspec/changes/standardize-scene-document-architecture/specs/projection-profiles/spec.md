## ADDED Requirements

### Requirement: Projection Profiles
The system SHALL separate semantic scene structure from context-specific layout and presentation rules by using projection profiles.

#### Scenario: Mobile and desktop share the same scene graph
- **WHEN** the interface is displayed on a mobile or desktop viewport
- **THEN** both contexts SHALL project from the same semantic scene document while applying different profile constraints

#### Scenario: Export presets are profile variants
- **WHEN** a user selects an export preset such as `product`, `square`, `portrait`, `story`, or `landscape`
- **THEN** the export framing SHALL be derived from a projection profile instead of a detached export-only state model

### Requirement: Deterministic Projection
The system SHALL derive render geometry and export geometry from the same projector contract for a selected profile.

#### Scenario: Authoring and export remain structurally aligned
- **WHEN** the same scene document is projected for interactive preview and for export capture
- **THEN** the structural node hierarchy SHALL remain consistent even if the profile changes spacing, scale, or framing

#### Scenario: Shared shell and stage projection
- **WHEN** shell or stage geometry is needed for preview and export
- **THEN** the system SHALL use a shared projection path rather than duplicating shell composition logic in separate render branches

### Requirement: Responsive Inspector Projection
The system SHALL allow the inspector to adapt layout by profile without changing its semantic grouping model.

#### Scenario: Mobile sheet reuses node inspector semantics
- **WHEN** the inspector is shown on a compact mobile viewport
- **THEN** it SHALL present the same scene-level and node-level sections as desktop, reordered or collapsed by profile as needed
