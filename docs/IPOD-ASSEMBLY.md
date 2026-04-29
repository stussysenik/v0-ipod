# iPod Assembly Vocabulary

This document records the naming model for the iPod UI so the code reads like a
physical product assembly rather than an arbitrary React tree.

## Why This Exists

The current codebase mixes three concerns under overlapping names:

- hardware identity such as `classic-2007`
- physical parts such as shell, display, and click wheel
- app orchestration such as export, persistence, and editing

That overlap makes the code harder to read for designers, recruiters, and
engineers who approach the project like a product assembly.

## Naming Rules

- Use `classic`, `2007`, `2008`, and `2009` only for hardware revision or preset identity.
- Use `device` for the assembled iPod object.
- Use `shell` for the outer enclosure only.
- Use `display` for the physical LCD assembly including surround, glass, and status chrome.
- Use `screen` only for screen content if the distinction matters.
- Use `scene` for content modes rendered on the display, such as menu and now playing.
- Use `panel` for grouped content regions inside a scene.
- Use `editor` for authoring-only overlays and inline editing primitives.
- Use `workbench` for the app-level orchestrator that owns state, export, and mode switching.

## Current Provenance

The current implementation already contains the beginnings of this split:

- [components/ipod/ipod-classic.tsx](/Users/s3nik/Desktop/v0-ipod/components/ipod/ipod-classic.tsx:243) is the top-level workbench, even though the filename still reads like a hardware part.
- [components/ipod/ipod-device-shell.tsx](/Users/s3nik/Desktop/v0-ipod/components/ipod/ipod-device-shell.tsx:1) is the physical outer enclosure.
- [components/ipod/click-wheel.tsx](/Users/s3nik/Desktop/v0-ipod/components/ipod/click-wheel.tsx:1) is the hardware control assembly.
- [components/ipod/ipod-screen.tsx](/Users/s3nik/Desktop/v0-ipod/components/ipod/ipod-screen.tsx:1) currently combines display chrome and screen scenes in one file.

Visual provenance and token provenance currently live in:

- [lib/color-manifest.ts](/Users/s3nik/Desktop/v0-ipod/lib/color-manifest.ts:1)
- [lib/design-system.ts](/Users/s3nik/Desktop/v0-ipod/lib/design-system.ts:1)
- [lib/ipod-classic-presets.ts](/Users/s3nik/Desktop/v0-ipod/lib/ipod-classic-presets.ts:1)
- [docs/research/Enhancing iPod Classic Visual Realism.pdf](/Users/s3nik/Desktop/v0-ipod/docs/research/Enhancing%20iPod%20Classic%20Visual%20Realism.pdf)

## Recommended Mental Model

Treat the UI like a CAD assembly:

- `workbench`
  - application state, export flow, settings, scene composition
- `device`
  - assembled iPod object in the viewport
- `shell`
  - front face and enclosure finish
- `display`
  - display housing, glass, status chrome
- `scene`
  - menu scene, now playing scene
- `panel`
  - artwork panel, track metadata panel, playback footer
- `control`
  - click wheel, progress control, rating control
- `editor`
  - fixed editor, editable text, editable time

## Target Refactor Direction

The intended long-term split for the current `ipod-screen.tsx` file is:

- `ipod-display`
  - display surround
  - glass overlay
  - status bar
- `ipod-menu-scene`
- `ipod-now-playing-scene`
  - artwork panel
  - track metadata panel
  - playback footer

This document is intentionally plain Markdown. MDX is not required yet because
the repository does not currently ship a docs site or Storybook layer that
would benefit from embedded interactive examples.
