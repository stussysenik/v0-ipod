# artifact-budget

## ADDED Requirements

### Requirement: The target machine is declared, and both budgets are measured against it

The project SHALL declare one target machine, and every budget in this capability SHALL be
stated against it. The declared target is a ThinkPad T480s: Intel UHD 620 integrated graphics,
1080p display.

Headroom on a development machine SHALL NOT be treated as evidence. A surface that holds its
budget only on the author's hardware SHALL be recorded as failing.

#### Scenario: A budget states the machine it was measured on

- **WHEN** a budget gate reports a reading
- **THEN** the reading names the target profile it was measured against

### Requirement: Wire bytes per route are gated

The system SHALL measure the transferred JavaScript and CSS bytes for each route from the
production build output, and SHALL fail when a route exceeds its declared ceiling.

The measurement SHALL be of transferred bytes for a single route, not of total build output on
disk — a disk total counts every route's chunks and source maps, so it cannot answer what one
visitor downloads. Each route SHALL carry its own ceiling; one repository-wide number would let
a heavy route hide behind light ones.

#### Scenario: A route exceeding its ceiling fails the gate

- **WHEN** a route's transferred JavaScript and CSS exceed its declared ceiling
- **THEN** the gate fails, naming the route, its reading, and its ceiling

#### Scenario: The gate prints its reading on pass

- **WHEN** every route is within its ceiling
- **THEN** the gate passes and prints each route's reading, so a pass is evidence rather than a tick

### Requirement: Frame rate on the target profile is gated

The system SHALL time a deterministic scene walk under a GPU profile matching the declared
target, and SHALL fail when the walk misses its declared frame budget.

The walk SHALL be deterministic — a fixed camera path over a fixed configuration, driven by
the same document engine the surface uses — so two runs on one machine produce comparable
readings and a regression is attributable to the diff.

#### Scenario: A regression below the frame budget fails the gate

- **WHEN** the deterministic walk's frame timing misses the declared budget on the target profile
- **THEN** the gate fails, naming the reading and the budget

#### Scenario: The walk is reproducible

- **WHEN** the frame gate runs twice on one machine with no intervening change
- **THEN** both runs walk the same path over the same configuration and report comparable readings

### Requirement: A shipped asset states what it bought

Content SHALL be generated rather than shipped where a generator exists. Geometry derives from
`IPOD_CLASSIC_MM`, colour derives from the manifest, and motion is documents rather than baked
frames.

Any asset added to the build output rather than generated SHALL record, next to its declaration,
the budget it consumes and what that purchase bought. An asset with no such statement SHALL fail
review.

#### Scenario: A baked asset without a stated purchase fails review

- **WHEN** an asset is added to the shipped output with no recorded byte cost and justification
- **THEN** the change fails review, naming the asset

#### Scenario: Both gates run in validate

- **WHEN** `pnpm validate` runs
- **THEN** the wire-byte gate and the frame gate both execute, and a failure of either fails validate
