# surface-mode-switching Specification

## Purpose
TBD - created by archiving change unify-experience-truth. Update Purpose after archive.
## Requirements
### Requirement: Visible bidirectional 2D↔3D switching

The workbench (`/`) SHALL present a visible header affordance that opens the `/3d`
studio, and `/3d` SHALL present a mirrored affordance that returns to `/`. Both
SHALL use the studio control language and occupy equivalent header positions so
switching reads as one 2D/3D toggle. Neither direction SHALL require the command
palette.

#### Scenario: Phone user reaches 3D and back

- **WHEN** a touch user on `/` taps the 3D affordance in the header
- **THEN** the browser navigates to `/3d` with the current shell/stage/engraving
  customization intact
- **AND** tapping the mirrored 2D affordance on `/3d` returns to `/` with the same
  customization

### Requirement: The /3d route is the only 3D surface

The workbench rail SHALL NOT offer an inline 3D render mode; `/3d` SHALL be the only
3D surface, reached by navigation. The inline `viewMode:"3d"` render path SHALL be
archived behind `FEATURE_FLAGS.SHOW_3D_VIEW_MODE` (code intact, not deleted — see
`shipped-surface-minimalism`), and while that flag is off the mode SHALL be
unreachable from the rail, the view-mode list, and the command palette. Models
persisted with `viewMode:"3d"` SHALL hydrate as `preview`.

#### Scenario: Legacy 3D view mode migrates

- **WHEN** a stored workbench model with `viewMode:"3d"` is hydrated
- **THEN** the workbench renders `preview` mode without error and persists the
  migrated mode

#### Scenario: Command palette routes to the one truth

- **WHEN** the user runs a 3D-related command from ⌘K on `/`
- **THEN** it navigates to `/3d` rather than toggling an inline render mode

