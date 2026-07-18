# Change: Add Marquee Preview Mode and Animated GIF Export

## Why
The current iPod title display is static in the live product, and the existing export pipeline only supports still PNG output. Users want an authentic iPod-style marquee preview plus a shareable animated export that preserves the crawl behavior.

## What Changes
- Add a dedicated Preview Mode for the flat iPod screen that shows the now-playing title using an authentic one-way marquee only when the title overflows.
- Keep Flat View as the editable still-image mode and preserve the current PNG export flow there.
- Add a separate animated GIF export action in Preview Mode that captures the full flat iPod composition.
- Introduce a deterministic marquee timing helper shared by live preview and animated export capture.
- Extend export status handling to reflect GIF encoding progress.

## Impact
- Affected specs: `export-ux`, `now-playing-ui`
- Affected code:
  - `components/ipod/ipod-classic.tsx`
  - `components/ipod/ipod-screen.tsx`
  - `components/ui/marquee-text.tsx`
  - `lib/export-utils.ts`
  - `lib/storage.ts`
  - `tests/interactions.spec.ts`
