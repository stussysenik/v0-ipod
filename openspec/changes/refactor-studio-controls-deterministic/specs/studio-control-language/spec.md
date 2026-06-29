## ADDED Requirements

### Requirement: Single Precision-Instrument Control Set

The system SHALL provide one set of stylized control primitives in
`components/ui/studio-controls.tsx` — `StudioButton`, `StudioSegment`, `StudioChip`,
`StudioField`, `StudioLabel`, and `StudioRow` — that every studio surface uses instead
of ad-hoc Tailwind control strings. Each primitive SHALL share one radius token, one
type scale, and one microinteraction timing table.

#### Scenario: Authoring an interactive control

- **GIVEN** a panel needs a button, segmented control, chip, or value field
- **WHEN** the contributor composes it
- **THEN** they SHALL use a `Studio*` primitive rather than hand-rolled control classes
- **AND** the rendered control SHALL share the same radius, type scale, and hover
  (~130ms) / selection (~220ms) ease-out timing as every other studio control

#### Scenario: Radius is bound to the product

- **GIVEN** a studio control renders next to the iPod device
- **WHEN** its corner radius resolves
- **THEN** the radius SHALL derive from the device radius family token, not an ad-hoc
  `rounded-*` literal

### Requirement: Selection State Has Solid-Fill Affordance

The system SHALL render the selected state of `StudioButton`, `StudioSegment`, and
`StudioChip` as a solved solid fill, and the resting state as a hairline border, so
selection is communicated by a fill change rather than only a border-color change.

#### Scenario: Selecting a segment

- **GIVEN** a `StudioSegment` with one active and several inactive segments
- **WHEN** the user selects a segment
- **THEN** the active segment SHALL show a solid filled surface distinct from the
  resting hairline segments
- **AND** the change SHALL be perceivable without relying on border color alone

### Requirement: One Accent Across All Controls

The system SHALL resolve every control accent (selection, focus ring, active chip) from
a single accent source, eliminating the competing `#0048FF`, `#0F62FE`, and
`ring-blue-500` values currently in use.

#### Scenario: Rendering accents across panels

- **GIVEN** controls across the colors, settings, lighting, and export panels
- **WHEN** they render their selected or focused states
- **THEN** all accent color SHALL trace to one solved accent token
- **AND** no control SHALL reference a second hardcoded accent hex
