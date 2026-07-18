# 3d-export-provenance Specification

## Purpose
TBD - created by archiving change add-export-proof-cache. Update Purpose after archive.
## Requirements
### Requirement: Each export SHALL be stamped with its fingerprint and snapshot

When an export completes, its history record SHALL be stamped with the `exportFingerprint`
and the retained input snapshot used to produce it, so the user can identify what was
exported after the fact. The stamp SHALL be additive to the existing export record.

#### Scenario: A completed export carries its fingerprint

- **WHEN** an export finishes
- **THEN** its history entry includes the fingerprint and snapshot of the setup that
  produced it

#### Scenario: Legacy records degrade gracefully

- **WHEN** an export record predates this change and has no fingerprint
- **THEN** it is shown without a thumbnail or re-open affordance and causes no error

### Requirement: Export history SHALL show the proof thumbnail for each export

Each export entry SHALL display the cached proof frame for its fingerprint as a thumbnail, so
the history is a visual record of what shipped. The thumbnail SHALL be sourced from the same
proof cache used pre-export (one store, two tenses).

#### Scenario: History entry shows what was exported

- **WHEN** the user views the export history
- **THEN** each entry shows the proof thumbnail corresponding to its fingerprint

### Requirement: A past export SHALL be re-openable to its exact setup

The user SHALL be able to re-open a past export entry to restore the exact setup that
produced it — hero pose, move, loop style, speed, aspect, quality, screen/metadata, colors,
and lighting — by dispatching its retained snapshot back into studio state.

#### Scenario: Re-open restores the originating setup

- **WHEN** the user re-opens a past export entry
- **THEN** the studio restores the pose, move, aspect, colors, and screen state from that
  entry's snapshot, and the current fingerprint matches the entry's fingerprint

