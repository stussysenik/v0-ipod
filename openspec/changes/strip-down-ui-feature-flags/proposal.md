# Change: Strip Down UI via Feature Flags

## Why
The workbench has accumulated several UI elements (hardware presets, interaction modes, color spectrum palettes, view modes) that need to be temporarily hidden behind feature flags to streamline the current experience without losing the code.

## What Changes
- Add a `FEATURE_FLAGS` constants file to gate optional UI sections
- Gate these specific UI elements with feature flags (hidden by default):
  - "Classic 2009 · Late 160GB" hardware preset button (5th preset, `classic-2009`)
  - "iPod OS Original" interaction mode button
  - OKLCH Spectrum case color palette
  - OKLCH Ambient background color palette
  - "3D Experience" view mode button
  - "Focus Mode" view mode button
  - "ASCII Mode" view mode button
- Fix: In iPod OS interaction mode, pressing the Menu button on the click wheel must always navigate back to the menu/software screen rather than staying on Now Playing

## Impact
- Affected specs: New `workbench-ui` capability
- Affected code: `lib/feature-flags.ts` (new), `components/ipod/workbench/ipod-classic-workbench.tsx`
