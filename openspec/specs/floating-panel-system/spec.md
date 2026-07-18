# floating-panel-system Specification

## Purpose
Governs the floating tool-panel system: draggable and resizable panels that collapse to a minimal form, persist layout per mode, reset, coexist with the canvas, and fall back gracefully on compact viewports.
## Requirements
### Requirement: Draggable Tool Panels

Tool panels SHALL be repositionable by dragging their title bar, and SHALL remain within the viewport bounds. Initiating a drag on a panel SHALL bring that panel to the front of the panel stack.

#### Scenario: User drags a panel by its title bar
- **WHEN** a user presses on a panel's title bar and moves the pointer
- **THEN** the panel SHALL follow the pointer
- **AND** the panel SHALL be clamped so no part of its title bar leaves the viewport

#### Scenario: Dragging focuses the panel
- **WHEN** a user begins dragging a panel that is behind another panel
- **THEN** the dragged panel SHALL render in front of all other panels

#### Scenario: Drag does not start from interactive content
- **WHEN** a user presses on a control inside the panel body (not the title bar)
- **THEN** the panel SHALL NOT begin a drag and the control SHALL receive the interaction

### Requirement: Resizable Tool Panels

Tool panels SHALL be resizable from their edges and corners, constrained between a declared minimum size and the viewport bounds.

#### Scenario: User resizes from a corner
- **WHEN** a user drags a panel's corner resize handle
- **THEN** the panel SHALL resize along both axes following the pointer
- **AND** the panel SHALL NOT shrink below its declared minimum size
- **AND** the panel SHALL NOT grow beyond the viewport bounds

#### Scenario: User resizes from an edge
- **WHEN** a user drags a panel's edge resize handle
- **THEN** the panel SHALL resize along that single axis only

### Requirement: Collapse to Ideal Minimal Form

Each panel SHALL declare an ideal minimal form and SHALL support collapsing to it, showing only its title bar / identifying nub. Collapsing SHALL preserve the panel's prior expanded frame so that expanding restores it.

#### Scenario: User collapses a panel
- **WHEN** a user activates a panel's collapse control
- **THEN** the panel SHALL shrink to its declared ideal minimal form
- **AND** the panel SHALL remain identifiable and grabbable for dragging

#### Scenario: User expands a collapsed panel
- **WHEN** a user expands a previously collapsed panel
- **THEN** the panel SHALL return to the size and position it had before collapsing

### Requirement: Per-Mode Persisted Panel Layout

The layout of each panel — position, size, collapsed state, and visibility — SHALL be stored per view mode in the central model and SHALL persist across reloads through the existing persistence path. Switching view modes SHALL restore that mode's own panel arrangement.

#### Scenario: Layout is remembered per mode
- **WHEN** a user arranges panels in one view mode and switches to another mode and back
- **THEN** the original mode SHALL restore the panel arrangement the user left it in
- **AND** each mode SHALL maintain its own independent arrangement

#### Scenario: Layout survives reload
- **WHEN** a user reloads the app after moving, resizing, or collapsing panels
- **THEN** the panels SHALL restore to their last position, size, and collapsed state for the current mode

#### Scenario: A persisted panel cannot be stranded off-screen
- **WHEN** a persisted panel frame would fall outside the current viewport (e.g. after a window resize)
- **THEN** the panel SHALL be clamped back into the viewport so its title bar is reachable

### Requirement: Reset Panel Layout

The system SHALL provide a way to reset panel layout to defaults, both per panel and for all panels in the current mode.

#### Scenario: User resets a single panel
- **WHEN** a user invokes reset for one panel
- **THEN** that panel SHALL return to its registry default frame and expanded state

#### Scenario: User resets all panels in a mode
- **WHEN** a user invokes reset-layout for the current mode
- **THEN** every panel in that mode SHALL return to its registry default frame, visibility, and expanded state

### Requirement: Spatial Canvas Symbiosis

In a mode that renders the spatial 3D canvas, the canvas SHALL reflow so that the iPod model remains fully visible and is never permanently occluded or clipped by an open (non-collapsed, visible) panel. This reflow SHALL change only layout/framing and SHALL NOT alter camera control semantics.

#### Scenario: Opening a panel reflows the canvas
- **WHEN** a panel is opened or moved over the spatial canvas area
- **THEN** the canvas SHALL inset its usable content rect away from the panel
- **AND** the model SHALL remain fully visible within the resulting safe area

#### Scenario: Collapsing a panel returns space to the canvas
- **WHEN** a panel covering canvas space is collapsed or hidden
- **THEN** the canvas SHALL expand its content rect to reclaim that space

#### Scenario: Symbiosis is suspended during export capture
- **WHEN** an export capture is in progress
- **THEN** the canvas SHALL use its export framing and SHALL NOT reflow in response to panels

### Requirement: Compact Viewport Fallback

On compact viewports below the responsive breakpoint, tool surfaces SHALL fall back to the existing docked / bottom-sheet layout instead of free-floating panels, and SHALL NOT present drag or resize affordances. This fallback SHALL preserve the established mobile stability and reachability behavior.

#### Scenario: Compact phone shows docked tools
- **WHEN** the viewport is below the compact breakpoint
- **THEN** tool surfaces SHALL render in their docked / bottom-sheet layout
- **AND** no free-floating drag or resize handles SHALL be shown
- **AND** every control SHALL remain reachable as established by the mobile responsive layout

