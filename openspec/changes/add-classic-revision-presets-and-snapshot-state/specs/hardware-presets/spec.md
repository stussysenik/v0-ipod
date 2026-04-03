## ADDED Requirements

### Requirement: Documented Ipod Classic Revision Presets
The system SHALL expose documented iPod classic revision presets instead of treating the device as a single averaged front face.

#### Scenario: Selecting A Revision Preset
- **GIVEN** the user opens device settings
- **WHEN** they choose a supported iPod classic revision preset
- **THEN** the rendered device SHALL update to the geometry, finish defaults, and screen chrome defined for that preset
- **AND** the selected preset SHALL persist in saved state

### Requirement: Preset-Specific Geometry And Screen Chrome
The system SHALL allow each supported preset to define its own shell, wheel, screen, and line-weight characteristics.

#### Scenario: Rendering Distinct Presets
- **GIVEN** two different supported iPod classic presets
- **WHEN** the user switches between them
- **THEN** the device SHALL change in visible proportions or detailing where the references require it
- **AND** the system SHALL not flatten those differences into one compromise layout
