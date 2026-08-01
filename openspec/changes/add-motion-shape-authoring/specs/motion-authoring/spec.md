# motion-authoring — delta for add-motion-shape-authoring

## ADDED Requirements

### Requirement: A track's shape SHALL be editable, not only its scale

The motion inspector SHALL present each track as a lane in which every keyframe is a direct
target: draggable in time and in value, insertable at any position that does not already hold a
keyframe, and deletable. The lane SHALL be rendered by the same trace derivation the motion
picker uses, so the shape shown when choosing a move and the shape edited when tuning it cannot
disagree.

#### Scenario: A keyframe moves in time and value

- **WHEN** the user drags a keyframe in a track lane
- **THEN** its position within the cycle and its offset both change, and the flown motion changes
  with them during the drag

#### Scenario: A track gains a keyframe it never had

- **WHEN** the user inserts a keyframe into a two-keyframe catalogue track
- **THEN** the track holds three keyframes and remains a valid document that samples, traces and
  exports through the same engine

#### Scenario: A keyframe is removed

- **WHEN** the user deletes a keyframe that is not part of the seam pair
- **THEN** its two neighbours join, spanned by the curve that led into the deleted keyframe

### Requirement: Inserting a keyframe SHALL NOT change the motion

Insertion SHALL subdivide the segment it lands in rather than re-shaping it. The segment's easing
SHALL be split so that each half, renormalised to its own box, reproduces the original curve. The
implementation SHALL reach the existing bezier solver rather than introducing a second one.

#### Scenario: The sampled curve survives an insert

- **WHEN** a keyframe is inserted at any position within a segment
- **THEN** the track sampled at every phase before the insert and after the insert agrees to
  floating-point precision

#### Scenario: A stepped segment splits into stepped segments

- **WHEN** a keyframe is inserted into a segment whose leading keyframe holds
- **THEN** both resulting segments hold, and the sampled values are unchanged

#### Scenario: An insert cannot land on an existing keyframe

- **WHEN** the user attempts to insert at a time a keyframe already occupies
- **THEN** no keyframe is added and the track is unchanged

### Requirement: A loopable motion SHALL stay closed under editing

While a document is loopable, the first and last keyframes of each track SHALL be pinned at the
cycle boundaries and linked in value, so that editing either moves both. Whether a document is
loopable SHALL be recomputed from its tracks after every shape edit and never carried as an
asserted flag.

#### Scenario: Dragging the seam moves both ends

- **WHEN** the user drags the first keyframe of a loopable track in value
- **THEN** the last keyframe takes the same value and the cycle still closes

#### Scenario: A broken seam is stated, not hidden

- **WHEN** the user unlinks the seam pair and gives the ends different values
- **THEN** the document reads as not seamless everywhere that property is displayed

### Requirement: Direction SHALL be a sign, and whole turns SHALL be a count

A track's amount SHALL be signed, so that a negative amount mirrors the track about the hero pose
and reverses the move. A track measured in degrees that is monotone across the cycle and spans at
least a half turn SHALL instead present a whole-turn count, signed for direction. A track SHALL
present exactly one of these two controls, chosen by its own shape, so that no two controls write
one value.

#### Scenario: A spin runs the other way

- **WHEN** the user sets a turntable's turn count to `−1`
- **THEN** the camera completes one revolution in the opposite direction, with its easing
  character unchanged

#### Scenario: Two turns in one cycle

- **WHEN** the user sets a turn count of `2`
- **THEN** the track spans 720 degrees across one cycle and the cycle still closes

#### Scenario: A drift is not a turn

- **WHEN** a monotone degree track spans less than a half turn
- **THEN** the row presents a signed amount rather than a turn count

### Requirement: A shape-edited track SHALL store as a definition

A track whose keyframes have been edited SHALL be stored whole, rather than as a scale, phase and
curve over a catalogue base. Tracks that have not been shape-edited SHALL continue to store as
sparse scalar overrides, and untouched tracks SHALL store nothing. A stored scalar override SHALL
convert to a definition at the moment of its first shape edit, by the same function that already
applies it.

#### Scenario: One hand-drawn track does not fork the document

- **WHEN** one track of a catalogue move is shape-edited and the others are not
- **THEN** the stored motion still references the catalogue document and carries one whole track

#### Scenario: A converted override samples identically

- **WHEN** a track carrying a stored scale, phase and curve is shape-edited
- **THEN** the definition it converts to samples identically to the scaled track at every phase,
  before any further edit is applied

### Requirement: The live camera SHALL be an input to motion

The inspector SHALL provide a capture command that reads the rig's current pose, expresses it as
an offset from the hero pose, and writes it as a keyframe on every camera track at the playhead's
position. Capture SHALL replace a keyframe already within snapping distance rather than adding a
second one at nearly the same time. Capture SHALL depend on no clock and no ambient state beyond
the pose being captured.

#### Scenario: A route is authored by flying it

- **WHEN** the user orbits the rig freely, scrubs to a position, and captures, three times over
- **THEN** the document holds keyframes at those three positions and the flown motion passes
  through the three captured poses

#### Scenario: Capture near an existing keyframe replaces it

- **WHEN** the user captures at a playhead position within snapping distance of an existing
  keyframe
- **THEN** that keyframe takes the captured values and no second keyframe is created

### Requirement: The camera's route SHALL be shown as a derived view

The inspector SHALL draw the camera's route through space across one cycle, derived by sampling
the document. This view SHALL be read-only, and no path SHALL be stored anywhere in the document
beyond the tracks it is derived from.

#### Scenario: The route redraws from the tracks

- **WHEN** any camera track is edited
- **THEN** the route view redraws from the edited document with no separately stored geometry

#### Scenario: The route marks where the playhead is

- **WHEN** the playhead moves
- **THEN** its position is marked on the route

### Requirement: A distance SHALL read as a distance

A displayed reach value SHALL state both the stored offset and the absolute distance from the
device it produces, because the document stores an offset and a person reads a distance.

#### Scenario: The reach row states both numbers

- **WHEN** the reach track is displayed against a hero framing
- **THEN** the row reads the offset and the absolute distance it produces

### Requirement: Every shape edit SHALL be reachable from the keyboard and cancellable

Every drag in a lane SHALL have a keyboard equivalent that moves the same value, and every drag
SHALL be cancellable mid-gesture, restoring the document as it stood before the drag began.

#### Scenario: A keyframe is nudged without a pointer

- **WHEN** a keyframe is selected and an arrow key is pressed
- **THEN** it moves in time or value by one step, and by a larger step when the key is modified

#### Scenario: A drag is abandoned

- **WHEN** the user presses Escape during a keyframe drag
- **THEN** the document returns to its pre-drag state and the flown motion returns with it
