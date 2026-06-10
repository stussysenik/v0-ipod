# 3d-lighting-determinism

## ADDED Requirements

### Requirement: Lighting SHALL be decoupled from material albedo

Switching lighting rigs (including lights-off/technical-flat) SHALL never read
as a material color change. The technical-flat view SHALL present each
surface's true albedo via a flat-shaded material presentation, not by zeroing
lights on PBR materials.

#### Scenario: Lights off keeps the steel back gray

- **WHEN** the user toggles LIGHTS OFF on a device with the factory `#cfd3d7`
  polished steel back
- **THEN** the back renders as flat gray `#cfd3d7`, not black

#### Scenario: Rig switch preserves perceived case color

- **WHEN** the rig changes Apple → Designer Dark → technical flat
- **THEN** sampled body pixels keep hue/lightness within a perceptual tolerance
  of the case albedo in all three

### Requirement: Light SHALL draw the device contours

The rig SHALL include rim/edge lights grazing the chassis so the silhouette and
feature lines (wheel ring, screen bezel transition, chamfers) are articulated
by light ("detail light"), with intensity derived from case luminance.

#### Scenario: Black device outlined by light, not lines

- **WHEN** a black 6G device renders under the default rig with Cartoon off
- **THEN** its silhouette is separated from the stage by rim highlights and the
  wheel/bezel features are legible without painted strokes

### Requirement: The principal face reflection SHALL be an oval softbox

The key reflection on the device face SHALL come from an oval/elliptical
softbox form (front-center), reproducing the studio-product look on the glossy
face and wheel.

#### Scenario: Face reflection shape

- **WHEN** the front of the device is inspected under the default rig
- **THEN** the dominant specular shape on the face is a soft oval, not a
  rectangle

### Requirement: Dark devices SHALL render with dramatic high contrast

The dark-device rig SHALL keep blacks black (no gray wash) while preserving
specular bite and feature legibility.

#### Scenario: Black is black

- **WHEN** the Black 6G finish renders under the dark rig
- **THEN** body shadow regions sample below a defined lightness ceiling while
  rim highlights stay above a defined floor

### Requirement: Neutral surfaces SHALL stay color-pure under colored lights

Warm/cool light tints SHALL NOT shift near-neutral surfaces' hue beyond a
small OKLCH chroma epsilon (fighting unwanted color transformations / impurity).

#### Scenario: Silver under warm key

- **WHEN** the Silver 6G finish renders under the Apple rig (warm key, cool fill)
- **THEN** sampled aluminum pixels keep OKLCH chroma below the configured
  epsilon (they read as neutral metal, not tinted)

### Requirement: Exports SHALL be WYSIWYG with the live lighting

A clip/still exported under any rig SHALL match the live canvas pixels
(existing color-resolve contract), including all new lighting features.

#### Scenario: Oval key survives export

- **WHEN** a still is exported under the default rig
- **THEN** the oval face reflection in the PNG matches the live view
