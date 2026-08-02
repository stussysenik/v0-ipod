## MODIFIED Requirements

### Requirement: Spatial Canvas Symbiosis

The spatial 3D canvas SHALL NOT reflow in response to chrome. Because no panel is resident on
`/3d` and summoned chrome is transient and viewport-clamped, the canvas SHALL fill its surface
untouched at every viewport, and the model's framing SHALL depend only on pose and viewport.

The panel insets, the per-mode persisted panel layout and the reset-layout control SHALL NOT
apply to the spatial 3D canvas. They remain in force for the modes that still host floating
panels; the spatial canvas is carved out of their scope, not deleted from the system.

#### Scenario: Summoning chrome does not reflow the canvas

- **WHEN** a wheel or value readout is presented over the spatial canvas
- **THEN** the canvas content rect is unchanged
- **AND** the model occupies exactly the same pixels as before the chrome appeared

#### Scenario: The spatial canvas fills its surface at every viewport

- **WHEN** the spatial canvas renders at any supported viewport, compact or desktop
- **THEN** no panel inset is applied to it

#### Scenario: Symbiosis is suspended during export capture

- **WHEN** an export capture is in progress
- **THEN** the canvas uses its export framing and does not reflow

### Requirement: Compact Viewport Fallback

On compact viewports below the responsive breakpoint, tool surfaces in panel-hosting modes SHALL
fall back to the docked / bottom-sheet layout and SHALL NOT present drag or resize affordances.
On the spatial 3D canvas there is no fallback to make: the wheel is summoned identically at every
viewport, because a direction is not a distance and a wedge does not shrink with the screen.

#### Scenario: Compact phone shows docked tools in panel modes

- **WHEN** the viewport is below the compact breakpoint in a panel-hosting mode
- **THEN** tool surfaces render in their docked / bottom-sheet layout
- **AND** no free-floating drag or resize handles are shown

#### Scenario: The wheel is the same wheel on a phone

- **WHEN** the user presses and holds on the spatial canvas at 390×844
- **THEN** the same wheel is summoned, with the same wedges, clamped to the viewport
- **AND** no bottom sheet is presented in its place
