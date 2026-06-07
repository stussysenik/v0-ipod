## ADDED Requirements

### Requirement: Anodized aluminum material model
The 3D iPod front face and click wheel SHALL be rendered as anodized aluminum — dyed
metal, not dielectric paint — using full metalness with a satin roughness, drawing
brightness primarily from the environment map so the albedo tints the reflection rather
than producing a diffuse highlight that clips.

#### Scenario: Light finish does not blow out
- **WHEN** the Silver finish is shown under the default lighting rig
- **THEN** the face reads as cool brushed metal with intact edges and specular shaping
- **AND** no region clips to flat white (no blown-out "doodle" highlight)

#### Scenario: Face is matte relative to the wheel
- **WHEN** the front face and click wheel are compared
- **THEN** the bead-blasted face reads as the rougher/flatter surface and the wheel reads as the slicker part

### Requirement: Authentic 2008 Classic palette
The preloaded finishes SHALL reflect the real iPod Classic (2008) iconic colors —
Silver and Black anodized aluminum — and SHALL NOT present the light finish as
paper-white.

#### Scenario: Finishes are Silver and Black
- **WHEN** the user opens the finish selector
- **THEN** the two preloaded finishes are labeled Silver and Black
- **AND** Silver applies a neutral cool aluminum case (not `#FFFFFF`/`#FBFBFB`)

#### Scenario: Default wheel derives from the case
- **WHEN** the stage loads with the default finish (no manual color edits)
- **THEN** the wheel ring/center colors are derived from the case color so they do not merge into a dark anodized case

### Requirement: CNC-correct concentric wheel geometry
The click-wheel geometry SHALL be concentric and CNC-accurate, with the outer ring and
center button sharing a common center and proportions matching the real device.

#### Scenario: Concentric wheel
- **WHEN** the wheel is viewed dead-on
- **THEN** the outer ring and center button are concentric with clean, industrial edges and no off-center or doubled rings

### Requirement: Wheel form projected from the 2D authority (fills the face)

The 3D click wheel's diameter, select-button size, and vertical seat SHALL be projected
directly from the canonical 2D preset tokens (`preset.wheel.size`, `wheel.centerSize`,
`shell.controlMarginTop`), the same authority the screen uses — NOT a separate hand-tuned
ratio. A prior hand-tuned ratio drew the wheel too small, leaving a dead band on the lower
face ("not used fully"); projecting the 2D form fills the control region and lands the
wheel center at ~0.74 of body height, matching a real 6th-gen face.

#### Scenario: Wheel matches the 2D form and fills the lower face
- **WHEN** the 3D device is viewed front-on
- **THEN** the click wheel reads at the same scale and position as the 2D design, with a tight gap below the screen and no wide empty black band

### Requirement: Realistic click-wheel outer ring illusion

The click wheel's **outer ring** (the touch annulus) SHALL read as a real, distinct,
slightly recessed satin-polycarbonate annulus seated around the select button — catching
one soft broad sheen, sitting a hair below the face plane, with a believable parting line /
micro-shadow at its inner and outer edges — rather than a flat painted disc. On a black
body it MUST read as a distinct charcoal, never pure black. This is the known-hard fidelity
problem and SHALL be treated as a first-class concern.

#### Scenario: Outer ring reads as a real seated annulus
- **WHEN** the wheel is viewed under the default rig and at a 3/4 angle
- **THEN** the outer ring reads as its own recessed, satin part (soft sheen + edge micro-shadow), distinct from both the matte face and the select button — not a flat painted circle

### Requirement: Personalized back engraving

The engraved steel back SHALL carry the project's signature personalization rather than the
stock Apple marks: a carrot 🥕 mark in place of the Apple logo, the line "Designed by Stüssy
Senik", and "Manufactured in Czech Republic". The engraving SHALL keep the recessed
laser-etched look (no flat decal) and the existing fine-print treatment.

#### Scenario: Carrot replaces the Apple logo
- **WHEN** the engraved back is viewed
- **THEN** a carrot mark appears where the Apple logo was, with the signature attribution and origin lines

### Requirement: Storage capacity is consistent everywhere

The storage capacity (GB) SHALL be a single source of truth and read identically across the
device — the on-screen UI, the back engraving's capacity line, and the active preset MUST all
show the same value (no mismatched GB between the screen and the engraving).

#### Scenario: Capacity matches across surfaces
- **WHEN** a capacity is set for the active preset
- **THEN** the same GB value appears on the now-playing/menu UI and on the engraved back

### Requirement: Apple-look cinematic lighting default
The scene SHALL ship a deliberate, well-grounded default lighting rig tuned for product
display — an environment-driven setup with a soft key, cool fill, and gentle separation
rim — calibrated so direct lights shape rather than clip.

#### Scenario: Conservative key, env-first brightness
- **WHEN** the default lighting rig renders either finish
- **THEN** the overall brightness is driven by the studio environment and the key light only adds soft shaping
- **AND** highlights on the matte aluminum remain unclipped
</content>
