## ADDED Requirements

### Requirement: Centralized Finish Record

The system SHALL represent a finish as a single canonical record (`StudioFinish`) containing an id, a human label, a generation family, ALL seven surface colors explicitly (case, wheel ring, wheel center, back, edge, bezel, stage), and the name of a paired lighting rig. No surface in a built-in finish MAY be optional or derived at apply time.

#### Scenario: Applying a finish fully determines the look
- **WHEN** the user taps any finish in the library
- **THEN** all seven surface colors AND the paired lighting rig are applied in one gesture
- **AND** no surface (including the edge band) retains a stale value from the previous look

#### Scenario: Single source of truth
- **WHEN** code needs preloaded finishes, curated combinations, or factory looks
- **THEN** they are read from the one finish library module; no parallel `FinishAsset` or `DeviceLook` shapes exist

### Requirement: Apple Generation Color Library

The finish library SHALL ship named, research-grounded Apple factory colorways grouped by generation: iPod classic 6G (Silver, Black), iPod mini 1G (Silver, Gold, Pink, Blue, Green), iPod nano 2G (Black, Blue, Green, Pink, (PRODUCT) RED), iPod nano 4G (Purple, Yellow, Orange), and the U2 Special Edition (black body with red click wheel). Labels SHALL carry the generation and Apple's marketing color name.

#### Scenario: PRODUCT(RED) reads as red
- **WHEN** the user applies the Nano 2G (PRODUCT) RED finish
- **THEN** the case renders as saturated anodized red under the finish's paired rig (not orange-shifted, not maroon-crushed)

#### Scenario: U2 Edition pairs black case with red wheel
- **WHEN** the user applies the U2 Special Edition finish
- **THEN** the case is near-black, the click-wheel ring is the U2 red, and the paired dark rig keeps both legible

### Requirement: Finish-Rig Pairing

Every built-in finish SHALL reference a lighting rig by name, chosen so the case color reads correctly on metal: light neutral finishes pair with a bright studio rig, saturated anodized finishes pair with an achromatic chroma-preserving rig, dark finishes pair with a dark editorial rig. A rig name that no longer resolves SHALL degrade to the factory default rig.

#### Scenario: Saturated finishes use neutral light
- **WHEN** a saturated finish (e.g. Nano 4G Orange) is applied
- **THEN** the paired rig's direct light sources are achromatic so the anodized hue is not tinted

#### Scenario: Missing rig degrades gracefully
- **WHEN** a saved finish references a rig name absent from the preset registry
- **THEN** the factory default rig is applied instead and the colors still apply fully

### Requirement: Share-Ready Stage

Each built-in finish SHALL include a stage (background) color completing the composition, so an export taken immediately after applying a finish is share-ready with no further setup.

#### Scenario: Export after one tap
- **WHEN** the user applies a finish and exports
- **THEN** the exported frame contains the finish's stage background exactly as seen on the live canvas

### Requirement: User-Saved Finishes

The system SHALL let the user save the current look as a custom finish (family "custom") capturing all seven surfaces and the active rig name, persisted locally, restorable in one tap, and deletable. Built-in finishes SHALL NOT be deletable.

#### Scenario: Save and restore
- **WHEN** the user saves the current look and later taps the saved entry
- **THEN** all surfaces and the rig return exactly to the saved state
