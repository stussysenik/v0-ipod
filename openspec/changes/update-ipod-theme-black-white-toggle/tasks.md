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

## 7. Theme-aware `IconButton` default (reframed → luminance-adaptive chrome; see handoff)
- [x] 7.1 Read dark-chrome from a scoped `IconButtonChromeContext` in `IconButton`
- [x] 7.2 On a dark shell the resting `default` branch uses the `defaultDark` filled token set
- [x] 7.3 On a light shell the `default` branch keeps the existing light gradient token set
- [x] 7.4 `isActive` and `contrast` branches remain invariant

## 8. Validation
- [x] 8.1 `openspec validate update-ipod-theme-black-white-toggle --strict --no-interactive`
- [ ] 8.2 Toggle theme in-browser; confirm case, wheel, surround, and toolbar all flip together
- [ ] 8.3 Export a PNG in both themes; confirm exported shell matches on-screen

## Progress & Handoff — 2026-07-18 (session ended at the 200k ceiling)

Verified against the current codebase (checkbox drift is real here — treat source, not
boxes, as truth):

- SHIPPED and live: §1.1–1.3 (`hooks/use-ipod-theme.tsx` — `IPodTheme = "black" | "white"`,
  `#F5F5F7` white case, localStorage `silver`→`white` migration); §2 (dark wheel gradient in
  `lib/color-manifest.ts`); §3 (OKLCH pickers gone from `ipod-classic.tsx` — grep count 0);
  §4 (ASCII-mode notice gone — grep count 0); §6 (typographic WIP badge, `components/ui/icon-button.tsx:115`).
- STILL TO CONFIRM: §5.1 view-mode order (Flat → Preview → Focus → 3D (WIP) → ASCII (WIP)).

**Design pivot (approved this session): §1.4/§7 are superseded.** The `IPodThemeContext` /
`IPodThemeProvider` / stateful `useIPodTheme()` from §1.4 are **dead** — never mounted or
consumed anywhere in the app (only in `docs/`). The real device theme signal is
`model.presentation.skinColor`, an **arbitrary** hex (Authentic Apple presets, GreyPalettePicker,
HexColorInput all ship), not a two-value black/white toggle. So §7 is reframed as
**luminance-adaptive toolbar chrome**: the IconButton `default` variant adapts to the case
colour's perceived lightness, not a dead flag.

- LANDED + TESTED this session (pure core, lint/type clean, 7/7 green
  `lib/shared-ui-tokens.test.ts`):
  - `tokens/shared-ui.json` — new `iconButton.variants.defaultDark` appearance set.
  - `lib/shared-ui-tokens.ts` — `isDarkChrome(caseColor)` (via the WCAG `contrastRatio`
    authority in `lib/studio-control-tokens.ts` — one luminance model) + pure
    `resolveIconButtonVariant(variant, darkChrome)` (only `default` flips; `active`/`contrast`
    invariant per §7.4).

- LANDED + VERIFIED (session 2026-07-18 cont'd — tsc 0, oxlint 0/0, unit 601/601, strict-validate OK):
  1. ✅ `components/ui/icon-button.tsx`: scoped `IconButtonChromeContext` (bool, default `false`) +
     exported `IconButtonChromeProvider`; component now `useContext`es it and calls
     `resolveIconButtonVariant(variant, darkChrome)`. Default `false` → every existing usage
     (kuma-settings, stories) unchanged.
  2. ✅ `components/ipod/workbench/ipod-classic-workbench.tsx`: only the view-mode toolbar panel
     `<div className="flex flex-col gap-2 p-2 …>` is wrapped in
     `<IconButtonChromeProvider dark={isDarkChrome(skinColor)}>`. KumaSettingsPanel and the compact
     Menu button are left outside (they use className overrides, not tokens).
  3. ✅ Render seam covered by a Storybook `play` story `OnDarkChrome` in
     `components/ui/icon-button.stories.tsx` (the repo's browser render-test channel): a resting
     `default` button inside a dark provider computes `color: rgb(245,245,247)` (defaultDark). Runs
     green in chromium (8/8 for that file). The 2 vanilla-extract story failures in the full
     `storybook` project are pre-existing (device-shell / click-wheel `theme.css.ts`), untouched here.

- §5.1 order: SUPERSEDED by the "3D/Portfolio is a place, not a mode" refactor. The live toolbar is
  Flat → Preview → 3D Studio (nav) → Portfolio (nav) → [flagged 3D Experience/Focus/ASCII] → Zen.
  The §5.1 intent (real modes first, WIP last) holds; the literal order in §5 is stale — do not
  reorder to match a spec the refactor already replaced.

- REMAINING: only §8.2/8.3 — the user's in-browser visual session (toggle shell dark/light; confirm
  case + wheel + surround + toolbar flip together; PNG export parity). Nothing code-side pending.
  Out of §7 scope: the toolbar *panel* bg (`#E7E7E3`) stays light by design — only the buttons
  adapt. Full panel theming would be a separate, freshly-scoped task.
