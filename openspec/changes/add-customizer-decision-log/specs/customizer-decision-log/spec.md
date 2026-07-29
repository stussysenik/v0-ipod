# customizer-decision-log

## ADDED Requirements

### Requirement: The customisation is a document, not a blob

The customizer SHALL retain an ordered log of the decisions that produced the current
model. The live model SHALL be reproducible by folding that log over the base model, and the
fold SHALL delegate to the existing workbench reducer rather than reimplementing it. The log
SHALL be plain serialisable data, containing no functions, no wall-clock reads, and no
references to live objects, so it survives persistence, transport, and unit testing off-browser.

#### Scenario: Folding the log reproduces the live model

- **WHEN** any sequence of edits is applied to the customizer
- **THEN** folding the resulting decision log over the base model produces a model deep-equal
  to the live one

#### Scenario: The fold delegates rather than duplicates

- **WHEN** a decision is applied during a fold
- **THEN** the resulting model is computed by the existing workbench reducer, so a single
  definition of each transition exists

#### Scenario: Timestamps are supplied, not read

- **WHEN** a decision is recorded
- **THEN** its timestamp comes from the caller, and the decision module reads no clock, so
  the fold is pure and reproducible

### Requirement: A gesture is one decision

Consecutive dispatches that address the same target within a single gesture SHALL coalesce
into one decision, so that continuous manipulation of a control records the choice a person
made rather than every frame of the manipulation. A decision whose value came from a preset
SHALL NOT coalesce into an adjacent decision whose value was custom-authored: selecting a
named finish and then adjusting it are two distinct claims and both SHALL remain legible.

#### Scenario: A colour drag is one entry

- **WHEN** a colour control is dragged continuously, emitting many updates to one target
- **THEN** the log contains exactly one decision for that target and gesture

#### Scenario: Distinct targets never merge

- **WHEN** two decisions address different targets
- **THEN** they remain separate entries regardless of how close together they occurred

#### Scenario: A preset choice stays distinguishable from a nudge

- **WHEN** a named finish is selected and its value is then adjusted by hand
- **THEN** the log holds two decisions, the first sourced as a preset and the second as
  custom

### Requirement: History and layers are two projections of one log

The system SHALL expose the full ordered log as chronological history, and SHALL expose a
layer projection that retains only the most recent decision per target. Disabling a decision
in the layer projection SHALL cause the previous decision addressing the same target to take
effect, rather than reverting that target to its default.

#### Scenario: The layer stack shows one entry per target

- **WHEN** a target has been edited several times
- **THEN** the layer projection contains exactly one entry for that target, the most recent

#### Scenario: Disabling a layer resurfaces the prior decision

- **WHEN** a layer is disabled and an earlier decision on the same target exists
- **THEN** the model reflects that earlier decision

#### Scenario: Disabling the only decision restores the default

- **WHEN** a layer is disabled and no earlier decision on that target exists
- **THEN** that target reverts to its base value

### Requirement: Independent decisions commute

Decisions addressing different targets SHALL be order-independent: reordering them SHALL
produce an identical model. Decisions addressing the same target SHALL NOT be
order-independent, and the later decision SHALL win. These properties make reordering and
disabling entries sound rather than incidental.

#### Scenario: Reordering independent decisions is a no-op

- **WHEN** two decisions on different targets are swapped in the log
- **THEN** the folded model is unchanged

#### Scenario: Order matters within a target

- **WHEN** two decisions on the same target are swapped
- **THEN** the folded model reflects whichever now sits later in the log

### Requirement: A share payload may carry derivation

The portable state codec SHALL accept an optional decision log alongside the final state. A
payload lacking a log SHALL continue to decode successfully, and a malformed payload SHALL
continue to decode to null rather than throwing. Encoding SHALL remain byte-stable, so the
same look with the same history always produces the same string.

#### Scenario: A payload without a log still opens

- **WHEN** a share link produced before this capability existed is opened
- **THEN** it decodes to a valid model and the customizer starts with an empty log

#### Scenario: Derivation survives the round trip

- **WHEN** a state with a decision log is encoded and decoded
- **THEN** the recovered log is equal to the original and re-encoding yields an identical string

### Requirement: An export records how it was derived

An export record SHALL carry the decision log that produced it, so provenance answers how a
result was reached and not only which inputs it had. The export fingerprint SHALL NOT include
the log: identity and derivation are separate claims, and two exports reached by different
routes to the same inputs are the same export.

#### Scenario: The log travels with the export record

- **WHEN** an export is recorded
- **THEN** its record includes the decision log current at export time

#### Scenario: Derivation does not disturb the cache

- **WHEN** two exports have identical inputs but different decision logs
- **THEN** their fingerprints are equal and a cached proof frame is reused
