## ADDED Requirements

### Requirement: Render Style Union

The studio state SHALL expose a `renderStyle` of `"studio" | "flat" | "doodle"`, replacing the boolean `technicalFlat`. `"studio"` is the photoreal PBR pipeline; `"flat"` is the existing unlit technical-albedo view; `"doodle"` is the cartoon style. Persisted legacy state with `technicalFlat: true` SHALL migrate to `"flat"`; malformed values SHALL heal to `"studio"`.

#### Scenario: Legacy state migrates
- **WHEN** a persisted workbench blob containing `technicalFlat: true` is loaded
- **THEN** the studio slice hydrates with `renderStyle: "flat"` and the legacy key is not written back

#### Scenario: Style switches preserve state
- **WHEN** the user switches render style
- **THEN** camera pose, applied finish, and playback state persist; only the material/outline graph swaps

### Requirement: Doodle Style

The doodle style SHALL render every device part as unlit flat albedo of its finish color plus a black outline stroke around each part (case, back, edge band, wheel ring, wheel center, bezel), so adjacent parts — including same-hue parts — read with clear cartoon separation. The LCD content SHALL remain visible. The stage keeps the finish's stage color.

#### Scenario: Parts separate in doodle
- **WHEN** doodle style is active with a finish whose wheel ring matches the case hue
- **THEN** a black contour still separates wheel from case and center from ring

#### Scenario: Doodle exports
- **WHEN** the user exports while doodle style is active
- **THEN** the exported frame matches the live doodle canvas (outlines, flat colors, stage) exactly

### Requirement: Style Control

The control surface SHALL present render styles as a three-segment hairline control labeled in the studio's mono industrial voice (Studio / Flat / Doodle), with exactly one active segment, available without opening a disclosure.

#### Scenario: One-tap style change
- **WHEN** the user taps a non-active segment
- **THEN** the canvas swaps style within a single transition and the segment reflects the new active style
