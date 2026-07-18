# 3d-control-surface Specification

## Purpose
Governs the /3d studio control surface: controls take visual focus over the device and lay out responsively without overlap, with preview transport kept distinct from export settings.
## Requirements
### Requirement: Controls take visual focus over the device
The control surface (HUD panels, cockpits, bottom bar, command surface) SHALL render
ABOVE the iPod canvas with a clear, consistent z-order so the controls always have focus
priority over the 3D device. Controls SHALL remain interactive (pointer events reach them,
not the canvas behind) and SHALL never be occluded or clipped by the canvas.

#### Scenario: Panels sit above the canvas
- **WHEN** a control panel overlaps the device region on screen
- **THEN** the panel renders on top of the device and receives clicks/taps, not the canvas

#### Scenario: Controls keep focus while the device animates
- **WHEN** the device is animating or being orbited
- **THEN** the controls stay visible and on top, never hidden behind the render

### Requirement: Non-overlapping, responsive control layout
The control surface SHALL be web-responsive and lay out without panels overlapping each
other or overwhelming the viewport at any width. It SHALL use the available space (corner
HUD on wide viewports, a collapsing sheet on narrow viewports) so the tool never feels
unusable on a given screen size.

#### Scenario: Wide viewport
- **WHEN** the viewport is wide
- **THEN** control groups occupy the corners without overlapping each other or the device focal area

#### Scenario: Narrow viewport
- **WHEN** the viewport is narrow
- **THEN** controls collapse into a scrollable sheet that does not overlap the device and remains fully reachable

#### Scenario: No panel collision at intermediate widths
- **WHEN** the viewport is resized across the breakpoint range
- **THEN** no two control panels overlap and no panel is clipped off-screen

### Requirement: Distinct preview transport vs export settings
The live preview transport (play / scrub / reset) SHALL be visually distinct from the
export settings (aspect / quality / length / motion / speed) so the user can tell at a
glance what is a live control versus an export parameter.

#### Scenario: Preview and settings are visually separated
- **WHEN** the user views the export dock
- **THEN** the preview transport is clearly delineated from the export settings (grouping/labeling), not intermixed

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

### Requirement: Colour controls accept multiple typed notations

Every colour control in the 3D studio SHALL accept typed colour input in multiple common
notations — hexadecimal (`#rgb` and `#rrggbb`), `rgb()` / `rgba()`, and `hsl()` / `hsla()` —
in addition to the native colour-swatch picker. The user MUST be able to paste or type a
colour in any of these notations and have it applied to the corresponding surface or light.

#### Scenario: Typed hex is accepted
- **WHEN** the user types a valid hex value (e.g. `#1a2b3c` or shorthand `#abc`) into a colour control and commits it
- **THEN** the control applies that colour and the device/light updates accordingly

#### Scenario: Typed rgb() is accepted
- **WHEN** the user pastes an `rgb(...)` or `rgba(...)` value into a colour control and commits it
- **THEN** the control parses it and applies the equivalent colour

#### Scenario: Typed hsl() is accepted
- **WHEN** the user pastes an `hsl(...)` or `hsla(...)` value into a colour control and commits it
- **THEN** the control parses it and applies the equivalent colour

### Requirement: Bidirectional, colour-preserving conversion

The system SHALL convert between hex, rgb, and hsl notations through a single pure
conversion helper, normalizing every accepted notation to the canonical stored hex form
that the reducer and 3D engine already consume. Conversion MUST be colour-preserving and
round-trip stable: a value formatted into one notation and re-parsed MUST yield the same
canonical colour, including pure black (`#000000`) and pure white (`#FFFFFF`).

#### Scenario: Notation normalized to canonical hex on commit
- **WHEN** a valid colour is committed in any supported notation
- **THEN** it is converted to a canonical `#rrggbb` hex string before being stored/dispatched

#### Scenario: Stored value can be displayed and edited in another notation
- **WHEN** a stored hex colour is shown for editing in rgb or hsl notation
- **THEN** the displayed value represents the same colour and re-committing it leaves the colour unchanged

#### Scenario: Black and white survive conversion
- **WHEN** `#000000` or `#FFFFFF` is entered in any supported notation
- **THEN** the stored canonical value is exactly `#000000` or `#FFFFFF` respectively

### Requirement: Invalid colour input is rejected gracefully

The colour controls SHALL reject unparseable or out-of-range input without mutating state,
throwing, or corrupting the active swatch. On invalid input the control MUST fall back to
the last valid value and provide non-destructive feedback to the user.

#### Scenario: Unparseable text is ignored
- **WHEN** the user commits text that is not a valid colour (e.g. `nope`, `#12`, an empty string, or channel values out of range)
- **THEN** no colour change is dispatched and the control retains its last valid value

#### Scenario: Invalid input does not crash the control
- **WHEN** invalid input is entered into a colour control
- **THEN** the control surface remains functional and the device/light render is unaffected

### Requirement: All colour controls support multi-format input

Multi-format typed colour input SHALL apply to every colour control in the 3D studio: all
device-part colours (face, wheel ring, centre, well floor, back, bezel) in the colour
cockpit AND all lighting colours (Ambient, Key, Fill, Rim) in the lighting cockpit. The
existing native-swatch picker and the current value readout MUST continue to function
unchanged, and the typed input MUST stay in sync when the value is changed by the swatch,
a preset, or a saved favourite.

#### Scenario: Device-part colours support typed input
- **WHEN** the user enters a colour in any supported notation for a device part (face, wheel ring, centre, well floor, back, or bezel)
- **THEN** that part updates and the value is stored as canonical hex

#### Scenario: Lighting colours support typed input
- **WHEN** the user enters a colour in any supported notation for a light (Ambient, Key, Fill, or Rim)
- **THEN** that light's colour updates and the value is stored as canonical hex

#### Scenario: Typed input stays in sync with other inputs
- **WHEN** a colour is changed via the native swatch, a preset, or a saved favourite
- **THEN** the typed-input field reflects the new value in its current display notation

