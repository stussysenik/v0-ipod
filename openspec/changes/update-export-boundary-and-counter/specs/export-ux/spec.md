## ADDED Requirements
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
