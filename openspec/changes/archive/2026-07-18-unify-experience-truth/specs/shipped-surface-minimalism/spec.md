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

### Requirement: The device is the product — no chrome restates it

The portfolio surfaces SHALL NOT wrap the device in chrome that repeats what the device
itself renders. The iPod's own screen prints the feed title as its first row, so a
heading above it MUST NOT restate the title or author, and an instruction caption
("wheel to scroll…") MUST NOT be presented visually — the product has to explain itself.
This applies to `/portfolio` and `/3d-portfolio` alike.

#### Scenario: No duplicate title above the device

- **WHEN** `/portfolio` or `/3d-portfolio` renders
- **THEN** the feed title appears on the device's screen and nowhere else in the DOM
  chrome around it

#### Scenario: The interaction hint is spoken, not captioned

- **WHEN** the device element is focused by assistive technology
- **THEN** an `aria-describedby` target describes the wheel, the arrow keys, Enter and
  Escape, and that description is not rendered visibly

### Requirement: /3d-portfolio ships no camera control

`/3d-portfolio` SHALL suppress the in-canvas `Product / Front / Back` focus segment by
passing a controlled `focus`, and SHALL expose no camera control other than the orbit
lock. The focus segment is the control D1 deleted from `/3d` as the most confusing
element in the mobile shot; a visitor reading the works does not need a camera. The
pinned value MUST be the rig's own default so the composition is unchanged.

#### Scenario: The focus pill does not render

- **WHEN** `/3d-portfolio` renders
- **THEN** no `Product / Front / Back` segment appears anywhere on the stage

#### Scenario: Orbit lock is the only camera affordance

- **WHEN** the `/3d-portfolio` stage chrome is enumerated
- **THEN** the orbit lock is the only camera control, and it is a studio primitive
