## ADDED Requirements

### Requirement: Noir Factory Default Presentation

The studio SHALL boot first-load visitors into the canonical "Noir" look: the
`classic-2008-black` hardware preset with case `#1b1818`, wheel ring `#313030`,
wheel center `#141212`, back `#cfd3d7`, edge `#cfd3d7`, bezel `#0a0a0a`, stage
`#0048FF`, lit by the "Designer Dark" rig. Hardware presets SHALL be able to
carry explicit wheel ring/center overrides that take precedence over
case-derived wheel colors.

#### Scenario: Fresh visitor sees the noir hero look

- **WHEN** a visitor with no persisted snapshot opens `/3d`
- **THEN** the device renders the black case `#1b1818` with wheel ring `#313030` and center `#141212` on the `#0048FF` stage under the "Designer Dark" rig

#### Scenario: Corrupt lighting blob heals to the default rig

- **WHEN** a persisted lighting config fails validation
- **THEN** the sanitized config falls back to the "Designer Dark" rig, matching what a fresh load produces

### Requirement: Edge-Carving Dark Rig Preset

The studio SHALL offer an "Edge Noir" rig preset that keeps the field dark
while drawing the device silhouette with edge light (opposed rim kickers and
horizon softboxes), so a black device on a dark stage stays legible without
flooding the metal.

#### Scenario: Black-on-black stays separated

- **WHEN** the user applies the "Edge Noir" rig preset to a black device on a dark stage
- **THEN** the device edges render visibly brighter than the stage while the overall exposure remains dark

### Requirement: Savable Studio Themes

The studio SHALL let the user save the current full look — all seven surface
colors plus the active rig — as a named theme, persist saved themes across
reloads, apply any theme in one gesture, and delete user-saved themes. A
built-in "Noir" theme SHALL ship the canonical black look and SHALL NOT be
deletable.

#### Scenario: Save and re-apply a theme

- **WHEN** the user saves the current look as a theme, changes colors, then applies the saved theme
- **THEN** all seven surface colors and the rig return to the saved values, and the theme survives a page reload

#### Scenario: Built-in Noir theme

- **WHEN** the user opens the Themes shelf on any device state
- **THEN** the "Noir" theme is present, applies the canonical black look, and offers no delete affordance
