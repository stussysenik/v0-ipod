# Change: Update export animation, add GIF preview/output, and improve palette UX

## Why
Exports are missing album artwork and text wrapping, and the original text-only animation plus GIF output are needed for sharing. GIF export also needs a reliable manual fallback so users can screen-record a clean preview when encoding fails. Mobile palette controls are also difficult to reach and could benefit from a more creative, curated experience.

## What Changes
- Fix export capture so album artwork is embedded reliably and metadata text wraps consistently.
- Restore the original text-only animation where timestamps remain static while text animates.
- Add a GIF export option that preserves timestamps and animates only text.
- Add an exact GIF preview / record workflow that reuses captured frames for playback, download, and manual recording fallback.
- Add standardized framing presets shared by PNG export, GIF export, and GIF preview.
- Add a Chromium interaction timing budget for GIF preview controls.
- Improve mobile palette usability with a section jump/compact layout and add a curated “Inspiration” palette (colors with recognizable product/food/team vibes).

## Impact
- Affected specs: export, animations, ui
- Affected code: components/ipod/ipod-classic.tsx, components/ipod/ipod-screen.tsx, components/ipod/editable-text.tsx, components/ui/marquee-text.tsx, lib/export-utils.ts, lib/gif-export.ts, lib/export-scene.ts
