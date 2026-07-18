# color-fidelity-verification

## Purpose

Governs how the product's colour-fidelity claims are measured. Where `3d-product-fidelity`
states what the render must look like, this capability defines the instrument that proves
it: a verified colour-difference metric, an executable export-parity gate, and a published
tolerance envelope that says exactly which colours are guaranteed exact and which are
compressed.

## ADDED Requirements

### Requirement: Verified colour-difference metric

The system SHALL provide a CIEDE2000 colour-difference implementation verified against published reference test vectors, and every colour-fidelity tolerance in this project SHALL be expressed in that metric.

The implementation SHALL be covered by direct unit tests rather than exercised only as a
helper inside other tests. The Lab conversion chain it depends on (sRGB → XYZ → Lab) SHALL
be verified at the same time, since an error there is indistinguishable from an error in
the difference formula.

#### Scenario: Reference vectors match

- **WHEN** the CIEDE2000 implementation is evaluated against the published Sharma–Wu–Dalal
  reference pairs
- **THEN** each computed ΔE00 matches the published expected value within floating-point
  tolerance

#### Scenario: A colour has zero difference from itself

- **WHEN** any token hex is compared against itself
- **THEN** the reported ΔE00 is zero

#### Scenario: Lab conversion round-trips

- **WHEN** a token hex is converted to Lab and the conversion is checked against an
  independently computed reference for that colour
- **THEN** the L, a, and b components match within floating-point tolerance

### Requirement: Executable export-parity gate

The export colour path SHALL be verified by an automated test that compares resolved output values against their source token colours in ΔE00, and that test SHALL fail when the transfer function is dropped, doubled, or altered.

The existing `3d-product-fidelity` scenario "Export colour matches live colour" is
qualitative; this requirement is its instrument. The gate SHALL run in the project's
node-environment unit test channel and SHALL NOT depend on a browser-driven screenshot or
on a visible WebGL canvas.

#### Scenario: Token colours survive the resolve path

- **WHEN** each manifest finish colour is carried through the export colour-resolve
  transformation
- **THEN** the ΔE00 between the resolved output and the source token hex is within the
  tolerance published for that colour's luminance band

#### Scenario: A dropped transfer function is caught

- **WHEN** the linear-to-sRGB encoding step is removed or applied twice
- **THEN** the parity gate fails

#### Scenario: The capture path uses the verified resolve

- **WHEN** the high-resolution capture path produces an exported image
- **THEN** it routes pixels through the same colour-resolve implementation the parity gate
  verifies, rather than a raw read-back

### Requirement: Published fidelity envelope

The project SHALL publish a per-luminance-band tolerance table stating the maximum permitted ΔE00 between a picked colour and its rendered result, and that table SHALL be data consumed by the tests rather than prose.

The table SHALL distinguish colours guaranteed to pass through exactly from colours the
active tone-mapping operator legitimately compresses, and SHALL record the accepted
deviation for dark albedo explicitly so that a reviewer can tell an accepted compression
from a regression. Changing a published tolerance SHALL be a visible edit to that data.

#### Scenario: Tolerances are enforced from the table

- **WHEN** the parity gate evaluates a colour
- **THEN** the threshold it applies is read from the published table for that colour's
  luminance band

#### Scenario: Loosening a tolerance is visible

- **WHEN** a tolerance value in the table is raised
- **THEN** the change appears as an explicit edit to the tolerance data, not as a silently
  passing test

#### Scenario: Compression is distinguished from regression

- **WHEN** a colour deviates from its source hex because the active tone-mapping operator
  compresses that luminance band
- **THEN** the table records that deviation as accepted, and the gate does not report it as
  a failure

### Requirement: Single authority per colour question

Each distinct colour-physics question SHALL have exactly one implementation in the codebase, and modules needing an answer SHALL defer to that authority rather than re-deriving it.

Perceptual contrast, render-transfer linearization, and colour difference are separate
questions and SHALL remain separately named implementations. This requirement forbids
duplicate implementations of the *same* question, not the coexistence of different ones.

#### Scenario: Relative luminance has one implementation

- **WHEN** a module needs the relative luminance of a colour
- **THEN** it calls the single shared implementation rather than defining its own

#### Scenario: Contrast and render transfer stay distinct

- **WHEN** the perceptual-contrast model and the render linearization model are inspected
- **THEN** each remains a separately named function with a documented purpose, and neither
  is collapsed into the other
