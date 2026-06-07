## ADDED Requirements

### Requirement: CMD+K command palette as central access point
The `/3d` surface SHALL provide a CMD+K command palette that exposes every primary
action centrally — applying finishes, snapping to views, toggling the axis viz,
switching motion presets, running exports, and toggling/opening the developer utility.

#### Scenario: Open the palette and run a command
- **WHEN** the user presses CMD+K (or Ctrl+K) and selects a command
- **THEN** the corresponding action runs without needing to locate a scattered panel control

#### Scenario: Palette is discoverable and searchable
- **WHEN** the user types in the palette
- **THEN** matching commands are filtered and selectable by keyboard

### Requirement: Developer control utility behind a dev toggle
The system SHALL provide a tiny Dear-ImGui-style developer utility that live-tunes
material, lighting, and camera parameters, hidden unless a dev toggle is enabled.

#### Scenario: Dev toggle gates the utility
- **WHEN** dev mode is off
- **THEN** the developer utility is not visible and does not affect the default presentation

#### Scenario: Live-tune and bake
- **WHEN** dev mode is on and the user adjusts a material/lighting/camera control
- **THEN** the scene updates live so the user can find and record good values to bake into defaults

### Requirement: Additive, moldable control layers with provenance
Control adjustments SHALL compose as additive layers that record their provenance
(source of the change) and can be reverted independently, so good and bad changes are
attributable and comparable.

#### Scenario: Revert a single adjustment
- **WHEN** the user reverts one adjustment layer
- **THEN** only that change is undone and the other layers remain intact

#### Scenario: Provenance is recorded
- **WHEN** a parameter is changed via any surface (palette, dev utility, cockpit, preset)
- **THEN** the change records its source so its origin can be inspected

### Requirement: Clean-minimal translucent HUD aesthetic
The control surface SHALL follow a clean-minimalism aesthetic: translucent, layered
panels (light-on-light rather than heavy opaque boxes) with industrial hairlines, and
SHALL tighten/bound the UI as more options are surfaced.

#### Scenario: Layered translucency
- **WHEN** control panels overlap the stage
- **THEN** they read as light, translucent layers that do not visually overpower the product

### Requirement: Responsive, touch-operable control surface

The `/3d` control surface SHALL be web-responsive with a fluid, constrained layout that grows
with the viewport and remains fully usable on mobile/touch. Controls SHALL NOT overlap the
device or each other at any width. On narrow viewports the controls SHALL collapse into a
dismissible bottom sheet; on wide viewports they float as a corner HUD. The 3D stage framing
SHALL adapt to the viewport aspect so the whole device stays in frame (no portrait crop).

#### Scenario: Mobile layout does not overlap
- **WHEN** the surface is viewed on a narrow/mobile viewport
- **THEN** the controls collapse into a scrollable bottom sheet and never overlap the device, and the device remains fully framed

#### Scenario: Fluid growth on desktop
- **WHEN** the viewport widens
- **THEN** the controls reflow into the floating corner HUD with constrained, non-overlapping panels

### Requirement: Modular controls portable to /portfolio

The control surface SHALL be built modularly in `/3d` first, with each control authored as a
self-contained, reusable module so aspects can later be ported to the `/portfolio` surface
without rewrite.

#### Scenario: Controls are self-contained modules
- **WHEN** a control (finish, camera, battery, export, etc.) is implemented
- **THEN** it is a standalone module that can be mounted on another surface (e.g. `/portfolio`) independently

### Requirement: Device-state control parity with 2D

The `/3d` surface SHALL expose the same device-state controls the 2D workbench offers, driving
the shared OS reducer — including battery level and battery mode (manual/solar) — so the
on-device status bar reflects them live.

#### Scenario: Battery control in 3D
- **WHEN** the user changes the battery level or mode in `/3d`
- **THEN** the on-device status-bar battery updates live, identically to the 2D workbench

### Requirement: On-screen HUD verification utilities
The system SHALL provide on-screen, game-dev / early-internet HUD-style utilities (live
readouts, toggleable overlays, frame/state inspectors) that make state and transitions
visible and verifiable interactively, behind the dev toggle / palette.

#### Scenario: Inspect live state on screen
- **WHEN** the user enables a HUD inspector
- **THEN** the relevant live state (e.g., pose, active preset, layer stack) is displayed on screen and updates in real time
</content>
