## ADDED Requirements

### Requirement: Touch camera-control layer driving the public camera API

The stage SHALL provide an on-canvas, touch-friendly camera-control layer that floats above the
always-visible `Ipod3DStudioShots` bottom bar within one-thumb reach, and that drives the camera
**exclusively through the public `ThreeDIpodHandle` API** (`getCameraPose()` +
`setCameraGoal({ azimuth, elevation, reach })`, degrees, clamped to `ELEVATION_RANGE` and
`REACH_RANGE`). It MUST NOT instantiate a second camera or controls system alongside the custom
`OrbitRig`, and MUST NOT appear in exports.

#### Scenario: Controls are one-thumb reachable

- **WHEN** the touch controls are enabled on a mobile viewport
- **THEN** the control layer renders above the bottom bar within reach of a single thumb
- **AND** it does not overlap or obscure the Product / Front / Back focus pills

#### Scenario: Controls drive the existing rig, not a parallel system

- **WHEN** the user operates any touch control
- **THEN** the camera moves by calling `setCameraGoal` on the public handle (read via `getCameraPose`)
- **AND** no second camera or controls instance is created

#### Scenario: Controls are absent from exports

- **WHEN** an export is produced
- **THEN** the touch-control layer is not present in the rendered frame

### Requirement: Gizmo orientation widget snaps to canonical views

The control layer SHALL include a 3D-modeling-style gizmo / orientation widget that snaps the
camera to canonical views — Front (azimuth 0, elevation 0), Back (azimuth 180), Left
(azimuth -90), Right (azimuth 90), Top (elevation ~70), and a ¾ hero (azimuth ~20,
elevation ~12). Because the rig is the custom `OrbitRig` (not drei `OrbitControls`), the widget
MUST drive these snaps through the public camera API (or a thin adapter), not via a drei
`<GizmoHelper>` auto-wire. The widget's displayed orientation SHALL track the live pose.

#### Scenario: Snap to a canonical view

- **WHEN** the user taps the Front target on the gizmo
- **THEN** the camera goal is set to the canonical Front pose (azimuth 0, elevation 0) via `setCameraGoal`
- **AND** the camera eases to that exact pose

#### Scenario: Hero and Top snaps

- **WHEN** the user taps the ¾ hero or Top target
- **THEN** the camera goal is set to (azimuth ~20, elevation ~12) for hero or (elevation ~70) for Top, clamped to `ELEVATION_RANGE`

#### Scenario: Widget reflects the live camera

- **WHEN** the camera pose changes by any means
- **THEN** the gizmo orientation updates to match the pose read from `getCameraPose()`

### Requirement: Touch orbit-pad for fine continuous orbit

The control layer SHALL provide a touch orbit-pad that performs fine continuous orbit by
relative drag. On touch-start it MUST capture the current goal pose, then accumulate azimuth and
elevation deltas onto that captured start goal and call `setCameraGoal` on each move, so the
camera tracks the finger without lag-drift from re-reading an eased pose mid-gesture. Elevation
SHALL stay within `ELEVATION_RANGE`.

#### Scenario: Fine orbit follows the thumb

- **WHEN** the user drags on the orbit-pad
- **THEN** azimuth and elevation accumulate from the start-of-gesture goal and update the camera each move with no drift away from the finger

#### Scenario: Elevation stays clamped

- **WHEN** a drag would push elevation past `ELEVATION_RANGE` [-78, 78]
- **THEN** the elevation is clamped to the range and the camera does not flip over the pole

### Requirement: Pinch-to-zoom controls reach

The control layer SHALL support two-finger pinch to control camera `reach`, mapping pinch
distance delta to reach within `REACH_RANGE` [5.5, 19] via `setCameraGoal`. Pinch and
single-finger orbit MUST be disambiguated by active-pointer count so one gesture does not trigger
the other.

#### Scenario: Pinch pulls the device closer and pushes it back

- **WHEN** the user pinches with two fingers
- **THEN** the camera reach changes with the pinch distance, clamped to `REACH_RANGE`

#### Scenario: Pinch and orbit do not collide

- **WHEN** a second finger touches down during a single-finger orbit
- **THEN** the gesture switches to pinch handling and does not also apply an orbit delta from the second pointer

### Requirement: Settings toggle to enable or disable touch controls

The user SHALL be able to toggle the touch camera controls on or off from the studio cockpit
(`Ipod3DStudioCockpit`), alongside the existing Lock editing / Marquee toggles. When disabled,
the touch layer MUST be hidden/unmounted and its event listeners detached.

#### Scenario: Disable hides the layer

- **WHEN** the user turns the "Touch controls" toggle off
- **THEN** the touch-control layer is hidden/unmounted and its pinch/drag listeners are detached

#### Scenario: Enable shows the layer

- **WHEN** the user turns the "Touch controls" toggle on
- **THEN** the touch-control layer renders and is operable

### Requirement: Sensible mobile default by pointer capability

The touch controls SHALL default ON when the environment matches `(pointer: coarse)` and OFF
otherwise (desktop / fine pointer). The explicit settings toggle MUST be able to override this
default in either direction.

#### Scenario: Default on for coarse pointers

- **WHEN** the studio loads on a device matching `(pointer: coarse)` with no prior override
- **THEN** the touch controls are enabled by default

#### Scenario: Default off on desktop

- **WHEN** the studio loads on a fine-pointer (desktop) device with no prior override
- **THEN** the touch controls are disabled by default

#### Scenario: Toggle overrides the default

- **WHEN** the user changes the "Touch controls" toggle from its default state
- **THEN** the chosen state takes effect regardless of the pointer-media default

### Requirement: Non-interference with existing canvas drag and desktop controls

The touch camera-control layer MUST NOT break the existing canvas drag-to-orbit, the desktop
cockpit (`Ipod3DStudioCockpit` / `Ipod3DStudioShots`), or the desktop floating panels at `lg:`.

#### Scenario: Canvas drag still works

- **WHEN** the touch controls are disabled
- **THEN** the existing finger/pointer drag-to-orbit on the canvas behaves exactly as before

#### Scenario: Desktop surfaces unchanged

- **WHEN** the studio is viewed on desktop (fine pointer)
- **THEN** the desktop cockpit and floating panels render and behave unchanged, and the touch layer is hidden by default
