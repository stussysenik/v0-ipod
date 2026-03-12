## MODIFIED Requirements
### Requirement: Export captures artwork and text accurately
The system SHALL embed album artwork and wrap metadata text consistently when exporting static images.

#### Scenario: Exported artwork is embedded
- **GIVEN** a user-selected album cover
- **WHEN** the user exports a snapshot
- **THEN** the exported image includes the album cover at the same fidelity as the live view.

#### Scenario: Exported metadata wraps consistently
- **GIVEN** long title/artist/album text
- **WHEN** the user exports a snapshot
- **THEN** the export matches the on-screen wrapping without overflow or clipping.

### Requirement: Export supports animated GIF output
The system SHALL allow users to export an animated GIF where timestamps remain static and only the metadata text animates.

#### Scenario: Export GIF with static timestamps
- **GIVEN** a configured snapshot
- **WHEN** the user chooses GIF export
- **THEN** the exported GIF keeps timestamps unchanged while the metadata text animates.

### Requirement: GIF preview provides a manual recording fallback
The system SHALL provide an exact GIF preview that users can manually record if GIF encoding fails.

#### Scenario: Preview / record fallback remains usable
- **GIVEN** a configured GIF export
- **WHEN** the user opens Preview / Record
- **THEN** the app shows the same framed animation used for GIF export with controls outside the capture area.

#### Scenario: GIF export fails after preview is ready
- **GIVEN** preview frames have already been rendered
- **WHEN** GIF encoding fails
- **THEN** the preview remains available and the user can still use the manual recording fallback.

### Requirement: Exports support standardized framing presets
The system SHALL apply framing presets consistently across static and animated exports.

#### Scenario: Export with shared preset framing
- **GIVEN** the user selects a framing preset
- **WHEN** they export PNG, preview GIF, or export GIF
- **THEN** all outputs use the same preset aspect ratio and output dimensions.
