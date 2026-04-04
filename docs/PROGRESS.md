# Project Progress

## Status (2026-03-14)

This pass added the OKLCH grey palette picker, ASCII mode, animated GIF export, and marquee preview. Previous interaction and mobile stability work remains intact.

## Completed In This Pass

- **OKLCH Grey Palette Picker** (`grey-palette-picker.tsx`):
  - 6 undertone families: Neutral, Warm, Cool, Greige, Sage, Lavender
  - 23 perceptually-spaced lightness stops per family with hex deduplication
  - Gradient preview bar, curated favorites, motion design
  - Undertone tab persistence via localStorage
- **ASCII Mode** (`ascii-ipod.tsx`):
  - Terminal-style text rendering of iPod interface
  - New view mode alongside 2D, 3D, Preview, and Focus
- **Animated GIF Export**:
  - 12 FPS marquee animation capture
  - `gifenc` encoding pipeline in `export-utils.ts`
- **Marquee Preview Mode**:
  - Single-pass scrolling animation for long text
  - Converted from infinite loop to one-shot scroll
- **Color System Overhaul**:
  - Removed old static `CASE_COLOR_PRESETS` and `BG_COLOR_PRESETS` arrays
  - Replaced with dynamic OKLCH-generated palettes
- **Documentation**:
  - Added `ARCHITECTURE.md` with system design deep-dive
  - Added `CONTRIBUTING.md` with semantic commit conventions
  - Added `.github/PULL_REQUEST_TEMPLATE.md`
  - Updated `README.md` with feature descriptions and screenshots

## Verification

Automated:

```bash
npx playwright test tests/interactions.spec.ts tests/mobile-usability.spec.ts --reporter=line
```

Result: 23/25 passed (2 pre-existing flaky tests).

Manual (Chrome DevTools):
- All view modes render correctly (2D, 3D, Preview, ASCII, Focus)
- Grey palette picker shows 138 unique swatches across 6 tabs
- GIF export produces valid animated output
- Marquee scrolls once and stops

## Previous Pass (2026-02-18)

- Stabilized interaction flow for core non-3D experience
- Hardened mobile usability (tap-to-edit, pointer seek, label-based upload)
- Improved color picker usability (gesture path, panel hiding, localStorage recents)
- Standardized Playwright test runtime config
- Repository cleanup and branding alignment to iPod Snapshot

## Remaining / Deferred

- 3D realism/material tuning and render polish
- Optional GitHub repository rename from `v0-ipod` to `ipod-snapshot`
