## ADDED Requirements

### Requirement: Production Surface Priority
The system SHALL treat `Flat` and `Preview` as the only polished production surfaces in this phase.

#### Scenario: Mode Selector Hierarchy
- **GIVEN** the mode selector renders
- **WHEN** the user scans available modes
- **THEN** `Flat` and `Preview` SHALL appear as the primary options
- **AND** their copy, ordering, and affordances SHALL communicate that they are the export-ready surfaces

### Requirement: Experimental Mode Disclosure
The system SHALL keep `3D`, `Focus`, and `ASCII` accessible while clearly identifying them as in-progress.

#### Scenario: Experimental Mode Labeling
- **GIVEN** the selector lists `3D`, `Focus`, or `ASCII`
- **WHEN** the user views or activates those modes
- **THEN** each mode SHALL display a clear `WIP` or `Experimental` treatment
- **AND** the surrounding UI SHALL not imply those modes have the same production quality or export guarantees as `Flat` and `Preview`

### Requirement: Active Tool Local Disclosure
The system SHALL reduce competing settings chrome when a high-focus control such as a color picker is active.

#### Scenario: Color Picker Focus State
- **GIVEN** a color picker is opened from the settings surface
- **WHEN** the active picker needs visual attention or unobstructed preview space
- **THEN** surrounding tabs, rails, drawers, or large panels SHALL yield space rather than competing for attention
- **AND** the UI SHALL favor visibility of the target device preview over persistent settings chrome while the picker is active
