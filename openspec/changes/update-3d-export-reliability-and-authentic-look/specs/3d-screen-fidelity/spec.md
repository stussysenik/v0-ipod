# 3d-screen-fidelity

## ADDED Requirements

### Requirement: The battery glyph SHALL have the authentic 3D gradient treatment

The status-bar battery SHALL reproduce the real iPod OS glyph: vertical body
gradient, top gloss highlight, capsule depth and correct cap geometry — at both
full and partial charge, and in charging state.

#### Scenario: Full battery reads dimensional

- **WHEN** the Now Playing screen renders at 100% battery
- **THEN** the battery shows the green body gradient with a lighter gloss band
  on its upper half, matching the reference glyph

#### Scenario: Partial battery keeps the treatment

- **WHEN** battery level is set to 40%
- **THEN** the filled region keeps the gradient + gloss treatment and the empty
  region shows the recessed track

### Requirement: Color controls SHALL drive their target surfaces

Every Color cockpit control SHALL update its target surface in the 3D render —
Case, Wheel, Center, Back, Edges, Bezel and Stage, via text input, color well
and related shades alike — and this wiring SHALL be verified by automated test.

#### Scenario: Setting a case hex updates the material

- **WHEN** the user enters `#B5121B` in the Case input
- **THEN** the 3D case material color equals `#B5121B` (asserted via test hook)

#### Scenario: No orphan controls

- **WHEN** the control-wiring audit test suite runs
- **THEN** every cockpit control has at least one assertion proving its effect
  on the rendered scene
