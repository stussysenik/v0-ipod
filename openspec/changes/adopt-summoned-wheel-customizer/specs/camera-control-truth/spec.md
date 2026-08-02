## ADDED Requirements

### Requirement: A throw authors a move

Releasing an orbit drag with velocity SHALL author a motion track rather than merely coast.
The release SHALL be converted to exactly the three scalars the track model already stores
(`lib/motion/track-edit.ts`): release speed to `gain`, release angle to `phase`, and the
curvature of the drag path to `curve`. No new persisted shape SHALL be introduced, the motion
document format SHALL NOT change, and `FINGERPRINT_VERSION` SHALL NOT be bumped.

Rotation during the drag SHALL follow a virtual-sphere mapping, not two independent axis
sliders, so a diagonal drag produces one rotation rather than two composed ones.

Authoring SHALL be derived from the shipped base track and never from the previous edit, so a
gesture repeated identically produces a bit-identical track.

#### Scenario: A throw becomes a repeatable move

- **WHEN** the user drags the device and releases with velocity above the authoring threshold
- **THEN** the device continues on a cyclic move whose amplitude follows the release speed
- **AND** the resulting motion document differs from the base only in `gain`, `phase` and `curve`

#### Scenario: A release below the threshold does not author

- **WHEN** the user drags the device and releases with velocity below the authoring threshold
- **THEN** the camera holds its final pose and no track is written

#### Scenario: The same throw twice produces the same track

- **WHEN** the identical pointer sample sequence is replayed twice
- **THEN** the two authored tracks are byte-identical, with no accumulated drift

#### Scenario: Authoring is deterministic

- **WHEN** a track is authored from a recorded gesture
- **THEN** no wall clock and no random source contributes to the stored values

### Requirement: The authored path is shown at the moment it is authored

On release the authored path SHALL be drawn once through the scene as a great-circle arc from
the release point, marking its own cycle, and SHALL fade out unless the wheel's Motion branch is
holding it for shaping. No persistent graph, curve pad or keyframe lane SHALL render the same
polyline elsewhere on the surface, whether the arc is fading or held.

Numeric entry for a move SHALL remain reachable through the wheel's Motion branch, so a value
that a gesture cannot reach exactly is still reachable.

#### Scenario: The arc replaces the curve pad

- **WHEN** a throw authors a move
- **THEN** the arc draws once and fades
- **AND** no curve pad, keyframe lane or trace card is present on the surface at any time

#### Scenario: An exact value is still reachable

- **WHEN** the user needs a specific numeric amplitude or angle
- **THEN** it is enterable from the wheel's Motion branch
- **AND** the value entered writes the same three scalars a throw would have written

### Requirement: A route the throw cannot reach is authored on the arc itself

A move whose route the shipped catalogue never drew SHALL be authorable by shaping the arc in
the scene, and SHALL NOT require a curve pad, a keyframe lane or any second coordinate system
beside the object. The held arc SHALL carry a bead at each of the move's keyframe positions;
pulling a bead SHALL bend the route under a falloff measured around the cycle, and tapping the
line between beads SHALL place a bead there.

Shaping SHALL write only the keyframe positions, values and curves the motion document format
already carries. No spline, control-polygon or path shape SHALL be persisted, no format field
SHALL be added, and `FINGERPRINT_VERSION` SHALL NOT be bumped.

Placing a bead SHALL NOT change the move. The segment's curve SHALL be split exactly rather
than resampled, and where the format cannot store an exact split the bead SHALL be refused
rather than placed approximately.

Shaping SHALL be derived from the route as it was when the hand closed, never from the previous
frame of the same drag, so a pull taken out and brought back restores the original values
exactly and the override is cleared rather than stored as a copy of the base.

A move whose axes read the cycle from different phase offsets has no single route; it SHALL NOT
present a shapeable arc, and its per-track values SHALL remain reachable as typed values in the
wheel's Motion branch.

#### Scenario: A route is bent by hand

- **WHEN** the user pulls a bead on the held arc
- **THEN** the route bends at that bead and tapers to unchanged within the falloff
- **AND** the beads outside the falloff hold their previous values exactly

#### Scenario: The loop still closes after a pull

- **WHEN** the user pulls the bead at the start of the cycle
- **THEN** the bead at the end of the cycle moves with it
- **AND** the move still returns to its seam without a pop

#### Scenario: Placing a bead changes nothing

- **WHEN** the user taps the arc between two beads
- **THEN** a bead appears at that position
- **AND** the sampled move is unchanged across the whole cycle

#### Scenario: A cut the format cannot store is refused

- **WHEN** the user taps a segment whose curve cannot be split exactly within the stored domain
- **THEN** no bead is placed
- **AND** the move is byte-identical to what it was before the tap

#### Scenario: A pull taken back leaves nothing behind

- **WHEN** the user pulls a bead away and returns it to where the drag began
- **THEN** the resulting document is byte-identical to the one before the drag

#### Scenario: A phase-split move shows no arc to shape

- **WHEN** the move's tracks carry different phase offsets
- **THEN** no shapeable arc is presented
- **AND** the per-track values remain editable as typed values in the Motion branch
