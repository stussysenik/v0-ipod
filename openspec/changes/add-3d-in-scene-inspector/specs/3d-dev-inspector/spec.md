## ADDED Requirements

### Requirement: Live stats HUD

The `/3d` stage SHALL render a development-only stats HUD that reports live GPU/utilization
readings drawn from `gl.info` and the render loop: frames per second, milliseconds per frame,
draw calls, triangles, geometry count, and texture count. The HUD MUST update from `useFrame`
(throttled to a few Hz, not every frame) and MUST be absent from production builds and from
exports.

#### Scenario: HUD shows live performance readings

- **WHEN** the `/3d` stage is open in development
- **THEN** a stats HUD is visible showing FPS, ms/frame, draw calls, triangles, geometries, and textures
- **AND** the values update as the scene changes (e.g. toggling a light or orbiting changes draw calls)

#### Scenario: HUD is absent in production and exports

- **WHEN** the app is built for production or an export is captured
- **THEN** the stats HUD is not present (dead-code eliminated, zero bundle cost, never baked into a frame)

### Requirement: Click-to-pick mesh inspector

The stage SHALL provide a "Pick" mode that, when enabled, selects a mesh by raycasting a click
against the live scene graph (recursing into groups) and surfaces the selected node in the
inspector panel. Pick mode MUST be opt-in via a toggle and MUST guard against drag (a pointer
that travels more than a small threshold is treated as an orbit drag, not a pick) so it does not
interfere with the existing `OrbitRig` drag-to-orbit.

#### Scenario: Picking selects the clicked mesh

- **WHEN** Pick mode is on and the user clicks a device mesh on the canvas
- **THEN** the clicked mesh becomes the selected node, highlights, and its properties appear in the panel

#### Scenario: Drag is not mistaken for a pick

- **WHEN** Pick mode is on and the user drags on the canvas (pointer travels > 6px)
- **THEN** the gesture orbits the camera as normal and no selection occurs

#### Scenario: Picking is inert when off

- **WHEN** Pick mode is off
- **THEN** all clicks/drags on the canvas orbit normally and the inspector never raycasts

### Requirement: Scene-graph browser

The inspector SHALL render a collapsible tree of the live `scene` graph, traversed recursively
from `scene.children`, showing each node's `name` (falling back to its `type`) and visibility.
Clicking any tree row selects and highlights that node, so the user can drill into groups, meshes,
and lights without guessing. The selected row is accent-colored.

#### Scenario: Tree reflects the live scene

- **WHEN** the `/3d` stage is open in development
- **THEN** a scene tree lists the nested nodes (device group → body/face/wheel groups → meshes)
- **AND** expanding a group reveals its children

#### Scenario: Selecting from the tree highlights the mesh

- **WHEN** the user clicks a mesh row in the scene tree
- **THEN** that mesh is selected, highlighted in the canvas, and its properties load in the editor

### Requirement: Live property editor

For the selected node, the inspector SHALL show editable transform (position, rotation in
degrees, scale), the material fields it actually has (color, roughness, metalness, clearcoat,
clearcoatRoughness, opacity, transparent, emissive — introspected from `material.type`), read-only
geometry info (type, bounding radius, vertex count), and object fields (name, visible,
renderOrder). Edits write straight to the three object/material and update the canvas
immediately. Edits MUST affect only the live three objects, never the persisted workbench model.

#### Scenario: Editing a transform updates the canvas

- **WHEN** the user changes the selected mesh's position.x in the editor
- **THEN** the mesh moves in the canvas immediately (WYSIWYG)

#### Scenario: Only the material's own fields are shown

- **WHEN** the selected mesh uses a `meshPhysicalMaterial`
- **THEN** the editor shows clearcoat/clearcoatRoughness
- **AND** when a `meshBasicMaterial` is selected, those metalness/clearcoat fields are hidden

#### Scenario: Edits are compose-time only

- **WHEN** the user edits a property and then reloads the page
- **THEN** the persisted workbench model is unchanged and the scene restores from it

### Requirement: Dev-only gating and toggle

The entire inspector (core + panel) SHALL mount only when `process.env.NODE_ENV ===
"development"` and be dead-code eliminated otherwise. In development it SHALL be toggleable with
the `i` hotkey so it can be hidden while composing.

#### Scenario: Inspector auto-enables in dev

- **WHEN** the `/3d` stage runs in development
- **THEN** the inspector is present and the stats HUD is visible

#### Scenario: Inspector is gone in production

- **WHEN** the app is built/run in production
- **THEN** no inspector code is bundled or mounted

#### Scenario: Hotkey toggles the overlay

- **WHEN** the user presses `i` in development
- **THEN** the inspector panel hides or shows without affecting the scene
