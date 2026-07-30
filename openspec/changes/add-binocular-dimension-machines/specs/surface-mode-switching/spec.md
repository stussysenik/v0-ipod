# surface-mode-switching

## MODIFIED Requirements

### Requirement: Visible dimension switching across three barrels

The surface SHALL present one visible dimension control offering three positions — 2D, 2.5D and
3D — in a consistent header position, using the studio control language. Switching SHALL NOT
require the command palette, and every position SHALL be reachable from every other position in
one gesture.

The control SHALL show the dimension it holds, not only its name. Switching SHALL preserve the
customization because both barrels project one document, rather than by copying customization
between surfaces.

*Was: a bidirectional 2D↔3D pair of affordances, one on `/` opening `/3d` and a mirror on `/3d`
returning, each carrying customization across the navigation. Two affordances describing a
two-position axis cannot express a third position, and carrying customization across a boundary
is what made two state models diverge in the first place.*

#### Scenario: Touch user moves between all three dimensions

- **WHEN** a touch user taps the dimension control and selects another dimension
- **THEN** that dimension presents the current customization, unchanged
- **AND** every other dimension is reachable from there in one gesture

#### Scenario: Switching does not copy the customization

- **WHEN** the dimension changes
- **THEN** no customization is serialized, transported, or re-decoded as part of the switch

### Requirement: A route names a barrel, and the inline 3D render mode stays archived

A route SHALL name a dimension rather than own a surface, so an existing address continues to
resolve and a dimension can be linked to directly.

The workbench rail SHALL NOT offer an inline 3D render mode. The inline `viewMode:"3d"` render
path SHALL remain archived behind `FEATURE_FLAGS.SHOW_3D_VIEW_MODE` (code intact, not deleted —
see `shipped-surface-minimalism`), and while that flag is off the mode SHALL be unreachable from
the rail, the view-mode list, and the command palette. Models persisted with `viewMode:"3d"`
SHALL hydrate as `preview`. The dimension axis SHALL NOT be implemented by reviving that path:
a render mode of one surface and a barrel projecting the shared document are different things.

*Was: `/3d` is the only 3D surface, reached by navigation. 3D is now one barrel of the dimension
axis, so the route no longer owns the surface — but the archived inline render mode stays
archived, and this change is not its resurrection.*

#### Scenario: An existing address resolves to its dimension

- **WHEN** a previously published `/3d` link is opened
- **THEN** the surface presents the 3D dimension with the current document

#### Scenario: Legacy 3D view mode still migrates

- **WHEN** a stored workbench model with `viewMode:"3d"` is hydrated
- **THEN** the workbench renders `preview` mode without error and persists the migrated mode

#### Scenario: The archived render mode stays unreachable

- **WHEN** the visitor searches the rail, the view-mode list, and the command palette while `SHOW_3D_VIEW_MODE` is off
- **THEN** no inline 3D render mode is offered, and 3D is reachable only as a dimension
