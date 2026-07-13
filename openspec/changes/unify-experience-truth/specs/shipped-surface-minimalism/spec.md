# shipped-surface-minimalism

## ADDED Requirements

### Requirement: Only proven surfaces render

The shipped frontend SHALL present only finished, proven controls. Exploratory or
work-in-progress surfaces MUST NOT render to the public, and no shipped control
SHALL carry a `WIP` badge. Specifically, the `/` rail SHALL expose exactly five
controls — Flat, Preview, 3D Studio (navigating to `/3d`), Zen, and Copy share
link — and every other rail control (inline 3D Experience mode, ASCII mode, Focus
mode, the transport play/pause, reset defaults, and the PNG/GIF/MP4 export rail)
SHALL be archived. Actions a user could still want SHALL remain reachable from the
command palette.

#### Scenario: No WIP badge reaches the audience

- **WHEN** a first-time visitor loads `/`
- **THEN** the rail shows exactly the five proven controls
- **AND** no control anywhere on the page is badged `WIP`

#### Scenario: Archived actions stay reachable

- **WHEN** the user opens the command palette on `/`
- **THEN** the archived actions that remain useful (reset, share, config
  import/export, open the 3D studio) are still runnable from it

### Requirement: Archived means flagged off, not deleted

Retiring a surface SHALL hide it behind a `lib/feature-flags.ts` flag whose comment
records that it is archived and how to restore it; the surface's code path SHALL
remain intact and functional when the flag is flipped back to `true`. Retired
components that are no longer imported SHALL be moved to an archive directory rather
than removed. No archived capability SHALL be deleted from the repository as part of
this change.

#### Scenario: One flag flip restores the surface

- **WHEN** an archived flag (e.g. `SHOW_WORKBENCH_EXPORTS`) is set back to `true`
- **THEN** the surface renders and functions exactly as it did before archival, with
  no other code change required

#### Scenario: Deletion is limited to duplicate styling

- **WHEN** a surface adopts the studio control primitives
- **THEN** the bespoke one-off control styles it replaces are deleted in place, while
  the surface's own feature code is preserved
