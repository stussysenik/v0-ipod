# mobile-experience

## ADDED Requirements

### Requirement: Exactly one live screen render

The 3D iPod SHALL present exactly one visible "Now Playing" screen at all times in
the live view. While the DOM screen overlay (`<Html>`) is mounted and projecting,
the WebGL LCD shader plane MUST NOT display readable screen content, at any
viewport size or devicePixelRatio. The existing capture-time prepare/restore layer
swap SHALL remain intact.

This is a **standing invariant and regression guard, not a bug fix**: the LCD shader
plane is backlight-only by construction, and the current build was verified to render
exactly one screen at 390×844 / DPR 3 across poses and in short landscape (see
`design.md` D3). Implementers MUST verify the invariant and MUST NOT add a speculative
guard for a defect that does not reproduce.

#### Scenario: No double screen on mobile

- **WHEN** `/3d` renders on a mobile viewport (390×844, devicePixelRatio 3) with
  the device in any camera pose
- **THEN** a single "Now Playing" screen is visible with no second offset copy

#### Scenario: Export capture unaffected

- **WHEN** the user exports a still or animation
- **THEN** the captured output contains exactly one screen, matching current
  export behavior

### Requirement: Coordinated mobile chrome on /3d

On coarse-pointer viewports, `/3d` chrome SHALL follow one hierarchy: header
(navigation + controls toggle), stage, one bottom camera bar, and the controls
bottom-sheet drawer. Overlaid elements (bar, drawer, toasts, hints) SHALL respect
safe-area insets and MUST NOT overlap one another or cover the device in its
default framing.

#### Scenario: Nothing collides at default load

- **WHEN** `/3d` loads at 390×844 with default state
- **THEN** the whole device is framed and visible, the single bottom bar sits
  within the safe area, and opening the controls drawer does not leave orphaned
  floating controls behind it

#### Scenario: Short landscape reflows

- **WHEN** the viewport is landscape with height ≤ 540px
- **THEN** the chrome reflows to its landscape layout with no clipped or
  overlapping controls
