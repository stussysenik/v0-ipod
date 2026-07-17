# 3d-shaped-light-compositions

## ADDED Requirements

### Requirement: Light compositions SHALL be per-pose declarative data

Each named camera pose SHALL have a named light composition — a softbox arrangement
shaped in reflection space to draw the highlights that pose is meant to describe
(e.g. chamfer rake for the hero ¾, horizon card for the back steel) — stored as data
in the lighting config, selected as a pure function of the active pose.

#### Scenario: Pose switch selects its composition

- **WHEN** the user switches from the hero ¾ pose to the back pose
- **THEN** the rendered rig uses the back pose's composition
- **AND** the selection function is covered by vitest as pure data

#### Scenario: User dials still override

- **WHEN** the user edits a lighting dial after a composition loads
- **THEN** the dial edit wins and lighting remains a pure function of (dials, pose)
  with no hidden coupling to finish color

### Requirement: Edge highlights SHALL travel continuously along fillets

Under any shipped composition, the specular highlight along a chamfer or fillet SHALL
read as one continuous line — no banding, faceting, or smearing — whether the cause
would be coarse fillet segments or a badly shaped environment.

#### Scenario: Chamfer sweep at the hero pose

- **WHEN** the device orbits slowly through the hero ¾ pose on a silver or black
  finish
- **THEN** the chamfer highlight moves as an unbroken line with no visible segment
  banding
