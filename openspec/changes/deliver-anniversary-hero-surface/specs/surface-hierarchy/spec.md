## ADDED Requirements

### Requirement: Hero Surface Priority
The system SHALL treat `Flat` and `Preview` as the only primary anniversary surfaces in this phase.

#### Scenario: Mode Hierarchy
- **GIVEN** the mode selector or surrounding interface lists available views
- **WHEN** the user scans those choices
- **THEN** `Flat` and `Preview` SHALL appear as the clearly primary options
- **AND** their copy, placement, and affordances SHALL identify them as the polished surfaces

### Requirement: Experimental Mode De-Emphasis
The system SHALL keep `3D`, `Focus`, and `ASCII` available without implying they match the fidelity of the hero surfaces.

#### Scenario: Secondary Mode Disclosure
- **GIVEN** a user sees or activates `3D`, `Focus`, or `ASCII`
- **WHEN** those modes render
- **THEN** the interface SHALL disclose that they are experimental or in progress
- **AND** the UI SHALL avoid giving them equal production emphasis to `Flat` and `Preview`

### Requirement: Yielding Editing Chrome
The system SHALL reduce competing tabs, rails, drawers, or large settings panels when a high-focus editing control is active.

#### Scenario: Picker Focus State
- **GIVEN** a finish or background color picker is active
- **WHEN** the user needs room to evaluate the preview while editing
- **THEN** surrounding settings chrome SHALL collapse, yield, or otherwise reduce competition for space
- **AND** the target device preview SHALL remain visible enough for confident color selection
