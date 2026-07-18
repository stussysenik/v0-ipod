# album-cover-realism Specification

## Purpose
TBD - created by archiving change surgical-album-cover-glass-realism. Update Purpose after archive.
## Requirements
### Requirement: LCD Glass Diffusion Over Artwork
The system SHALL render a glass diffusion layer over the album artwork on the Now Playing screen that simulates light passing through the glossy plastic LCD cover of the iPod Classic.

#### Scenario: Artwork reads as behind glass
- **GIVEN** the user views the Now Playing screen with artwork present
- **WHEN** the screen renders at normal viewing distance (1x or 2x device pixel ratio)
- **THEN** the artwork SHALL appear to be behind a glossy surface, not pasted as a bare image
- **AND** the diffusion SHALL NOT blur the image; artwork detail remains clear, sharp, and physically accurate. The layer SHALL only use a subtle glossy gradient reflection.

#### Scenario: Glass effect disabled during export
- **GIVEN** `exportSafe` is `true`
- **WHEN** the Now Playing screen renders in the export path
- **THEN** the glass diffusion overlay SHALL be suppressed
- **AND** the artwork and reflection SHALL render without glass diffusion gradient

### Requirement: Glossy Screen Reflection Below Artwork
The system SHALL render a sharp but rapidly fading reflection below the album artwork that mimics the screen surface catching ambient light.

#### Scenario: Reflection reads as surface gloss
- **GIVEN** the user views the Now Playing screen
- **WHEN** the reflection below the artwork is visible
- **THEN** the reflection SHALL NOT be blurred. It SHALL be sharp but use a short (≤30% of artwork height) alpha gradient to softly fade out
- **AND** it SHALL use object-fit: cover to prevent stretching when artwork is non-square

#### Scenario: Reflection scales with artwork size
- **GIVEN** the screen preset defines `artworkSize` as any value
- **WHEN** the component renders
- **THEN** the reflection height SHALL be computed as `Math.round(artworkSize × 0.30)`

### Requirement: Near-Invisible Artwork Edge
The system SHALL define the artwork boundary using a near-invisible hairline edge rather than a visible HTML border.

#### Scenario: Border is imperceptible at normal distance
- **GIVEN** the user views the Now Playing screen
- **WHEN** the artwork renders against the white screen background
- **THEN** the artwork edge SHALL be defined by a `boxShadow` hairline at ≤10% opacity
- **AND** it SHALL NOT use a visible `border` CSS property that reads as widget chrome

#### Scenario: Edge visible on close inspection
- **GIVEN** the user views the artwork at high zoom or high-DPI
- **WHEN** inspecting the artwork boundary
- **THEN** a subtle 1px edge at `rgba(0,0,0,0.07)` SHALL be perceptible
- **AND** it SHALL provide enough definition to separate artwork from the screen background

