## ADDED Requirements

### Requirement: Industrial Surface Fidelity
The system SHALL render the iPod shell, screen, and wheel using restrained Apple-like geometry, spacing, and lighting rather than decorative studio chrome.

#### Scenario: Minimal Production Surface
- **GIVEN** the device renders in `Flat` or `Preview`
- **WHEN** the user views the primary editing surface
- **THEN** the composition SHALL avoid oversized editorial side rails, theatrical atmospheric overlays, and ornamental glow treatments
- **AND** the device SHALL remain the visual hero of the page

### Requirement: Physical Control Readability
The system SHALL make tactile controls feel physical through disciplined highlights, shadows, and edge treatment instead of diffuse aura effects.

#### Scenario: Click Wheel Tactility
- **GIVEN** the click wheel and center button render in a production surface
- **WHEN** the user inspects or interacts with the control area
- **THEN** the controls SHALL read as touchable physical parts through local contrast, shadow, and edge definition
- **AND** they SHALL not rely on floating glow or fake glass effects to imply depth

#### Scenario: Primary Button Touchability
- **GIVEN** a primary button or tappable control renders in the production interface
- **WHEN** the user judges whether it looks pressable on desktop or mobile
- **THEN** the control SHALL read as touchable and physically present through disciplined edge, highlight, shadow, or material separation
- **AND** it SHALL not feel visually flat relative to the rest of the device and controls

### Requirement: Stable Screen Information Layout
The system SHALL preserve a stable internal screen grid under worst-case metadata.

#### Scenario: Long Metadata Stress Case
- **GIVEN** a title, artist, or album string exceeds the nominal single-line width
- **WHEN** the `Now Playing` screen renders
- **THEN** the artwork, metadata lanes, counter, rating, and progress region SHALL keep their intended spatial relationship
- **AND** overflowing text SHALL not collapse the rest of the screen composition
