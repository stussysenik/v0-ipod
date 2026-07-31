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

### Requirement: An authored motion SHALL be saveable as a named document

A motion the user has tuned SHALL be saveable as a named document that persists independently of
the look that selected it, and SHALL then appear in the picker beside the shipped catalogue with
no distinction in how it is opened, applied, or edited. A saved document SHALL be renameable,
overwritable in place, and deletable. Saving SHALL capture the authored document whole, so a
saved motion cannot be invalidated by a later change to the catalogue document it was derived
from.

Deleting a saved document that the current look references SHALL leave the flown motion
unchanged for the session and heal on the next read to the catalogue document, never to an empty
or throwing state.

#### Scenario: A tuned motion becomes the user's own

- **WHEN** the user overrides a track's easing and saves the motion under a name
- **THEN** the named document appears in the picker, and selecting it restores that easing

#### Scenario: A saved motion is independent of its origin

- **WHEN** a saved document was derived from a catalogue document, and that catalogue document is
  later changed
- **THEN** the saved document samples exactly as it did when it was saved

#### Scenario: A saved motion is renamed and overwritten

- **WHEN** the user renames a saved document, and separately saves new tuning over it
- **THEN** the rename changes only the label, and the overwrite replaces only the document body,
  and neither creates a second entry

#### Scenario: Deleting a referenced document does not break the session

- **WHEN** the user deletes the saved document the current look references
- **THEN** the flown motion is unchanged for the session and the reference heals on the next read

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

### Requirement: Every selectable motion SHALL state the shape it draws

A motion picker SHALL show, for each selectable document, a trace of the motion derived by
sampling that document — not a name alone, and not a captured asset. The trace SHALL be a pure
function of the document, so it cannot disagree with what the rig flies or what the encoder
exports. Each track SHALL be normalised to its own sampled extent, because a document's tracks
carry incommensurable units and one normaliser across degrees and world units states a
comparison that was never made. The document currently flying SHALL mark its cycle phase on its
own trace; the others SHALL NOT.

#### Scenario: A move is recognised before it is flown

- **WHEN** the motion picker is displayed
- **THEN** each entry shows a trace of its own tracks and its natural cycle length, so a move is
  chosen by its shape rather than by remembering which name went with it

#### Scenario: The trace is generated, not captured

- **WHEN** a document is tuned, saved, or opened from the shelf
- **THEN** its trace is resampled from that document, and no rendered frame or stored image is
  read to draw it

#### Scenario: Two axes of one move are distinguishable

- **WHEN** a document's tracks run at different rates or carry different phase offsets
- **THEN** the trace draws one line per track, in the same order the track rows are listed, and
  the lines differ

#### Scenario: An axis contributing nothing says so

- **WHEN** a track's sampled extent is zero, because it is held or dialled to zero amplitude
- **THEN** its line is drawn down the middle of the frame and marked flat, rather than being
  stretched to fill a range it does not cover

### Requirement: Every command in the motion inspector SHALL be reachable without a hover

Commands that are transparent at rest SHALL become visible on a device that cannot hover, and
every state marker SHALL carry an accessible name rather than colour or position alone. A
control's accessible name SHALL be the label printed beside it.

#### Scenario: A shelf entry is edited on a touch device

- **WHEN** the shelf is used on a device with a coarse pointer
- **THEN** rename, overwrite and delete are present without a hover, because neither `:hover`
  nor `:focus-within` can be produced there

#### Scenario: A tuned axis is announced

- **WHEN** a track carries an override
- **THEN** the row's accessible name says so, and does not rely on a coloured dot alone

#### Scenario: One command, one name

- **WHEN** two commands would otherwise share a verb, one of which discards authored work
- **THEN** they are named distinctly, and the accessible name of a control matches its visible
  label
