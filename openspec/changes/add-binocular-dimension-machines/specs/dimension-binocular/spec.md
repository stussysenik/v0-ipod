# dimension-binocular

## ADDED Requirements

### Requirement: One document, one machine per dimension, no sibling reach

The system SHALL hold the customization as one document, and each dimension SHALL be served by
its own machine reading that document. A dimension machine SHALL NOT import, read, or dispatch
into another dimension machine, and the import graph SHALL be gated to enforce it.

Switching dimension SHALL change which machine presents the document and SHALL NOT reload,
re-derive, or re-encode the document itself. A dimension SHALL be a reachable address, so a
dimension can be linked to directly.

#### Scenario: A barrel importing a sibling fails the gate

- **WHEN** one dimension machine imports another dimension machine, directly or transitively
- **THEN** the import gate fails and names both modules

#### Scenario: Switching dimension preserves the document

- **WHEN** the visitor switches from one dimension to another and back
- **THEN** the document is the same document, with no reload and no re-encode

#### Scenario: A dimension is addressable

- **WHEN** a dimension's address is opened directly
- **THEN** that dimension presents the current document

### Requirement: A dimension's deviation is a sparse override that clears on identity

A dimension SHALL express any deviation from the shared document as a sparse override rather
than as a copy. An absent or empty override SHALL mean the dimension tracks the document,
including future revisions of it.

An edit that lands back on the document's own value SHALL clear its override rather than store
a value equal to the base. When the document absorbs an override, that override SHALL be dropped
in the same gesture.

#### Scenario: An untouched dimension tracks the document

- **WHEN** a dimension has no override and the document changes
- **THEN** that dimension presents the new value with no migration step

#### Scenario: An edit returning to the base clears its override

- **WHEN** a dimension's value is edited away from the document's value and then back to it
- **THEN** the override is cleared, and the stored shape is indistinguishable from never having been edited

#### Scenario: Absorbing an override clears it

- **WHEN** the shared document is rewritten to include a dimension's override
- **THEN** the override is cleared in the same gesture, and the dimension resumes tracking

### Requirement: Projection translation across dimensions is measured, not asserted

A position authored in one dimension SHALL translate into every other dimension through one
declared map, and the round-trip deviation per axis SHALL be measured and recorded.

Each axis SHALL carry a recorded deviation floor, and a translation exceeding its floor SHALL
fail. The reading SHALL be recorded once in this change's `tasks.md` and SHALL NOT be re-derived.

#### Scenario: A round trip stays within its recorded floor

- **WHEN** a position is translated from one dimension to another and back
- **THEN** the per-axis deviation is within the recorded floor for that axis

#### Scenario: A translation exceeding its floor fails

- **WHEN** a change moves a per-axis round-trip deviation above its recorded floor
- **THEN** the gate fails, naming the axis, the reading, and the floor

### Requirement: A dimension that cannot carry attestation does not present it

A dimension SHALL present an attested hardware finish only if it renders that finish as a
material under light. A dimension whose rendering cannot express the finish SHALL present the
colour as unattested and SHALL say so on the surface.

This forbids presenting a flat fill as a hardware finish, in any dimension, however closely the
fill matches a measured hex — a fill is not the finish, and a caption asserting otherwise is a
false claim about a real product.

#### Scenario: A non-material dimension marks colour unattested

- **WHEN** a dimension that cannot render a finish as a material presents a configuration using an attested finish
- **THEN** the surface reports the colour as unattested in that dimension

#### Scenario: Attestation survives a dimension switch

- **WHEN** a configuration using an attested finish is viewed in a dimension that renders materials
- **THEN** the finish is presented as attested, reading its value from the manifest rather than from a dimension-local copy
