## ADDED Requirements

### Requirement: Provenance-Backed Ipod Finish Library
The system SHALL expose documented iPod family finishes before any broader Apple archive palette.

#### Scenario: Finish Selection
- **GIVEN** the user opens the finish settings
- **WHEN** the system lists available finishes
- **THEN** the first-class options SHALL represent sourced iPod family finishes with explicit labels and provenance metadata
- **AND** undocumented or speculative colors SHALL not be presented as authoritative iPod finishes

### Requirement: D65-Governed Neutral Surfaces
The system SHALL derive neutral whites and grays from a `dcal`-governed token system that respects D65 anchors and medium-aware mapping.

#### Scenario: Neutral Token Resolution
- **GIVEN** a shell, wheel, or backdrop surface uses a neutral token
- **WHEN** the color is resolved for live preview or export
- **THEN** the resolved value SHALL come from the governed neutral scale rather than an arbitrary inline hex
- **AND** export-target conversions SHALL preserve the intended white balance as closely as the target gamut allows

### Requirement: Least-Resistance Color Selection
The system SHALL make finish and background color selection easy to perform, especially on mobile and narrow viewports.

#### Scenario: Mobile-First Picker Flow
- **GIVEN** the user is choosing a finish or background color on a touch device or narrow viewport
- **WHEN** they open a color picker or related color-selection surface
- **THEN** the workflow SHALL minimize extra steps and preserve thumb-friendly interaction
- **AND** common color decisions SHALL remain reachable without forcing the user through multiple competing panels

### Requirement: Deferred Broad Apple Archive Colors
The system SHALL defer broader Apple archive color sets until provenance is documented.

#### Scenario: Unsupported Archive Palette
- **GIVEN** a requested Apple color does not have documented provenance for this phase
- **WHEN** the user explores finish options
- **THEN** that color SHALL be excluded from the primary library
- **AND** the change SHALL remain scoped to sourced iPod-family finishes first
