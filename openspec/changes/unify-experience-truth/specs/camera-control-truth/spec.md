# camera-control-truth

## ADDED Requirements

### Requirement: Single quick camera control on /3d

The `/3d` studio SHALL expose exactly one quick camera control surface on every
viewport: a single bottom bar carrying the six canonical named views — `Front`,
`Right`, `Back`, `Left`, `Top`, `¾` — together with the saved studio-shot chips and
the `＋ Shot` action. The separate `Product / Front / Back` focus segment SHALL be
deleted, and no user-facing "focus mode" control SHALL exist apart from the named
views; each named view SHALL carry its own framing. The bar SHALL fit within the
viewport at 320px, scrolling horizontally within itself rather than clipping.

#### Scenario: One bottom bar on a phone

- **WHEN** `/3d` loads on a coarse-pointer viewport (e.g. iPhone, 390×844)
- **THEN** exactly one bottom control bar is rendered, containing the six named views
  and the `＋ Shot` action
- **AND** no second bar with overlapping "Front/Back" labels appears above or below it
- **AND** no control in the bar is clipped by the edge of the viewport

#### Scenario: Pose tap drives the camera

- **WHEN** the user taps a named pose (e.g. `Front`) in the bar
- **THEN** the orbit camera animates to that pose's azimuth/elevation/reach and
  framing via the same camera-goal path the cockpit uses

### Requirement: Cockpit edits the same pose state

The camera cockpit SHALL be the advanced numeric editor of the same pose model the
bar drives; there SHALL be no third camera state owner.

#### Scenario: Bar and cockpit agree

- **WHEN** the user taps `Back` in the bar and then opens the camera cockpit
- **THEN** the cockpit's azimuth/elevation/reach values reflect the `Back` pose

### Requirement: Consolidated camera persistence

Camera state (locked pose, saved shots, presets) SHALL persist under a single
versioned localStorage namespace, with a one-time migration from the legacy keys
(`ipod-3d-locked-pose`, `ipod-3d-studio-shots`, `ipod-3d-camera-presets`),
including mapping legacy shots' `focus` field into pose framing.

#### Scenario: Legacy shots survive

- **WHEN** a user with shots saved under the legacy keys loads the updated `/3d`
- **THEN** their saved shots appear in the bar and restore pose and finish colors
  correctly
