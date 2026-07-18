# stage-keepout-layout Specification

## Purpose
Governs the stage keep-out layout: a device keep-out zone with container-query sizing, exclusive docked rails, screen content bound to the device, and no horizontal overflow.
## Requirements
### Requirement: Device Keep-Out Zone

The stage SHALL reserve the device's bounding region as a keep-out zone that no HUD, control, panel, or command surface may occupy. In the 3D stage, the keep-out region SHALL cover the device's maximum projected screen-space silhouette across the allowed orbit range. Non-overlap SHALL be guaranteed by layout structure (dedicated grid cells), not by z-index ordering.

#### Scenario: Controls never intersect the device box

- **WHEN** the stage is rendered at any supported container width (320px–1440px), in portrait or landscape
- **THEN** the bounding rectangle of every control rail and panel is disjoint from the device keep-out rectangle (zero intersection area)

#### Scenario: 3D HUD stays outside the device silhouette

- **WHEN** the `/3d` device is orbited to any angle within the allowed range
- **THEN** the angle pill, orbit pad, and shots bar remain entirely outside the device's reserved grid cell and never occlude the model

### Requirement: Container-Query Driven Sizing

The stage and its descendants SHALL resolve size and type scale against their parent container (CSS container queries / container units), not the viewport. Stage layout SHALL NOT use viewport units (`vw`/`vh`) or viewport-keyed `clamp()` for device, screen, rail, or type sizing.

#### Scenario: Same element renders correctly at two container sizes

- **WHEN** the stage is mounted in a 320px-wide container and separately in a 900px-wide container
- **THEN** the device and its screen content scale proportionally in both, with no horizontal overflow and no dependence on `window` dimensions

#### Scenario: Transient viewport-height change does not rescale the device

- **WHEN** the mobile URL bar collapses or the soft keyboard opens (viewport height changes, container width unchanged)
- **THEN** the device size is unchanged

### Requirement: Exclusive Docked Rails

All controls and panels SHALL live in dedicated rail zones outside the keep-out zone. On containers narrower than the rail breakpoint, rails SHALL reflow below the device (stacked rows); they SHALL NOT float over the device at any width.

#### Scenario: Narrow container stacks rails below the device

- **WHEN** the stage container is narrower than the rail breakpoint (compact phone portrait)
- **THEN** the control rails render in rows beneath the device, fully visible, with the device above them

#### Scenario: Opening a panel docks it

- **WHEN** the user opens a color, meta, settings, or command surface
- **THEN** it appears within a rail zone outside the keep-out zone, not as a free-floating layer over the stage

### Requirement: No Horizontal Overflow

The stage SHALL NOT produce horizontal scrolling or clip any control. Rail content that exceeds its zone SHALL wrap or scroll within the zone, never overflow the stage.

#### Scenario: Shots bar is fully visible on a phone

- **WHEN** the stage is rendered at 390px portrait
- **THEN** the `Product · Front · Back · + Shots` bar is fully visible with no clipped or off-screen items and the document has no horizontal scroll

### Requirement: Screen Content Bound To Device

The on-screen UI (menu, now-playing) SHALL render within the device's screen container so it inherits the device transform and stays registered to the screen. The screen content SHALL NOT be a detached overlay positioned independently of the device.

#### Scenario: Screen UI tracks the device

- **WHEN** the device is scaled or tilted
- **THEN** the menu/now-playing content remains aligned within the screen bezel with no positional offset from the device

### Requirement: Retire Floating Panels

The free-floating, draggable panel placement SHALL be removed in favor of docked rail placement. Panel and command-palette content and behavior SHALL be preserved; only their spatial container changes.

#### Scenario: No free-floating panel layer over the stage

- **WHEN** any panel or the command palette is open
- **THEN** it is contained within a docked rail zone and no draggable floating panel overlaps the device

