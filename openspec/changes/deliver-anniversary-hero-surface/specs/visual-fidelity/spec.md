## ADDED Requirements

### Requirement: Physical Object Realism
The system SHALL render the shell, screen surround, wheel, and center button as a restrained, physically believable iPod Classic front face.

#### Scenario: Front Face Read
- **GIVEN** the user views the device in `Flat` or `Preview`
- **WHEN** they judge the object at rest
- **THEN** the device SHALL read as a calm industrial product with disciplined proportions, radii, and surface transitions
- **AND** it SHALL avoid decorative effects that weaken the physical-product illusion

### Requirement: Touchable Control Presence
The system SHALL make the wheel and other primary controls look pressable and physically present on both desktop and mobile.

#### Scenario: Wheel And Button Tactility
- **GIVEN** the click wheel and center button are visible in the hero surface
- **WHEN** the user inspects or interacts with them
- **THEN** the controls SHALL communicate tactility through edge definition, inset relationships, shadow, and restrained highlights
- **AND** they SHALL not depend on diffuse glow or flat fill alone to imply depth

### Requirement: Stable Screen Composition
The system SHALL preserve the intended spatial relationship between artwork, metadata, counters, rating, and progress under worst-case content.

#### Scenario: Stress Metadata Composition
- **GIVEN** the song title, artist, or album exceeds nominal single-line width
- **WHEN** the `Now Playing` screen renders in the hero surface or export path
- **THEN** the overall composition SHALL remain legible and balanced
- **AND** overflow handling SHALL not collapse adjacent screen elements
