## ADDED Requirements

### Requirement: Export-aspect framing overlay

The stage SHALL provide a compose-time framing overlay that draws the **active export
crop** over the live viewport — the centered rectangle whose aspect ratio matches the
selected export aspect (9:16 / 4:5 / 1:1) — together with rule-of-thirds lines, a center
crosshair, and edge margin insets *inside* that crop. The overlay MUST read the same
`aspect` source the export uses, so what is framed inside the overlay is what the export
captures. It is a compose-time aid only: toggleable, suppressed during preview and export,
and never present in a rendered frame.

#### Scenario: Overlay matches the export crop

- **WHEN** the framing overlay is enabled and the export aspect is 9:16
- **THEN** the overlay draws a centered 9:16 rectangle over the canvas
- **AND** the area inside the rectangle equals the region the 9:16 export will capture

#### Scenario: Overlay tracks aspect changes live

- **WHEN** the user changes the export aspect from 9:16 to 1:1
- **THEN** the framing rectangle updates to 1:1 without reload
- **AND** the rule-of-thirds, crosshair, and margins re-fit the new crop

#### Scenario: Overlay is never baked

- **WHEN** a preview is flying or an export is captured
- **THEN** the framing overlay is not visible in the live preview frame and not present in the exported image or clip

### Requirement: Viewport orientation gizmo snaps canonical views

The compose surface SHALL provide an orientation gizmo that snaps the camera to canonical
views — Front (azimuth 0, elevation 0), Back (azimuth 180), Left (azimuth -90), Right
(azimuth 90), Top (elevation ~70), and a ¾ hero (azimuth ~20, elevation ~12). Because the
camera is the custom `OrbitRig` (not drei `OrbitControls`), the gizmo MUST drive these snaps
through the public camera API (`setCameraGoal`), not via a drei `<GizmoHelper>` auto-wire.
The canonical view set SHALL be a single shared constant reused by the mobile touch gizmo.
The gizmo's highlighted orientation SHALL track the live pose read via `getCameraPose`.

#### Scenario: Snap to a canonical view

- **WHEN** the user activates the gizmo's Front target
- **THEN** the camera goal is set to azimuth 0, elevation 0 via `setCameraGoal`
- **AND** the camera eases to that exact pose

#### Scenario: Gizmo reflects the live camera

- **WHEN** the camera pose changes by any means
- **THEN** the gizmo's highlighted face updates to match the pose from `getCameraPose`

#### Scenario: Single shared canonical view set

- **WHEN** both the compose gizmo and the mobile touch gizmo are present
- **THEN** both resolve their canonical poses from one shared `CANONICAL_VIEWS` constant

### Requirement: Ground grid and world axes reference

The scene SHALL offer a toggleable ground-plane grid and a world-axes helper as spatial
reference. These are in-scene helpers and MUST be rendered only while composing — suppressed
during preview and excluded from every export.

#### Scenario: Toggle the grid and axes

- **WHEN** the user enables the grid/axes reference
- **THEN** a ground-plane grid and world axes appear beneath and around the device

#### Scenario: Grid and axes never appear in a frame

- **WHEN** a preview is flying or an export is captured
- **THEN** neither the grid nor the axes are present in the previewed or exported frame

### Requirement: Adjustable lens (field of view)

In perspective mode the camera SHALL expose an adjustable field of view via a lens control.
Changing the lens MUST update the perspective camera's projection live and recompute the
responsive fit floor so a longer or wider lens never crops the device on a narrow viewport.
The live view and any subsequent export MUST use the chosen field of view (WYSIWYG).

#### Scenario: Longer lens reframes without cropping

- **WHEN** the user sets a longer (narrower) field of view
- **THEN** the live view updates to the new lens immediately
- **AND** the device remains fully on screen (the fit floor is recomputed)

#### Scenario: Lens carries into export

- **WHEN** the user composes with a chosen lens and exports a still
- **THEN** the exported still uses the same field of view as the live view

### Requirement: Perspective and orthographic camera modes

The camera SHALL support a perspective mode and an orthographic mode, switchable at compose
time, with perspective as the default. The `OrbitRig` SHALL remain the sole owner of the
camera in both modes, writing position and look-at to whichever camera is active. In
orthographic mode the `reach` dial SHALL map to orthographic zoom so apparent size still
responds to the same control, and switching modes SHALL keep the device's on-screen size
continuous at the current reach. The lens (field of view) control SHALL be disabled in
orthographic mode.

#### Scenario: Switch to orthographic

- **WHEN** the user switches the camera to orthographic mode
- **THEN** the device renders with parallel projection (no perspective foreshortening)
- **AND** the on-screen size does not jump at the moment of switching

#### Scenario: Reach still controls size in ortho

- **WHEN** the camera is orthographic and the user changes reach
- **THEN** the device's apparent size changes via orthographic zoom
- **AND** the camera angle still reflects the azimuth and elevation

#### Scenario: One camera writer per frame in both modes

- **WHEN** the camera is in either mode
- **THEN** only the `OrbitRig` writes the active camera's position and orientation each frame

### Requirement: Compose aids are non-baked instruments

Every compose aid added by this change SHALL be a compose-time instrument: the framing
overlay, orientation gizmo, ground grid, world axes, lens readout, and mode indicator MUST be
hidden while a preview is flying and excluded from all exports, mirroring the existing origin
gizmo. No aid SHALL alter the exported pixels.

#### Scenario: All aids off during capture

- **WHEN** every compose aid is enabled and the user exports a still and a clip
- **THEN** none of the aids appear in the exported image or video
