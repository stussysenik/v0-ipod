## 1. Workbench device scaling stability
- [x] 1.1 Derive `isPortrait` / `isCompactPortrait` from `viewportSize` in `ipod-classic-workbench.tsx`
- [x] 1.2 In `previewScale`, lock to `min(widthScale, 1)` for compact-portrait; keep fit-to-both for landscape and `focus` mode
- [x] 1.3 Make the device container scroll vertically (overflow-y auto + `my-auto` centering) and relax the frame `max-height` clamp for compact-portrait so the width-locked device is never clipped
- [x] 1.4 Verify live (Chrome DevTools): portrait scale stays width-locked and identical across a height change (h844→h520 both held scale; landscape h440 correctly keeps fit-to-both). Regression also covered by `mobile-usability.spec.ts`.

## 2. Reachable compact toolbox
- [x] 2.1 Add bounded `max-height` + `overflow-y-auto` to the compact toolbox panel in `ipod-classic-workbench.tsx`
- [x] 2.2 Verify: panel computes `overflow-y: auto`, stays within the viewport, and scrolls when taller — controls always reachable (`mobile-usability.spec.ts` › compact toolbox reachability).

## 3. Orientation-safe /3d controls
- [x] 3.1 Constrain the angle pill, orbit pad, and shots tab bar to the viewport (already `max-w`-bounded with internal scroll/wrap) in `ipod-3d-stage.tsx` / `ipod-3d-touch-controls.tsx`
- [x] 3.2 Reflow/compact controls in landscape: a `(max-height:540px) and (orientation:landscape)` signal docks the touch-control cluster bottom-right (row) and the studio-shots bar bottom-left so neither stacks over the centered model
- [x] 3.3 Verify live at `844×390` (landscape): model fully visible, shots bar bottom-left, no horizontal overflow, no overlap; portrait unchanged. No-overflow asserted in `mobile-usability.spec.ts` › /3d landscape.

## 4. Mobile a11y baseline
- [x] 4.1 Re-enable pinch-zoom in `app/layout.tsx` viewport (`userScalable: true`, `maximumScale: 5`); served meta confirmed `user-scalable=yes`. Wheel + 3D canvas already set `touch-action: none`.
- [x] 4.2 Extend `prefers-reduced-motion` in `app/globals.css` to neutralize `.ipod-marquee` + every `[class*="animate-"]` utility (confirmed present in compiled CSS)
- [x] 4.3 Raise sub-44px touch targets: `native-color-picker` icon buttons → 44px, `grey-palette-picker` undertone tabs → `min-h-11`, `gif-preview-modal` close → 44px. (Judgment: the 23-stop grey ramp + curated swatch grids are left at swatch density — forcing 44px per swatch would destroy the picker; this is the standard color-grid exception.)
- [x] 4.4 Prevent iOS focus-zoom: `hex-color-input` → `text-[16px]`. Added `inputMode`/`pattern` to the inline numeric editors (`editable-time`, `editable-duration`, `editable-track-number`). The on-device inline inputs stay at device font (desktop-only path; the iOS/touch path already routes through `FixedEditor`, whose input is already `text-[16px]`).

## 5. Validation
- [x] 5.1 `pnpm type-check` (exit 0) and `pnpm lint` (0 errors; 62 pre-existing warnings, no new) pass
- [x] 5.2 Added `tests/mobile-usability.spec.ts`: scale stable across height change; container scrolls; toolbox bounded + reachable; /3d landscape no-overflow. 4/4 pass against a hydrating dev server. (Note: the default `playwright` webServer uses `run-next.mjs dev`, whose HMR WebSocket fails under headless Playwright and stalls hydration — a pre-existing condition that also fails `3d-mobile-responsive.spec.ts`. Run client specs against a hydrating server, e.g. `PLAYWRIGHT_BASE_URL=http://localhost:4001 pnpm exec playwright test` with `pnpm dev:raw`, or the prod-server path.)
- [x] 5.3 Final live pass: `390×*` portrait (width-locked + scroll), `844×390` landscape /3d (reflowed, no overflow), and `1440×900` desktop (unchanged: `justify-center` / `overflow-hidden`, scale 1) — no visual regressions.
