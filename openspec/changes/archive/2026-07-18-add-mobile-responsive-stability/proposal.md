# Change: Mobile Responsive Stability & Usability

## Why

The app is demo-bound (phone, in front of investors) but several surfaces break or become unusable on mobile and in landscape. These are reproduced live (Chrome DevTools, 390px mobile emulation):

- **Workbench device "collapses".** `previewScale` is constrained by viewport *height*, so any `innerHeight` change — URL-bar collapse, soft keyboard, orientation chrome — violently rescales the iPod. Measured: height `844→440` drops scale `0.809→0.438` and the device shrinks `280×469 → 152×254` (54% of size). The display "jumps around" and shrinks to nothing.
- **Compact toolbox is unreachable.** On short viewports the compact tool dock panel has no max-height/scroll, so its buttons overflow off the top of the screen and cannot be tapped.
- **`/3d` landscape is unusable.** The camera-angle pill (`Front Right Back Left Top ¾`), the orbit/pinch pad, and the bottom `Product/Front/Back/+Shot` tab bar overflow horizontally and overlap each other, shoving the iPod model off-screen and clipping it (verified at `844×390`).
- **Latent mobile a11y gaps** that read as "broken" on a phone: pinch-zoom is globally disabled (WCAG violation), `prefers-reduced-motion` only guards view-transitions (marquee + `animate-*` still run), several editor/export touch targets are well under 44px, and small-font inputs trigger iOS focus-zoom.

## What Changes

- **Stable device scaling (portrait width-lock).** On compact phone viewports held in portrait, lock the workbench device to its width-based fit so transient height changes can no longer rescale it; allow the container to scroll vertically instead of collapsing. Landscape keeps fit-to-both. **BREAKING** to the current scale heuristic only (no API change).
- **Scrollable compact toolbox.** The compact tool dock panel gets a bounded max-height with internal scroll so every control is always reachable.
- **`/3d` orientation-safe controls.** The angle pill, orbit pad, and shots tab bar are constrained to the viewport (no horizontal overflow), repositioned/compacted in landscape, and must never overlap or clip the model.
- **Mobile a11y baseline.** Re-enable pinch-zoom; extend `prefers-reduced-motion` to cover marquee + `animate-*`; raise editor/export touch targets to ≥44px; ensure text inputs render at ≥16px (or otherwise prevent iOS focus-zoom).

## Impact

- Affected specs: `mobile-responsive-layout` (new capability)
- Related specs: `export-ux` (from `add-mobile-collapsible-toolbox`), `3d-camera-system` (from `add-3d-mobile-camera-controls`) — this change refines their mobile layout behavior without altering their control semantics.
- Affected code:
  - `components/ipod/workbench/ipod-classic-workbench.tsx` (previewScale, container scroll, frame max-height, toolbox panel)
  - `components/ipod/scenes/ipod-3d-stage.tsx`, `components/ipod/scenes/ipod-3d-touch-controls.tsx` (landscape layout of angle pill / orbit pad / shots bar)
  - `app/layout.tsx` (viewport `userScalable`/`maximumScale`)
  - `app/globals.css` (reduced-motion coverage)
  - `components/ipod/editors/*`, `components/ipod/export/gif-preview-modal.tsx` (touch targets, input font sizing)
  - `tests/mobile-usability.spec.ts` (regression coverage)
