## ADDED Requirements

### Requirement: Per-part inline related-shade suggestions
The color cockpit SHALL render, directly beneath each recolorable part row (Case, Wheel,
Center, Back, Bezel), a compact strip of harmonious shade suggestions derived from the
current device palette. Tapping a suggested shade MUST set ONLY that part's color, leaving
every other part unchanged. The Stage row is excluded (it is a backdrop, not a body part).

#### Scenario: Inline shades appear under a part row
- **WHEN** the user views the Case part row in the cockpit
- **THEN** a small strip of related shade swatches is shown directly beneath that row, derived from the current palette

#### Scenario: Tapping a shade recolors only that part
- **WHEN** the user taps a related shade under the Wheel row
- **THEN** only the wheel color updates (via `SET_RING_COLOR`) and the Case, Center, Back, Bezel, and Stage colors are left unchanged

#### Scenario: Current value is reflected
- **WHEN** a part's current color matches one of its suggested shades
- **THEN** that swatch is marked as the active/selected suggestion

### Requirement: Coordinated full-device combinations strip
The color cockpit SHALL provide a "Combinations" strip in which each chip previews the FULL
device palette — case, wheel, center, back, and bezel mini color dots — so the relationship
between parts is visible before selection. Tapping a chip MUST apply all parts together as one
coherent look, with the wheel and center re-derived from the case so the device remains a
single coherent object.

#### Scenario: Chip shows the full palette
- **WHEN** the user views a combination chip
- **THEN** the chip renders distinct mini-dots for case, wheel, center, back, and bezel, not a single swatch

#### Scenario: Tapping a chip applies all parts
- **WHEN** the user taps a combination chip
- **THEN** the case, back, bezel, and stage are set together and the wheel and center are re-derived from the new case so the whole device updates coherently in one gesture

#### Scenario: Active combination is reflected
- **WHEN** the current device palette matches a combination chip
- **THEN** that chip is marked as the active/selected combination

### Requirement: Shared deterministic harmony logic
Both the per-part related-shade suggestions and the coordinated combinations SHALL be produced
by shared color-harmony logic so that all choices are logically connected to the rest of the
device. The logic MUST reuse and extend the existing derivation (analogous/compatible hues,
controlled lightness separation, dark bezel grounding, and a stage chosen to separate the
silhouette). Inline suggestions MUST be deterministic: the same input palette MUST always
yield the same suggested shades.

#### Scenario: Suggestions are related to the current palette
- **WHEN** the case color changes to a new hue
- **THEN** the related-shade strips and the derived combinations update to shades that share or are analogous to the new hue with controlled lightness separation, not arbitrary colors

#### Scenario: Wheel and center stay coherent with the case
- **WHEN** related shades are generated for the Wheel or Center
- **THEN** they are produced via the existing case-to-wheel recession derivation so the wheel reads as the same material as the case

#### Scenario: Deterministic inline suggestions
- **WHEN** the cockpit re-renders without the palette changing
- **THEN** the inline related-shade strips show the identical set of shades (no per-render randomness)

### Requirement: Combinations and suggestions placed in proximity to the controls
The related-shade strips and the Combinations strip SHALL be placed in proximity to the
per-part controls so that related and coordinated choices read as part of the same control
cluster. Each related-shade strip MUST be visually attached to its owning part row, and the
Combinations strip MUST sit adjacent to the per-part rows rather than separated from them by
unrelated sections.

#### Scenario: Related strip attached to its part
- **WHEN** the user looks at a part row and its related-shade strip
- **THEN** the strip is visually attached to that row so it is clear which part the shades belong to

#### Scenario: Combinations adjacent to the rows
- **WHEN** the user views the Combinations strip
- **THEN** it appears adjacent to the per-part rows within the same control cluster, not isolated below unrelated helper actions
