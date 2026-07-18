# Tasks

## 1. Shared harmony logic
- [x] 1.1 In `lib/color-manifest.ts`, add a deterministic `deriveRelatedShades(partId, palette)` helper that returns a small ordered set of harmonious shades for a given part, derived from the current palette
- [x] 1.2 Route Wheel/Center suggestions through the existing `deriveWheelColors` recession ladder so they stay coherent with the case
- [x] 1.3 Route Case/Back/Bezel suggestions through the analogous-hue + lightness-separation harmony already used by `randomCompatibleLook` (shared/analogous hue, controlled lightness steps, dark bezel grounding)
- [x] 1.4 Ensure the helper is pure/deterministic — identical input palette yields identical suggestions (no per-render `Math.random()` for inline strips)
- [x] 1.5 Add a `paletteOf(presentation)` accessor (case + wheel + center + back + bezel) so a combination chip can preview the full device palette as mini-dots

## 2. Per-part related-shade strips
- [x] 2.1 In `ipod-3d-color-cockpit.tsx`, render a small swatch strip directly beneath each recolorable part row in `PARTS` (Case, Wheel, Center, Back, Bezel) — Stage excluded
- [x] 2.2 Populate each strip from `deriveRelatedShades` for that part using the current `presentation` palette
- [x] 2.3 On tap, dispatch ONLY that part's `SET_*_COLOR` action so other parts are untouched
- [x] 2.4 Mark the swatch matching the part's current value as active/selected
- [x] 2.5 Add `aria-label`/`title` per swatch (e.g. "Case related shade #RRGGBB")

## 3. Coordinated Combinations strip
- [x] 3.1 Add a "Combinations" strip positioned in proximity to the per-part rows (adjacent, not below the helper actions)
- [x] 3.2 Render each chip as the FULL device palette: case + wheel + center + back + bezel mini color dots
- [x] 3.3 On tap, apply ALL parts together via the existing `applyLook` path (wheel/center re-derived from the case) so the device stays coherent
- [x] 3.4 Mark the chip matching the current full palette as active/selected
- [x] 3.5 Build combinations from the curated `CURATED_LOOKS` plus the harmony logic so every chip is coherent by construction

## 4. Placement & layout
- [x] 4.1 Keep related strips visually attached to their owning part row (proximity), without breaking the existing per-part row rhythm
- [x] 4.2 Place the Combinations strip in the same control cluster as the per-part rows
- [x] 4.3 Verify the cockpit card stays non-overlapping and responsive at wide and narrow widths (consistent with `3d-control-surface` layout requirements)

## 5. Validation & ship
- [x] 5.1 `pnpm type-check` and lint clean for all touched files
- [ ] 5.2 Visually verify in `/3d`: inline shades recolor only their part; combination chips set the whole device; suggestions stay harmonious as the palette changes
- [x] 5.3 `openspec validate add-3d-color-combinations --strict --no-interactive` passes
- [x] 5.4 Commit and push the branch
