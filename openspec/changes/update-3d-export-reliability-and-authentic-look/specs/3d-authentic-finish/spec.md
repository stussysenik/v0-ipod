# 3d-authentic-finish

## ADDED Requirements

### Requirement: Default combinations SHALL be the authentic iPod lineup

The COMBINATIONS strip SHALL list only finishes Apple shipped — sourced from
`scripts/color-manifest.json` `authenticFinishes` (Silver/Black 6G and 7G,
White/Black 5G, U2 Special Edition, (PRODUCT) RED, Charcoal 7G) — each carrying
its generation-correct case color, wheel variant (light/dark) and material
class. Non-authentic concept looks SHALL NOT appear among defaults.

#### Scenario: Applying the Black 6G combination

- **WHEN** the user taps the Black 6G combination
- **THEN** case `#1c1a1b` deep black anodized aluminum, dark wheel variant,
  factory stainless back and matte bezel are applied together

#### Scenario: Defaults contain no fantasy colors

- **WHEN** the Color cockpit renders its default combinations
- **THEN** every entry corresponds to a real shipped iPod finish

### Requirement: Materials SHALL span the full authentic metallic range

Each finish SHALL map to physically grounded material parameters by class:
anodized aluminum (brushed roughness map, low metalness, restrained clearcoat
and env intensity), polished stainless back (metalness 1.0, roughness ≥ 0.13
floor), and 5G-era polycarbonate (dielectric gloss, no brush). Constants
recovered from git history (`feature/ipod-3d-focus` black anodized values,
moonbit-version silver assembly wheel gradients) SHALL be ported as data.

#### Scenario: Silver 6G reads as brushed aluminum

- **WHEN** the Silver 6G finish renders under the Apple rig
- **THEN** the face shows brushed anisotropic-feeling aluminum (not plastic,
  not mirror), and the back reads as polished steel

### Requirement: Edge color SHALL be constrained to the case color family

Preset and derived edge (chassis side) colors SHALL be derived from the case
color via perceptual (OKLCH) shading so a black body never ships with white
edge lines and vice versa. The manual Edges control remains free, but
derivation and presets SHALL respect the constraint.

#### Scenario: Black case derives dark edges

- **WHEN** the case is set to `#1b1818` and edges are derived
- **THEN** the edge color is a near-case dark shade, not white/silver

### Requirement: The realistic render SHALL NOT paint outline strokes

Contour definition in the realistic render SHALL come from lighting only.
Painted dark outline strokes SHALL be removed from the realistic path and
SHALL only appear under the Cartoon toggle.

#### Scenario: Realistic black device has no cartoon lines

- **WHEN** a black device renders with Cartoon off
- **THEN** no painted outline strokes are visible; silhouette separation comes
  from rim light and stage contrast

### Requirement: A decoupled Cartoon toggle SHALL provide the cel-shaded look

A `cartoon` boolean SHALL exist as its own state key (own persistence, own
history entries), independent of finish and lighting. When on, the render
SHALL commit fully to a cel treatment (bold outlines, flattened shading).

#### Scenario: Toggling cartoon does not touch finish state

- **WHEN** the user enables Cartoon and then disables it
- **THEN** finish, lighting and camera state are byte-identical to before

### Requirement: Shade derivation SHALL use OKLCH

Related-shade strips, wheel derivation and edge derivation SHALL compute in
OKLCH for perceptually even ladders, preserving chroma on saturated cases and
avoiding crush on near-black cases.

#### Scenario: Near-black case still yields distinct shades

- **WHEN** related shades are derived for case `#0c0b0b`
- **THEN** the strip contains visually distinguishable steps (no duplicate
  blacks), monotonically ordered in perceptual lightness
