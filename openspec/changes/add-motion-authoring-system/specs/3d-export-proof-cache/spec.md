## MODIFIED Requirements

### Requirement: A deterministic export fingerprint SHALL key every pixel-determining input

The system SHALL compute an `exportFingerprint` as a pure, stable hash over a normalized
snapshot of exactly the inputs that determine the export's anchor-frame pixels: the
quantized hero pose (azimuth, elevation, reach, target), the motion identity (the motion
document's canonical hash together with its repeat count, time map and duration), aspect,
quality, screen/metadata state (title, artist, album, currentTime, duration, marquee,
batteryLevel, osScreen), per-surface colors, hardware preset, and the lighting signature.
The function SHALL NOT read `Date`/random/wall-clock, so it is reproducible across reloads
and unit-testable in the node project. A `FINGERPRINT_VERSION` constant SHALL be folded into
the hash so changing the input set invalidates all prior entries.

#### Scenario: Identical setups produce identical fingerprints

- **WHEN** two studio setups have the same pixel-determining inputs in any field order
- **THEN** `exportFingerprint` returns the same value for both

#### Scenario: A pixel-affecting change changes the fingerprint

- **WHEN** any pixel-determining input changes (e.g. azimuth, title text, or skin color)
- **THEN** `exportFingerprint` returns a different value

#### Scenario: Sub-visible pose jitter does not change the fingerprint

- **WHEN** the hero pose moves by less than the quantization precision
- **THEN** the fingerprint is unchanged, so micro-nudges do not thrash the cache

#### Scenario: Editing a curve changes the export identity

- **WHEN** a single bezier control handle in the motion document is moved
- **THEN** `exportFingerprint` returns a different value, because the motion identity covers the
  document's contents and not only its name

## ADDED Requirements

### Requirement: A timeline proof SHALL render the motion, not only the anchor frame

The system SHALL maintain a second proof keyed by a `timelineFingerprint` that covers the proof
inputs, the motion identity, and the sample positions. It SHALL resolve to a set of N frames
rendered at authored positions across the clip rather than a single anchor frame. The anchor
`proofFingerprint` SHALL remain unchanged and SHALL continue to exclude motion, because motion
cannot change the frame at phase zero and including it would re-render byte-identical frames
while the user browses documents.

#### Scenario: Browsing documents does not thrash the anchor proof

- **WHEN** the user switches between motion documents without changing the pose
- **THEN** the anchor proof frame is reused unchanged, and only the timeline proof recomputes

#### Scenario: The timeline proof follows the motion

- **WHEN** any part of the motion document, repeat count, time map or duration changes
- **THEN** the timeline proof key changes and the strip recomputes

#### Scenario: Sample count is authored

- **WHEN** a document requests more sample positions than the default
- **THEN** the timeline proof renders that many frames and the key reflects the positions used

### Requirement: The timeline proof SHALL be ambient and aligned to the playhead

The timeline proof strip SHALL render beneath the playhead scrubber, aligned to it, so that
scrubbing to a position and inspecting its rendered frame are the same gesture. Frames SHALL
arrive in the background and SHALL NOT block any interaction; an unfilled position SHALL read
as computing rather than as an error or an empty frame.

#### Scenario: The strip never blocks

- **WHEN** the timeline proof has not finished rendering
- **THEN** the transport, the picker and the export button all remain usable, and the unfilled
  positions read as computing

#### Scenario: The strip is the export

- **WHEN** a timeline proof frame is filled at a given position
- **THEN** that frame is pixel-identical to the frame the export writes at that position
