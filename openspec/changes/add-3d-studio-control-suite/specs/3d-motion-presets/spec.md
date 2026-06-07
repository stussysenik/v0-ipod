## ADDED Requirements

### Requirement: Additive, toggleable camera-move presets
Camera-move presets SHALL be additive — new moves are added alongside existing ones
(orbit, robo, turntable, sweep) and are selectable via a toggle, never replacing the
existing moves.

#### Scenario: Switch presets without losing existing ones
- **WHEN** the user switches the active camera-move preset
- **THEN** the new preset becomes active and all previously available presets remain selectable

### Requirement: MKBHD-style robotic crane move
The system SHALL provide a new robotic-crane camera move evoking motion-control product
b-roll (MKBHD-style), toggleable against the existing move set.

#### Scenario: Select the crane move
- **WHEN** the user selects the robotic-crane preset
- **THEN** the camera follows a smooth, mechanical crane path over the product

#### Scenario: Crane move loops seamlessly
- **WHEN** the crane move is exported as a looping clip
- **THEN** the loop seam is continuous (no pop or frozen opening), matching the other looping presets
</content>
