# design-system-foundation

## ADDED Requirements

### Requirement: Control chrome is user-owned but still solved

The control palette SHALL be a pure function of an explicit chrome specification — tint,
corner radius, density, and weight — rather than of the stage colour alone, and that
specification SHALL be settable by the user from Settings and persisted with their state.

The palette SHALL remain **solved, never authored**: the contrast floors that govern label
and accent tokens SHALL hold for every specification the user can express. Where a chosen
tint cannot carry a legible palette, the solver SHALL shade the surface away from that tint
until the floor is met, as it does today for stage colour. A chrome specification SHALL NOT be
able to produce control text or an accent below its floor, and no surface SHALL bypass the
solver by authoring a control colour directly.

Corner radius SHALL be consumed from the token, so that changing the specification restyles
every control and control-holding surface at once. A surface that hardcodes a radius is
outside the contract and SHALL be treated as a defect.

#### Scenario: A chosen tint restyles every surface

- **WHEN** the user sets a chrome tint in Settings
- **THEN** every studio control across the application takes its palette from the solved
  tokens for that specification

#### Scenario: Contrast floors hold for any specification

- **WHEN** any expressible chrome specification is solved
- **THEN** the resulting label token clears the text contrast floor and the accent token
  clears the non-text floor against the surface they sit on

#### Scenario: An illegible tint is shaded, not accepted

- **WHEN** a tint is chosen for which the primary ink cannot clear the text floor
- **THEN** the solver shades the surface away from that tint until the floor is met, rather
  than emitting a failing palette

#### Scenario: Radius flows from the specification

- **WHEN** the chrome specification's radius changes
- **THEN** controls and the surfaces that hold them re-corner concentrically, with no surface
  retaining a hardcoded radius
