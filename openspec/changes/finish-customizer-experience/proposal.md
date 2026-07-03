# Change: Finish-line pass — responsive controls, render performance, portable state, interaction robustness

## Why

The customizer is feature-complete but not finished: control placement degrades on
short-landscape phones and the bottom band (toast / dock / notice pill) collides;
a color-slider drag serializes the whole model to localStorage per frame; a saved
look cannot be exported, imported, or shared by link; and there is no error
boundary, no WebGL context-loss recovery, and no test that rapid interaction
cannot wedge the app. This change closes those four gaps so the experience holds
up as a production customizer on any device.

## What Changes

- **Responsive controls (2D + /3d):** short-landscape viewports get the scrollable
  compact layout instead of the overflow-hidden trap; the bottom band is
  coordinated (toast offset clears the dock, soft-notice pill no longer collides);
  the command palette gains a touch trigger in the compact dock; `/3d` drops the
  lone `min-h-screen` for `min-h-dvh`.
- **Render performance:** debounced (with flush) model persistence replaces the
  per-change synchronous localStorage write; the drop-settle spring no longer
  re-triggers on color-only edits; duplicate 2D viewport listeners collapse into
  one source.
- **Portable customizer state:** a versioned codec (`portable-state`) that
  serializes the complete model (presentation + studio lighting + saved colors),
  restored from a `?s=` URL param on both surfaces, plus export/import as a JSON
  file and a copy-share-link action. Fixes the `isHardwarePreset` guard that
  silently drops the 2008 black/silver variants on reload.
- **Interaction robustness:** a React error boundary with an observable fallback
  (`data-testid="app-error-fallback"`), WebGL context-loss handling with
  recovery, pinch-spread floor + finite-value guards in the camera rig,
  `touchAction` cleanup on unmount, and bounded upward light intensities.
- **Lighting/color fixes:** engraving env intensity scales with the active rig
  instead of a fixed 2.5; contact shadow opacity derives from stage luminance;
  stale post-processing composer comments corrected.
- **Tests:** a rapid-interaction Playwright suite on `/` (pageerror collectors +
  input storms + error-fallback absence + post-storm liveness), camera gesture-spam
  finiteness unit tests, and a portable-state round-trip unit test.

## Impact

- Affected specs: `workbench-responsive-layout`, `stage-render-performance`,
  `portable-customizer-state`, `interaction-robustness` (all new capabilities).
- Affected code: `components/ipod/workbench/ipod-classic-workbench.tsx`,
  `components/ipod/workbench/kuma-settings-panel.tsx`, `app/layout.tsx`,
  `components/ipod/scenes/ipod-3d-stage.tsx`, `components/three/three-d-ipod.tsx`,
  `components/three/studio-lighting.tsx`, `lib/ipod-state/{storage,portable-state}.ts`,
  `lib/studio-lighting-config.ts`, `lib/analytics/events.ts`, `tests/`.
