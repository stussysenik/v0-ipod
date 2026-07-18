# export-ux Specification

## Purpose
Governs the 2D export experience: animated GIF and deterministic flat export, non-blocking animated feedback and traceability, unified cross-platform input, a collapsible mobile toolbox, boundary constraints, and deployment-comparison diagnostics.
## Requirements
### Requirement: Preview-Mode Animated GIF Export
The system SHALL provide a dedicated animated GIF export action for Preview Mode that captures the full flat iPod frame with the now-playing marquee in motion.

#### Scenario: Preview mode exports a full-frame GIF
- **WHEN** the user switches to Preview Mode
- **AND** starts an animated export
- **THEN** the system SHALL generate a `.gif` download of the full flat iPod composition
- **AND** the title marquee SHALL follow the same timing profile as the live preview

#### Scenario: Flat PNG export remains unchanged
- **WHEN** the user is in Flat View
- **AND** starts the existing still export
- **THEN** the system SHALL continue to generate a `.png` export using the current deterministic flat-image pipeline

### Requirement: Animated Export Feedback
The system SHALL surface animated-export progress distinctly from still-image export so the user understands when GIF rendering is still encoding.

#### Scenario: GIF export enters encoding state
- **WHEN** animated GIF export starts
- **THEN** the system SHALL show a preparing state followed by an encoding state before success or error

#### Scenario: GIF export resets interaction chrome
- **WHEN** animated GIF export starts
- **THEN** toolbox and settings panels SHALL be closed before capture begins

### Requirement: Animated Export Traceability
The system SHALL keep animated exports aligned with existing filename traceability conventions.

#### Scenario: GIF filenames include incremental export ids
- **WHEN** a GIF export succeeds
- **THEN** the downloaded filename SHALL include the next incremental export identifier
- **AND** use the `.gif` extension

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

### Requirement: Collapsible Mobile Toolbox
The system SHALL present a compact toolbox toggle on mobile viewports that can hide or reveal the floating controls without removing access to editing, view switching, and export actions.

#### Scenario: Mobile toolbox collapsed by default
- **WHEN** the app loads on a mobile viewport
- **THEN** only the toolbox toggle is visible
- **AND** the full tools stack remains hidden until expanded

#### Scenario: Mobile toolbox closes after outside interaction
- **WHEN** the mobile toolbox is open
- **AND** the user taps outside the toolbox area
- **THEN** the toolbox closes
- **AND** any open settings popover is also closed

### Requirement: Interaction Chrome Reset Includes Toolbox
The system SHALL reset transient UI chrome, including toolbox and settings state, during major interaction transitions that prioritize a clear canvas.

#### Scenario: Export start clears toolbox chrome
- **WHEN** the user starts an export in flat view
- **THEN** toolbox and settings panels are closed before capture begins

### Requirement: Boundary-Constrained Flat Export
The system SHALL support a constrained export capture mode that removes artifact-prone external shadow composition so exported images remain clean and deterministic on mobile and desktop.

#### Scenario: Constrained export avoids clipped edge shadows
- **WHEN** a user exports in flat mode
- **THEN** capture uses a detached constrained frame
- **AND** external shell/screen/wheel drop shadows are suppressed in the export capture path

### Requirement: Incremental Export ID
The system SHALL assign an incremental export identifier starting at `0000`, persist it on-device, and include it in export filenames for traceability.

#### Scenario: Export filename increments across successful exports
- **WHEN** the user performs two successful exports
- **THEN** the first filename includes `0000`
- **AND** the second filename includes `0001`

