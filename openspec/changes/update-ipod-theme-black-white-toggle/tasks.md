# Tasks

## 1. Theme hook: black/white variant
- [ ] 1.1 Rename `silver` → `white` in `IPodTheme` type and `IPOD_6G_COLORS.case`
- [ ] 1.2 Use `#F5F5F7` as the white case color (matches light wheel surface token)
- [ ] 1.3 Migrate persisted `"silver"` values in localStorage to `"white"` on load
- [ ] 1.4 Create a lightweight `IPodThemeContext` so `IconButton` can read the active theme without prop drilling

## 2. Preserve realistic dark wheel CSS
- [ ] 2.1 Update `deriveWheelColors` dark branch in `lib/color-manifest.ts`:
      gradient `from #1C1C1E, via #202022, to #252527`, border `#2C2C2E`
- [ ] 2.2 Verify `click-wheel.tsx` shadow stack already matches quoted CSS (no change expected)
- [ ] 2.3 Verify `deriveScreenSurround` still produces a coherent dark surround for the new case hex

## 3. Theme panel cleanup (`components/ipod/ipod-classic.tsx`)
- [ ] 3.1 Delete the "OKLCH Spectrum" case-color grid picker and its `mb-4` wrapper
- [ ] 3.2 Delete the "OKLCH Ambient" background-color grid picker and its `mb-4` wrapper
- [ ] 3.3 Confirm `oklchCasePalette`, `oklchBgPalette`, and related imports are removed if they become unused
- [ ] 3.4 Keep Authentic Apple Releases, GreyPalettePicker, HexColorInput, Recent Custom

## 4. Remove ASCII mode notice
- [ ] 4.1 Delete the floating "ASCII Mode / Terminal-style Now Playing" card rendered for `viewMode === "ascii"`
- [ ] 4.2 Confirm no layout regressions in ASCII mode

## 5. Reorder view-mode IconButtons
- [ ] 5.1 In the view-mode toolbar, reorder vertical list to: Flat → Preview → Focus → 3D (WIP) → ASCII (WIP)
- [ ] 5.2 Leave `onClick`, `data-testid`, and `isActive` wiring unchanged

## 6. Typographic WIP badge
- [ ] 6.1 In `components/ui/icon-button.tsx`, replace the yellow chip classes with typographic styling (uppercase, tracked, muted foreground)
- [ ] 6.2 Verify badge remains positioned at top-right of the button

## 7. Theme-aware `IconButton` default
- [ ] 7.1 Read the current theme from `IPodThemeContext` in `IconButton`
- [ ] 7.2 When `theme === "black"`, default (non-active, non-contrast) branch uses the dark filled class set
- [ ] 7.3 When `theme === "white"`, default branch uses the existing light gradient class set
- [ ] 7.4 `isActive` and `contrast` branches remain unchanged

## 8. Validation
- [ ] 8.1 `openspec validate update-ipod-theme-black-white-toggle --strict --no-interactive`
- [ ] 8.2 Toggle theme in-browser; confirm case, wheel, surround, and toolbar all flip together
- [ ] 8.3 Export a PNG in both themes; confirm exported shell matches on-screen
