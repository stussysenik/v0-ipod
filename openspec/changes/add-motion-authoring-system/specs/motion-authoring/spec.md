## ADDED Requirements

### Requirement: Motion SHALL be one authored document

The system SHALL represent a camera motion as a single serialisable `MotionDoc` consisting of
independent per-property tracks, where each track carries its own ordered keyframes, its own
per-segment easing, and its own phase offset within the cycle. A track key SHALL be a string,
not a closed camera-property union, so the format can carry non-camera properties later without
a format change. There SHALL be exactly one motion engine: the same document SHALL drive the
live preview, the offline render loop, and the proof renderer.

#### Scenario: One document, three consumers

- **WHEN** a `MotionDoc` is sampled at the same phase by the live preview, the offline render
  loop, and the proof renderer
- **THEN** all three receive the identical `StudioPose`

#### Scenario: Axes are independent

- **WHEN** a document gives azimuth four keyframes and elevation two, with different easings
- **THEN** each axis interpolates on its own keyframe grid with its own curve, and neither
  constrains the other's keyframe positions

#### Scenario: A phase offset shifts one axis only

- **WHEN** a track declares a phase offset of `0.15`
- **THEN** that track is sampled at `(phase + 0.15) mod 1` and every other track is unaffected

### Requirement: Any easing SHALL be expressible as a custom cubic bezier

Every easing field in the motion format SHALL accept either a named curve or a raw
`[c1x, c1y, c2x, c2y]` control-point tuple, and the two SHALL be interchangeable at every
level: catalogue documents, user-authored documents, and per-segment overrides. Control-point
X values SHALL be clamped to `[0,1]` because the solver inverts x→t over that domain; Y values
SHALL NOT be clamped, so overshoot and anticipation remain expressible.

#### Scenario: A named curve and its tuple are the same value

- **WHEN** a keyframe's easing is set to the name `easeOutCubic` and, separately, to the tuple
  `[0.33, 1, 0.68, 1]`
- **THEN** the sampled values are identical at every phase

#### Scenario: Overshoot is preserved

- **WHEN** an easing tuple has a Y control point outside `[0,1]`
- **THEN** the sampled value overshoots the keyframe range rather than being clamped to it

#### Scenario: A non-monotonic time curve is rejected at the boundary

- **WHEN** an easing tuple carries an X control point outside `[0,1]`
- **THEN** the X value is clamped into range before it reaches the solver, and the curve stays
  monotonic in time

### Requirement: The number of cycles SHALL be authored, not derived

The system SHALL expose the whole-cycle repeat count as a directly authored integer, together
with the clip duration; the cycle length SHALL be derived from those two and presented as a
readout. No control SHALL exist whose adjustment can leave the resulting cycle count unchanged
across adjacent stops. A repeat count of `0` SHALL mean the camera rests on the composed hero
pose for the whole clip.

#### Scenario: Three spins in six seconds is two edits

- **WHEN** the user sets repeat to `3` and duration to `6`
- **THEN** the clip contains exactly three whole cycles, and the readout states a cycle length
  of `2.0s`

#### Scenario: Every repeat stop changes the motion

- **WHEN** the repeat control is stepped from any value to the adjacent value
- **THEN** the resulting cycle count differs, at every duration

#### Scenario: Zero repeat holds the composed pose

- **WHEN** repeat is `0`
- **THEN** every frame of the clip renders the composed hero pose, through the ordinary
  sampling path, with no engine branch specific to holding

#### Scenario: Seamlessness is stated, not enforced

- **WHEN** a non-integer repeat count is authored
- **THEN** the clip is still rendered, and the readout states that it does not close on the
  seam rather than refusing the value

### Requirement: The shipped motion catalogue SHALL be authored documents, and every port SHALL be ruled by measurement

Every motion offered in the picker SHALL be an openable, editable `MotionDoc`. Where a shipped
motion is ported from a procedural generator, the maximum per-axis deviation between the ported
document and the generator SHALL be measured across at least 1000 uniformly sampled phases and
recorded before the generator is removed. The recorded readings SHALL be enforced by a test. A
motion whose deviation exceeds the stated floor SHALL either gain keyframes until it conforms
or retain its generator, and the ruling SHALL be recorded with its reading. A measured value
SHALL NOT be adjusted to make the check pass.

#### Scenario: A ported move is opened and edited

- **WHEN** the user selects a shipped motion and opens the motion inspector
- **THEN** its tracks, keyframes and curves are visible and editable, and edits change the flown
  motion immediately

#### Scenario: The parity floor is enforced by a test

- **WHEN** a ported document's maximum deviation from its generator exceeds `0.25°` on an angle
  track or `0.01` units on a distance track
- **THEN** the parity test fails and names the move and the axis

#### Scenario: An exactly-representable move is the control case

- **WHEN** the linear turntable rotation is ported to two keyframes with a `linear` easing
- **THEN** the measured deviation is zero across every sampled phase

### Requirement: Robotic and organic SHALL be positions in one parameter space

The system SHALL express mechanical and organic motion character through the same three
parameters — easing curve, per-track phase offset, and keyframe rhythm — rather than through a
mode switch. Named character starting points SHALL ship as ordinary documents that can be
opened and edited like any other, and SHALL NOT be a control that changes how a document is
interpreted.

#### Scenario: A character preset is an ordinary document

- **WHEN** the user picks the `Organic` starting point and opens it
- **THEN** they see the staggered per-track phase offsets and sine easings that produce the
  character, and can edit any of them

#### Scenario: Character is continuous

- **WHEN** the user drags one track's easing from `linear` toward `easeInOutSine`
- **THEN** the motion moves continuously between mechanical and organic with no discrete step

### Requirement: The motion inspector SHALL edit by direct manipulation and show the value it holds

The motion inspector SHALL present each track as a row carrying its name and its current value,
and SHALL allow the easing curve to be edited by dragging its two control handles, with the
numeric tuple updating as it is dragged. It SHALL be a self-contained panel body owning no
layout, built on the shared studio control primitives, so it can be re-parented without being
rewritten.

#### Scenario: A control shows its value

- **WHEN** the azimuth track is displayed
- **THEN** its row reads the property name and the current amplitude, not the name alone

#### Scenario: Dragging a handle moves the number

- **WHEN** the user drags a bezier control handle in the curve editor
- **THEN** the displayed tuple updates during the drag and the flown motion updates with it

#### Scenario: A named curve is recognised

- **WHEN** an authored tuple exactly matches a curve in the named vocabulary
- **THEN** the readout shows that curve's name; otherwise it reads `Custom`
