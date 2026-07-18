## ADDED Requirements

### Requirement: Versioned Portable State Codec
The system SHALL provide a versioned codec that serializes the complete workbench
model (presentation, playback, metadata, interaction, studio lighting, saved
colors) to a compact URL-safe string and decodes it back through model
normalization, returning null (never throwing) on malformed input.

#### Scenario: Round trip is lossless
- **WHEN** a model is encoded and then decoded
- **THEN** the decoded model is equal to the normalized source model

#### Scenario: Malformed input is safe
- **WHEN** a corrupted or truncated string is decoded
- **THEN** the decoder returns null and no exception escapes

### Requirement: Share Configuration by Link
Both customizer surfaces SHALL restore a configuration from a `s` URL query
parameter on load, and SHALL offer a copy-share-link action that encodes the
current configuration into the page URL.

#### Scenario: Opening a share link restores the look
- **WHEN** a user opens `/` or `/3d` with a valid `?s=` payload
- **THEN** the customizer renders that configuration instead of the locally
  persisted one

#### Scenario: Invalid share link falls back
- **WHEN** the `?s=` payload fails to decode
- **THEN** the surface loads the locally persisted state without an error surface

### Requirement: Export and Import Configuration Files
The customizer SHALL export the current configuration as a downloadable JSON file
and import a previously exported file, applying it through the same validated
decode path as share links.

#### Scenario: Config file round trip
- **WHEN** a user exports a configuration file and imports it later
- **THEN** the customizer state matches the exported configuration

### Requirement: Hardware Preset Persistence Completeness
Persisted hardware preset identifiers SHALL accept every preset in the model
union so no selectable preset silently reverts to default on reload.

#### Scenario: 2008 variant survives reload
- **WHEN** a user selects a 2008 black/silver variant preset and reloads
- **THEN** the same preset is restored
