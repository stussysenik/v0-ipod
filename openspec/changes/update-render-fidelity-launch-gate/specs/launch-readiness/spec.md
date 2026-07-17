# launch-readiness

## ADDED Requirements

### Requirement: Public launch SHALL pass a golden-pose visual gate

Before the public/ProductHunt link ships, the render SHALL pass a documented
checklist over a golden matrix — every named camera pose × at least the black and
silver finishes — verifying screen integration, dark-finish separation, highlight
continuity, and absence of cross-layer artifacts, executed in a dedicated visual
session and recorded in the change.

#### Scenario: Gate blocks on a failing cell

- **WHEN** any golden-matrix cell fails a checklist item (e.g. wheel illegible on
  black at the hero pose)
- **THEN** the launch is blocked until the cell passes on re-check

#### Scenario: Gate is recorded

- **WHEN** the full matrix passes
- **THEN** the checklist result (date, poses, finishes, pass marks) is committed with
  the change as the launch evidence
