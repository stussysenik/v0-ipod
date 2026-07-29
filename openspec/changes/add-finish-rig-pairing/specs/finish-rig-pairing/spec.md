# finish-rig-pairing

## ADDED Requirements

### Requirement: A pairing is scored, never asserted

The system SHALL compute a reading for any pairing of a case finish, a lighting rig and a
stage colour. The reading SHALL report the colour distance between the rendered case and the
finish's attested hex, the wheel-label contrast measured at both ends of the label's gradient,
and the luminance separation between the device edge and the stage.

The reading SHALL be produced by the modules that already own these measurements, so that one
definition of each metric exists. The scoring function SHALL be pure and SHALL read no clock,
no storage and no renderer state, so a pairing can be scored in a unit test.

#### Scenario: A pairing yields a reading

- **WHEN** a finish, a rig and a stage colour are scored
- **THEN** the result carries a colour distance, a label contrast at each gradient end, and an edge-to-stage separation

#### Scenario: Contrast is measured at both ends

- **WHEN** the wheel label sits on a gradient
- **THEN** contrast is reported at both ends of that gradient, and the pairing's verdict uses the worse of the two

#### Scenario: Scoring is pure

- **WHEN** the same finish, rig and stage are scored twice in any environment
- **THEN** the readings are identical, and scoring reads no clock, storage or renderer state

### Requirement: Named looks are derived, not transcribed

The named look set SHALL be produced by scoring the product of the finish and rig registries
and retaining the pairings that meet every floor. It SHALL NOT be a hand-written list. Adding a
finish or a rig SHALL extend the candidate set with no further edit.

Each floor SHALL be a stated number with its source recorded. A pairing that fails any floor
SHALL NOT appear as a named look.

#### Scenario: A new rig extends the set without an edit

- **WHEN** a rig is added to the rig registry
- **THEN** it is scored against every finish, and any passing pairing becomes available as a named look with no other change

#### Scenario: A failing pairing is not recommended

- **WHEN** a pairing falls below any floor
- **THEN** it is absent from the named look set, and its reading states which floor it failed and by how much

#### Scenario: A refused pairing stays reachable by hand

- **WHEN** the user manually selects a finish and rig combination that fails a floor
- **THEN** the combination applies, and the surface states the failing reading rather than blocking or silently altering it

#### Scenario: Every floor is attributable

- **WHEN** the floors are read
- **THEN** each carries a number and a recorded source for that number

### Requirement: The reading moves while the input moves

While any colour or rig control is being manipulated, the surface SHALL update the reading and
SHALL state the direction of travel relative to the value the control held before the gesture,
so that the effect of an input is observable during the input rather than inferred afterwards.

The reading SHALL be a value display, not an instruction: it states what is true now and what
changed, and never advises.

#### Scenario: A drag shows the reading changing

- **WHEN** a colour or rig control is dragged
- **THEN** the reading updates during the drag and states both the current value and its direction from the pre-gesture value

#### Scenario: Crossing a floor is visible as it happens

- **WHEN** a manipulation takes a reading across a floor
- **THEN** the surface marks the crossing at the moment it occurs

#### Scenario: The reading advises nothing

- **WHEN** the reading is displayed in any state
- **THEN** it contains only nouns and values, with no instruction or recommendation text

### Requirement: A look's claims inherit the manifest's rules

A named look that references an attested finish SHALL carry that finish's generation and year
from the manifest, and SHALL make no heritage claim about the pairing itself. A look built on a
house colour SHALL identify that colour as house. A pairing SHALL never be described as
authentic; only a finish can be.

#### Scenario: An attested finish carries its provenance

- **WHEN** a named look references a manifest-attested finish
- **THEN** the finish's generation and year are read from the manifest rather than stored on the look

#### Scenario: A house colour is labelled house

- **WHEN** a look is built on a colour the manifest does not attest
- **THEN** the look identifies that colour as house, and no Apple product name is used for it

#### Scenario: The pairing makes no heritage claim

- **WHEN** any named look is presented
- **THEN** nothing states or implies that the finish and rig combination itself shipped as a product
