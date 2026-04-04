## ADDED Requirements

### Requirement: Provenance-Backed Primary Finish Library
The system SHALL present documented iPod-family finishes as the primary finish choices for the anniversary surface.

#### Scenario: Primary Finish Selection
- **GIVEN** the user opens finish settings
- **WHEN** they browse the primary finish library
- **THEN** the available options SHALL be sourced from documented iPod-family finishes with explicit labeling
- **AND** speculative or weakly sourced archive colors SHALL not dominate the primary path

### Requirement: Governed Neutral Surfaces
The system SHALL resolve shell, wheel, screen surround, and related neutral surfaces from a governed neutral token system rather than arbitrary inline values.

#### Scenario: Neutral Resolution
- **GIVEN** a neutral surface color is needed for live preview or export
- **WHEN** the finish system resolves the value
- **THEN** it SHALL come from the governed neutral scale
- **AND** the resulting hierarchy SHALL preserve intended white balance and material separation as closely as the medium allows

### Requirement: Least-Resistance Color Editing
The system SHALL make finish and background color editing fast and non-obstructive, especially on mobile and narrow viewports.

#### Scenario: Active Picker Workflow
- **GIVEN** the user opens a finish or background color picker
- **WHEN** they are choosing a color on mobile or a narrow viewport
- **THEN** the workflow SHALL minimize steps and keep the target iPod preview visible
- **AND** surrounding settings chrome SHALL yield rather than competing with the picker and preview
