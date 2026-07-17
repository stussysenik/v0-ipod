# 3d-finish-material-response

## ADDED Requirements

### Requirement: Every finish SHALL clear a minimum environment-response floor

Device materials SHALL derive per-part parameters from a finish-aware table such that
no finish — including the darkest — renders as an unresponsive void: every part
returns visible environment response under the default rig.

#### Scenario: Black finish still describes its form

- **WHEN** the black finish is selected under the default lighting rig
- **THEN** the housing's chamfers and face show environment highlights that describe
  the form (not a flat silhouette)

#### Scenario: Table is unit-testable data

- **WHEN** the finish table is evaluated for any manifest color
- **THEN** it returns per-part material params satisfying the documented floor,
  verified by vitest without a GPU

### Requirement: Wheel, face, and ring SHALL stay visually separable on dark finishes

The click wheel, face plastic, and touch ring SHALL each keep a distinct specular
signature (distinct roughness/clearcoat/env response) so the wheel remains legible as
a separate part even when wheel and face share a near-black color.

#### Scenario: Black-on-black wheel legibility

- **WHEN** wheel and face are both near-black (#111 or darker) at the hero ¾ pose
- **THEN** the wheel's boundary and dish are readable from material response alone,
  without relying on the glyph labels
