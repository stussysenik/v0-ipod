## ADDED Requirements

### Requirement: Capture renders through the active camera mode

The still-capture and clip-export pipeline SHALL render through the **active** camera so an
export is WYSIWYG with the live view in both perspective and orthographic modes. When the
camera is orthographic, the offline render target's frustum SHALL be derived from the
orthographic projection (extents + zoom), not the perspective field of view, so an
orthographic export is byte-faithful to the live orthographic view. The active field of view
(perspective) or zoom (orthographic) at capture time SHALL be the one used for the exported
frame.

#### Scenario: Orthographic still is WYSIWYG

- **WHEN** the camera is orthographic and the user exports a still
- **THEN** the exported still uses parallel projection matching the live view
- **AND** the device's framing and size match what was on screen

#### Scenario: Orthographic clip is WYSIWYG

- **WHEN** the camera is orthographic and the user exports a clip
- **THEN** every rendered frame uses the orthographic projection matching the live view

#### Scenario: Perspective export unchanged

- **WHEN** the camera is perspective
- **THEN** the export renders through the perspective camera exactly as before this change

### Requirement: Compose aids excluded from capture

The capture pipeline SHALL exclude every compose-time aid (framing overlay, orientation
gizmo, ground grid, world axes, origin gizmo) from the rendered output, so no aid is ever
present in an exported image or clip regardless of which aids are enabled while composing.

#### Scenario: Aids enabled, export clean

- **WHEN** the framing overlay, gizmo, grid, and axes are all enabled and the user exports
- **THEN** the exported image or clip contains none of those aids
