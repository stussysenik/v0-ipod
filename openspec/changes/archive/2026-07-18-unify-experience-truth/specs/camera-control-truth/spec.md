# camera-control-truth

## ADDED Requirements

### Requirement: Single quick camera control on /3d

The `/3d` studio SHALL expose exactly one quick camera control surface on every
viewport: a single bottom bar carrying the six canonical named views — `Front`,
`Right`, `Back`, `Left`, `Top`, `¾`. The separate `Product / Front / Back` focus
segment SHALL be deleted, and no user-facing "focus mode" control SHALL exist apart
from the named views; each named view SHALL carry its own framing. The bar SHALL fit
within the viewport at 320px, scrolling horizontally within itself rather than
clipping.

#### Scenario: One bottom bar on a phone

- **WHEN** `/3d` loads on a coarse-pointer viewport (e.g. iPhone, 390×844)
- **THEN** exactly one bottom control bar is rendered, containing the six named views
- **AND** no second bar with overlapping "Front/Back" labels appears above or below it
- **AND** no control in the bar is clipped by the edge of the viewport

#### Scenario: Pose tap drives the camera

- **WHEN** the user taps a named pose (e.g. `Front`) in the bar
- **THEN** the orbit camera animates to that pose's framing and azimuth/elevation via
  the same camera-goal path the cockpit uses
- **AND** the framing is applied before the angles, so the angles are not clobbered by
  the framing snap

#### Scenario: Free orbit deselects

- **WHEN** the user drags the canvas away from a named pose
- **THEN** no pose in the bar reads as active, because the active pose is derived from
  where the camera actually is rather than from what was last tapped

### Requirement: The camera moves deterministically

The framing of the device SHALL be a pure function of the pose and the viewport. It
SHALL NOT depend on the position of any control chrome. Specifically, the floating
panel "symbiosis" insets — which offset the stage away from open panels — SHALL apply
only where panels actually float (desktop, ≥1024px); below that breakpoint the
controls live in a bottom drawer and the stage SHALL fill the viewport untouched.
On every named pose, at every supported viewport, the whole device SHALL remain
within the frame.

#### Scenario: The device is framed on a phone

- **WHEN** `/3d` loads at 390×844 and the user taps each of the six named poses in turn
- **THEN** the whole device remains within the viewport in every pose
- **AND** the canvas fills the viewport exactly, with no inset offset applied

#### Scenario: Panel chrome cannot move the device

- **WHEN** floating panels are open on a narrow viewport
- **THEN** the stage is not inset by their frames, and the device does not shift

### Requirement: Cockpit edits the same pose state

The camera cockpit SHALL be the advanced numeric editor of the same pose model the
bar drives; there SHALL be no third camera state owner. The cockpit SHALL NOT own its
own persistence.

#### Scenario: Bar and cockpit agree

- **WHEN** the user taps `Back` in the bar and then opens the camera cockpit
- **THEN** the cockpit's azimuth/elevation/reach values reflect the `Back` pose

### Requirement: User-authored camera points are archived

The shipped camera SHALL offer a closed set of six named angle presets and no
user-authored camera points. The saved studio shots (`＋ Shot` and its chips) and the
cockpit's numeric "Save pose" presets SHALL be archived behind
`FEATURE_FLAGS.SHOW_CUSTOM_CAMERA_POSES`, because an arbitrary saved pose carries no
guarantee that it frames the device on the viewport it is later recalled on, whereas
the six named presets do. Their code paths and persisted store entries SHALL remain
intact and SHALL return with one flag flip.

#### Scenario: The bar ships six controls

- **WHEN** a first-time visitor loads `/3d`
- **THEN** the bottom bar contains exactly the six named angle presets
- **AND** no `＋ Shot` action, shot chip, or "Save pose" control is rendered

#### Scenario: One flag flip restores custom poses

- **WHEN** `SHOW_CUSTOM_CAMERA_POSES` is set back to `true`
- **THEN** the shot chips, `＋ Shot`, and the cockpit's saved poses render and function
  as before, reading the shots and presets already held in the camera store

### Requirement: Consolidated camera persistence

Camera state (locked pose, saved shots, presets) SHALL persist under a single
versioned localStorage namespace (`ipod-3d-camera.v1`), owned by the stage, with a
one-time migration from the legacy keys (`ipod-3d-locked-pose`,
`ipod-3d-studio-shots`, `ipod-3d-camera-presets`), including mapping legacy shots'
`focus` field into pose framing. The legacy keys SHALL be retired once folded in.

#### Scenario: Legacy shots survive

- **WHEN** a user with shots saved under the legacy keys loads the updated `/3d`
- **THEN** their shots and presets are folded into the versioned store with their pose,
  framing and finish intact, and the legacy keys are removed
- **AND** the shots remain in the store even though the bar does not render them while
  `SHOW_CUSTOM_CAMERA_POSES` is false
