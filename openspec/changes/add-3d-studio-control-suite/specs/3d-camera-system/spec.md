## ADDED Requirements

### Requirement: Toggleable XYZ axis visualization in studio coordinates
The stage SHALL provide a toggleable axis visualization — an origin-anchored X/Y/Z triad
plus a corner ViewCube — that reads the **same studio coordinates**
(`azimuth / elevation / reach / target`) as the camera pose HUD, never a parallel system.

#### Scenario: Toggle axis viz on
- **WHEN** the user toggles the axis visualization on
- **THEN** a labeled X/Y/Z triad appears at the model origin and a corner ViewCube appears
- **AND** both reflect the current camera orientation in the same coordinates shown by the pose readout

#### Scenario: Toggle axis viz off
- **WHEN** the user toggles the axis visualization off
- **THEN** the triad and ViewCube are hidden and do not appear in exports

### Requirement: Orthogonal view locks with free orbit
The gimbal SHALL provide dead-on orthogonal snaps — Front, Back, Left, Right, Top,
Bottom — that set exact poses, while free orbit remains available otherwise. ViewCube
faces SHALL trigger the same snaps.

#### Scenario: Snap to Front
- **WHEN** the user activates the Front snap (button or ViewCube front face)
- **THEN** the camera moves to an exact dead-on front pose (canonical azimuth/elevation)

#### Scenario: Free orbit between snaps
- **WHEN** the user drags the stage without a snap engaged
- **THEN** the camera orbits freely and the pose readout updates continuously

### Requirement: Detent feedback on lock engagement
When a lock/snap engages, the system SHALL provide detent feedback: a vibration pulse on
touch-capable devices (`navigator.vibrate`) and a visual flash plus soft audio "tick" on
desktop, since no web API exposes desktop trackpad haptics.

#### Scenario: Touch detent
- **WHEN** a snap engages on a touch device
- **THEN** a short vibration pulse fires alongside the visual flash

#### Scenario: Desktop detent
- **WHEN** a snap engages on a non-touch device
- **THEN** a brief axis-colored flash and a soft audio tick fire (no vibration)

### Requirement: Settable and savable camera poses
The user SHALL be able to set a precise camera position and save named poses that persist
and can be recalled.

#### Scenario: Save and recall a pose
- **WHEN** the user composes a pose and saves it
- **THEN** the pose persists and selecting it later restores the exact camera position

### Requirement: Saved studio shots (camera + product) as quick toggles

The user SHALL be able to save a **studio shot** — a single recallable "quick variable" that
bundles BOTH the camera pose AND the product perspective (finish/colors and orientation) — and
recall it as a one-tap toggle in the bottom bar alongside the built-in focus pills
(Product / Front / Back). Selecting a saved shot restores the exact camera framing and the
product state together.

#### Scenario: Save a studio shot
- **WHEN** the user composes a camera angle and a product finish/perspective and saves it
- **THEN** a named studio shot is stored capturing both the camera pose and the product state

#### Scenario: Toggle a saved shot from the bottom bar
- **WHEN** the user taps a saved studio shot in the bottom bar
- **THEN** the camera moves to the saved pose AND the product perspective (finish/colors/orientation) is restored to match, as one quick toggle

### Requirement: Lockable perspective

The user SHALL be able to LOCK the composed camera perspective so they never have to
"hunt down" a good angle again. While locked, free-orbit drag and zoom are suppressed (or
require an explicit unlock), the locked pose persists across reloads, and it is the pose
exports use. This makes a hard-won hero angle a stable, repeatable starting point.

#### Scenario: Lock the current angle
- **WHEN** the user composes an angle and engages the perspective lock
- **THEN** the camera holds that pose and casual drag/zoom no longer disturbs it

#### Scenario: Locked pose persists and drives exports
- **WHEN** the perspective is locked and the user reloads or runs an export
- **THEN** the locked pose is restored on load and is the framing the export uses

#### Scenario: Unlock to recompose
- **WHEN** the user disengages the lock
- **THEN** free orbit is available again to recompose

### Requirement: Resizable stage
The user SHALL be able to resize the 3D stage (make it larger or smaller) without
distorting the device proportions.

#### Scenario: Resize the stage
- **WHEN** the user changes the stage size
- **THEN** the device re-frames at the new size with correct aspect and no stretching
</content>
