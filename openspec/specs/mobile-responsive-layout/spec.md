# mobile-responsive-layout Specification

## Purpose
TBD - created by archiving change add-mobile-responsive-stability. Update Purpose after archive.
## Requirements
### Requirement: Stable Workbench Device Scaling on Mobile

The workbench SHALL keep the rendered iPod device at a stable size on compact mobile viewports held in portrait, such that transient viewport-height changes (URL-bar collapse, soft keyboard, browser chrome) do not rescale the device. When the device cannot fit the viewport, the container SHALL scroll rather than shrink the device below its width-based fit.

#### Scenario: URL bar or keyboard changes viewport height in portrait
- **WHEN** the viewport width is below the compact breakpoint and held in portrait
- **AND** the viewport height changes (URL bar hides/shows, soft keyboard opens)
- **THEN** the device scale SHALL NOT change in response to the height change
- **AND** the device SHALL remain at its width-based fit scale

#### Scenario: Device taller than a short portrait viewport
- **WHEN** the width-fit device is taller than the available portrait viewport height
- **THEN** the container SHALL allow vertical scrolling to reach the full device
- **AND** no part of the device or its controls SHALL be permanently clipped or unreachable

#### Scenario: Landscape still fits the short axis
- **WHEN** a compact viewport is held in landscape (width greater than height)
- **THEN** the device SHALL scale to fit both axes so it remains fully visible

### Requirement: Reachable Compact Toolbox

The compact mobile tool dock SHALL remain fully reachable at every supported viewport height. When the tool stack is taller than the available space, the panel SHALL scroll internally rather than overflow off-screen.

#### Scenario: Tool stack exceeds viewport height
- **WHEN** the compact toolbox is open on a short viewport
- **AND** the stacked controls are taller than the available height
- **THEN** the panel SHALL constrain its height to the safe viewport and scroll internally
- **AND** every control SHALL be reachable without any button being clipped off-screen

### Requirement: Orientation-Safe 3D Controls

On `/3d`, the camera-angle widget, the orbit/pinch pad, and the shots tab bar SHALL stay within the viewport bounds and SHALL NOT overlap or clip the iPod model in any supported orientation.

#### Scenario: Landscape phone on /3d
- **WHEN** `/3d` is viewed on a compact viewport in landscape
- **THEN** no control row SHALL overflow horizontally beyond the viewport
- **AND** the angle widget, orbit pad, and shots bar SHALL NOT overlap or clip the rendered model
- **AND** the model SHALL remain fully visible and centered within the available space

#### Scenario: Portrait phone on /3d remains unchanged
- **WHEN** `/3d` is viewed on a compact viewport in portrait
- **THEN** the existing portrait control layout SHALL be preserved

### Requirement: Pinch-to-Zoom Enabled

The application SHALL allow users to pinch-zoom the page to at least 5x, in compliance with WCAG zoom requirements. Interactive surfaces that own gestures (the click wheel, the 3D canvas) SHALL declare `touch-action` so that re-enabled page zoom does not hijack their drag gestures.

#### Scenario: User pinch-zooms the page
- **WHEN** a user performs a pinch gesture on the page background
- **THEN** the page SHALL zoom up to at least 5x

#### Scenario: Wheel drag is unaffected by zoom
- **WHEN** a user drags on the click wheel
- **THEN** the gesture SHALL scrub the wheel and SHALL NOT trigger page zoom

### Requirement: Reduced-Motion Compliance

When the user requests reduced motion, the application SHALL suppress non-essential continuous and entrance animations, including the marquee and `animate-*` utility animations, not only view-transition animations.

#### Scenario: User prefers reduced motion
- **WHEN** the OS setting `prefers-reduced-motion: reduce` is active
- **THEN** the title marquee SHALL NOT animate
- **AND** entrance/looping `animate-*` animations SHALL be suppressed or reduced to no motion

### Requirement: Minimum Touch Target Size

Interactive controls intended for touch SHALL present a hit target of at least 44×44 CSS pixels, including editor swatches/buttons and export-dialog controls.

#### Scenario: Tapping a small editor or export control on a phone
- **WHEN** a user taps a color swatch, picker button, or export-dialog control on a touch device
- **THEN** the effective hit target SHALL be at least 44×44 px

### Requirement: Inputs Avoid iOS Focus-Zoom

Text and numeric inputs SHALL render at an effective font size of at least 16px (or otherwise prevent automatic zoom) so that focusing an input on iOS does not zoom and shift the layout.

#### Scenario: Focusing a metadata input on iOS
- **WHEN** a user focuses a text or numeric input (title, time, duration, track number, hex color) on iOS Safari
- **THEN** the browser SHALL NOT auto-zoom on focus
- **AND** numeric fields SHALL present a numeric keyboard via `inputmode`

