# Change: Add iPod classic revision presets, dual interaction modes, and full snapshot state

## Why
The current anniversary work is improving one hero surface, but the product vision is now broader and more precise: support multiple historically grounded iPod classic revision attempts, let users switch between an authentic iPod-style navigation model and a fast authoring workflow, and save complete song moments or ranges as portable state. The existing snapshot model only stores metadata plus a small UI subset, which is too thin for future API work, repeatable exports, or revision-specific fidelity.

## What Changes
- Add documented iPod classic revision presets so the interface can render distinct version attempts instead of one averaged device.
- Add a settings-level interaction toggle between direct authoring/editing and authentic iPod-style OS navigation.
- Expand snapshot persistence into a versioned full-state contract that includes song metadata, playback moment or range, device preset, finish, backdrop, view mode, interaction mode, and export-relevant state.
- Define a reference hierarchy so geometry, UI chrome, and line weights are resolved from documented sources instead of intuition.
- Keep the current anniversary hero work as the rendering foundation, but extend it into a simulator-ready architecture rather than a single static composition.

## Impact
- Affected specs: `hardware-presets`, `interaction-models`, `snapshot-state`, `historical-fidelity`
- Affected code: `components/ipod/ipod-classic.tsx`, `components/ipod/ipod-screen.tsx`, `components/ipod/click-wheel.tsx`, `lib/storage.ts`, `lib/song-snapshots.ts`, `types/ipod.ts`, export utilities under `lib/`, settings UI under `components/`, and Playwright regression coverage under `tests/`
