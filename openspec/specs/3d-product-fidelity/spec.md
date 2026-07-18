# 3d-product-fidelity Specification

## Purpose
Governs the visual fidelity of the 3D iPod render: absolute per-surface colour precision, albedo-faithful materials under NoToneMapping, and no auto-generated outline artifacts on light finishes.
## Requirements
### Requirement: Absolute per-surface colour precision
The system SHALL render every individually-coloured surface — front face, wheel ring,
centre button, wheel well floor, back shell, and screen bezel — at its picked hex
faithfully. The system SHALL NOT apply a luminance floor, auto-lift, or fixed darkening
tint that prevents a chosen colour from reaching the screen. True `#000000` (full black)
and `#FFFFFF` (full white) MUST both be achievable on each surface. Natural directional
form-shading on faces turned away from the light is expected and does not count as a
failure to render the colour.

#### Scenario: Pure white is white
- **WHEN** the user sets a surface to `#FFFFFF`
- **THEN** the lit area of that surface renders as white (not a gray the env mirrors back)

#### Scenario: Pure black is black
- **WHEN** the user sets a surface to `#000000`
- **THEN** that surface renders as black (not lifted to gray by metalness/env or a luminance floor)

#### Scenario: All-white theme reaches the back
- **WHEN** the user sets case, wheel, centre, bezel, and back all to white
- **THEN** the entire device — including the back shell — reads as a clean white iPod

### Requirement: Albedo-faithful materials under NoToneMapping
Materials SHALL be albedo-dominant (low metalness and low environment-reflection
intensity) and the renderer SHALL use NoToneMapping, so the chosen albedo survives to the
pixel rather than being rolled off by a filmic tone curve or washed out by environment
reflections. The export path's colour resolve SHALL match this (linear → sRGB, no tone
curve, no vignette).

#### Scenario: Export colour matches live colour
- **WHEN** a surface colour is set and the device is exported
- **THEN** the exported surface colour matches the live view (no tone-curve darkening or lift)

### Requirement: No auto-generated outline artifacts on light finishes
The system SHALL NOT draw auto-derived darkening that reads as a stark "doodle"-like
outline (e.g. a darkened wheel-well groove ring, or an over-dark seam) on light/white
finishes. Surface boundaries that must exist (screen bezel, parting seam) SHALL be driven
by their own colour controls, not by a hard-coded dark tint.

#### Scenario: White wheel reads as one clean disc
- **WHEN** the wheel and its colours are set to white
- **THEN** no dark groove ring is drawn around the wheel; it reads as one clean disc

#### Scenario: Light theme has no stark forced lines
- **WHEN** the device is set to an all-white theme
- **THEN** no auto-darkened outline appears that the user did not set via a colour control

