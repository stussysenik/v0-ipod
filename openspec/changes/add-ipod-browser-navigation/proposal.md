# Change: iPod-as-Browser Navigation & Slug Previews

## Why

The original iPod menu is already a browser: hierarchical lists, wheel scroll, center to select, menu to go back. Mapping the content feed onto that primitive turns the device into a content browser — "the iPod circle as your internet". Each work opens as a self-contained, link-bio-grade visual preview. This is the interaction layer between the feed (data) and the stage (space).

## What Changes

- Add a **navigation model** (reducer/state) driving the menu tree: list focus, drill-in, back, and select — wheel/keyboard/touch driven.
- Selecting a work follows IA model **C**: a preview expands out of the device's screen into a full-size surface in the page (real space for real content), with a return to the device.
- Render each work slug as a **link-bio preview** (cover, title, one-line, the work previewing itself) — both on-screen (list/now-playing) and as the expanded surface.
- Navigation operates entirely on the feed model; no content is hardcoded.

## Impact

- Affected specs: `browser-navigation` (new capability)
- Depends on: `add-ipod-content-feed` (data), `refactor-stage-keepout-zones` (the expand surface respects the keep-out zone / docked layout)
- Affected code: `lib/nav/machine.ts`, `components/ipod/browser/*`, `tests/nav.spec.ts`
