## ADDED Requirements

### Requirement: Separately addressable edge material zone

The device's side/rim band (the chassis edge the eye reads as the "edge") SHALL be a
separately addressable material zone, decoupled from the steel back shell. Today the
`bodyGeo` ExtrudeGeometry back shell rolls over the sides and paints them with the single
`backColor`; this change MUST give the side/bevel faces their own material so they can carry
a color independent of the back cap. The back cap MUST continue to render as polished steel
(full metalness, satin roughness, env-driven) regardless of the edge color.

#### Scenario: Edge is its own material, not the back's
- **WHEN** the device is rendered on `/3d`
- **THEN** the side/rim faces resolve to a distinct material zone from the back cap
- **AND** changing the edge color leaves the back cap color and steel finish unchanged

#### Scenario: Seam stays crisp after the split
- **WHEN** the front face, the edge band, and the back cap meet at the machined seams
- **THEN** the seams read as crisp parting lines with no doubled bevels and no z-fighting

### Requirement: Edges color control

The `/3d` color cockpit SHALL expose an **Edges** control that sets the device edge color
independently of the **Back** control, dispatching a `SET_EDGE_COLOR` action that updates an
`edgeColor` field on the presentation state. The **Back** control MUST remain present and
independently set the back-shell color.

#### Scenario: Editing edges does not move the back
- **WHEN** the user sets the **Edges** color to a value different from the **Back** color
- **THEN** the side/rim band renders the new edge color
- **AND** the back shell still renders the unchanged back color

#### Scenario: Edges and Back are separate rows
- **WHEN** the user opens the color cockpit
- **THEN** both an **Edges** row and a **Back** row are present, each editable on its own

### Requirement: Edge color defaults to the back color

The edge color SHALL default to the current back color so that existing devices look
identical until the edge is deliberately edited. Initial state, hardware-preset selection,
saved-finish/look application, and snapshot loads that carry no edge value MUST all resolve
`edgeColor` to the back color.

#### Scenario: Unedited device is visually unchanged
- **WHEN** a device loads with no manual edge edit (fresh state, a preset, or a finish/look)
- **THEN** the edge color equals the back color and the device looks exactly as before

#### Scenario: Legacy snapshot without an edge value
- **WHEN** a saved snapshot that predates this feature (no `edgeColor`) is loaded
- **THEN** the edge color resolves to that snapshot's back color rather than failing or
  rendering a default unrelated color

### Requirement: Edge color persistence

The edge color SHALL be normalized and persisted alongside the other presentation colors so
a deliberately edited edge survives reloads and round-trips through saved finishes, looks,
and studio shots, falling back to the back color when no stored edge value is present.

#### Scenario: Custom edge survives reload
- **WHEN** the user sets a custom edge color and reloads `/3d`
- **THEN** the persisted edge color is restored

#### Scenario: Saved finish/look round-trips the edge
- **WHEN** a finish, look, or studio shot is saved and later recalled
- **THEN** the recalled state reproduces the same edge color it was saved with

### Requirement: Edge color composes with finishes and lighting

The edge color SHALL compose with the anodized-aluminum material model and the default
lighting rig the same way the other part colors do — it tints a real metal zone under the
env-first rig rather than producing a flat painted band, and it MUST stay readable as its
own part against both light and dark back colors.

#### Scenario: Light edge does not blow out
- **WHEN** a light/silver edge color is shown under the default lighting rig
- **THEN** the edge reads as brushed metal with intact specular shaping and no clip to flat
  white

#### Scenario: Edge reads distinct from a dark back
- **WHEN** a contrasting edge color is set against a dark/black back
- **THEN** the rim band reads as its own distinct part, not merged into the back shell
