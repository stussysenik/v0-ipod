## ADDED Requirements

### Requirement: Deterministic Flat Export Rendering
The system SHALL generate flat-view exports from an export-safe render path that avoids compositor artifacts and produces stable results with placeholder or loaded snapshot artwork.

#### Scenario: Export with placeholder artwork has no ghost shadow artifacts
- **WHEN** a user exports from flat view before loading snapshot artwork
- **THEN** the exported image SHALL not contain clipped right-edge or detached ghost shadows

#### Scenario: Export with loaded snapshot artwork remains visually stable
- **WHEN** a user loads snapshot data and exports from flat view
- **THEN** the exported image SHALL preserve the same clean shell/screen/wheel composition without artifact seams

#### Scenario: Export-safe mode only applies during capture
- **WHEN** export begins
- **THEN** export-safe styling SHALL be applied for capture and reverted after completion

### Requirement: Muted Non-Blocking Export Feedback
The system SHALL provide low-interruption feedback for successful export/snapshot operations and reserve interruptive feedback for actionable failures.

#### Scenario: Success feedback is muted
- **WHEN** export or snapshot save/load succeeds
- **THEN** the user receives subtle status feedback without blocking interaction flow

#### Scenario: Failures remain actionable
- **WHEN** export fails
- **THEN** the user sees an error with a retry action

### Requirement: Unified Cross-Platform Input Interaction
The system SHALL unify touch/mouse/pen behavior through pointer-safe interactions and provide a fixed-position editor for touch-first metadata edits.

#### Scenario: Touch edit opens fixed editor surface
- **WHEN** a touch user activates title, artist, album, time, or track metadata editing
- **THEN** a fixed-position editor SHALL open and allow typing without layout shift

#### Scenario: Desktop editing remains direct
- **WHEN** a desktop user activates edit mode
- **THEN** inline editing behavior SHALL remain available with keyboard commit/cancel controls

#### Scenario: Wheel seeking behaves consistently across input types
- **WHEN** users drag on the click wheel via mouse, touch, or pen
- **THEN** seek input SHALL use a single unified interaction path and avoid duplicate event handling

### Requirement: Export Diagnostics for Deployment Comparison
The system SHALL emit runtime export diagnostics that allow comparison between local and deployed export behavior.

#### Scenario: Diagnostics include build and pipeline context
- **WHEN** an export starts
- **THEN** the system SHALL log build/deploy identifiers and export pipeline metadata

#### Scenario: Diagnostics include capture path outcome
- **WHEN** export completes
- **THEN** the system SHALL log which capture path succeeded or failed
