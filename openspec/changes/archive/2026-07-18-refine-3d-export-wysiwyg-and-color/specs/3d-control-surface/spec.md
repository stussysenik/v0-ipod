## ADDED Requirements

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
