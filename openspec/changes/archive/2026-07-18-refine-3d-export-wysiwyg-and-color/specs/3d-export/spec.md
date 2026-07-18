## ADDED Requirements

### Requirement: Neutral uniform studio field
The stage backdrop SHALL be a FLAT, unlit field driven by the Stage colour — no radial
gradient, vignette, or world-space falloff — so the background is identical in every frame
and recedes as pure negative space behind the device. Grounding SHALL come only from the
separate contact shadow, not from any backdrop gradient.

#### Scenario: Background constant during a camera move
- **WHEN** a camera move plays and the device sweeps across the frame
- **THEN** every pixel of the backdrop behind the device stays the exact Stage colour
- **AND** no lighter-centre / darker-edge falloff appears in the live view or the export

#### Scenario: Export reads neutral on a colour stage
- **WHEN** the user exports a still or clip on any Stage colour
- **THEN** the exported field is uniform (corners equal the Stage colour, no vignette darkening)

### Requirement: Export is WYSIWYG with the live preview
A still or clip export SHALL reproduce the live preview exactly at the same playhead
position: the same camera pose (azimuth / elevation / reach / FOV), the same colours and
tone handling (NoToneMapping then sRGB, no vignette), and the same uniform field. The only
permitted difference is the output aspect ratio versus the current viewport aspect.

#### Scenario: Clip frame matches preview at the same t
- **WHEN** the preview is scrubbed to t and the same move is exported at the same length
- **THEN** the exported frame at t shows the device at the identical pose and colour as the preview

#### Scenario: No tone-curve or vignette divergence
- **WHEN** an export is produced
- **THEN** it carries no vignette and no tone-mapping curve that the live view does not also apply

### Requirement: Deterministic capture
Capture (still and clip) SHALL be deterministic: the device rests at a known, fixed pose
with no ambient float bob frozen at a random phase. Re-exporting the same composed state
SHALL produce the same framing every time.

#### Scenario: Two exports of the same state agree
- **WHEN** the user exports the same composed state twice without changing anything
- **THEN** the device sits at the identical position and tilt in both files (no random drift)

#### Scenario: No stray tilt versus the resting preview
- **WHEN** the device is at rest in the live view and the same pose is exported
- **THEN** the exported device shows no tilt or offset absent from the live view

### Requirement: Boomerang loop with settable motion speed
A motion clip SHALL loop as a seam-free boomerang (forward then reverse / ping-pong) and
its motion SHALL play at a user-settable speed. The boomerang and the speed SHALL be
applied identically in the live preview and in the export so the preview is WYSIWYG.

#### Scenario: Boomerang closes the loop
- **WHEN** a clip is exported
- **THEN** the motion plays forward to its peak and reverses back, and the last frame returns to the first with no seam

#### Scenario: Speed applies to preview and export equally
- **WHEN** the user changes the motion speed
- **THEN** both the live preview and the exported clip play the move at that speed

### Requirement: Custom-angle and motion-free export
Exports SHALL NOT be bound only to the motion presets. Any landed camera pose SHALL be
savable as a reusable preset, and the user SHALL be able to export (still or clip) at that
composed angle with NO motion preset applied.

#### Scenario: Save the current pose as a preset
- **WHEN** the user lands the camera at an arbitrary angle and saves it
- **THEN** the pose is stored as a recallable preset alongside the orientation snaps

#### Scenario: Export a held angle with no motion
- **WHEN** the user exports with no motion preset selected
- **THEN** the export holds the composed/saved angle with no camera move applied
