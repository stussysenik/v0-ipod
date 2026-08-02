## MODIFIED Requirements

### Requirement: Dual Interaction Models

The system SHALL provide both a direct authoring interaction model and an authentic iPod-style
navigation model. On the spatial 3D surface the choice between them SHALL be made from the
summoned wheel rather than from a resident settings row; on panel-hosting surfaces it remains
where it is.

#### Scenario: Switching Interaction Models
- **GIVEN** the user is configuring the iPod experience
- **WHEN** they toggle the interaction model, from the wheel on the spatial surface or from
  settings elsewhere
- **THEN** the interface SHALL switch between direct authoring controls and authentic iPod-style
  navigation behavior
- **AND** the underlying song and device state SHALL remain intact

#### Scenario: The choice is not resident on the spatial surface
- **WHEN** `/3d` is idle
- **THEN** no interaction-model segmented control is rendered on the stage
- **AND** the current model is still readable from the wheel without changing it
