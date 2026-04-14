# Change: Unify black/white iPod theme toggle and prune dead chrome

## Why

The theme toggle is half-wired: the hook already exposes `black`/`silver`, but the case can drift to white via custom pickers even though the realistic wheel shader keeps its dark gradient. That breaks visual coherence — you end up with a white case wrapping a black wheel. At the same time, the theme panel carries two dead OKLCH grid pickers, the viewport shows a redundant "ASCII Mode" notice, and the view-mode toolbar mixes working and WIP modes in an arbitrary vertical order. The toolbar button default state also doesn't follow the iPod theme, so switching case color doesn't carry through to surrounding chrome.

This change snaps everything to a single source of truth: **black iPod or white iPod, end to end**, with the hardware-accurate wheel CSS preserved for both finishes, and the toolbar chrome adapting with the theme.

## What Changes

- Rename theme variant `silver` → `white` in `useIPodTheme`; keep `black` as the default. The white variant uses `#F5F5F7` for the case (already used as the light wheel surface).
- Preserve the realistic dark wheel CSS exactly: gradient `#1C1C1E → #202022 → #252527`, border `#2C2C2E`, shadow stack untouched. Update `deriveWheelColors` dark branch so the values match the user-quoted CSS byte-for-byte.
- Remove two dead OKLCH grid pickers from the theme panel in `ipod-classic.tsx`:
  - "OKLCH Spectrum" case grid (`grid grid-cols-6 sm:grid-cols-9 gap-2`)
  - "OKLCH Ambient" background grid (`grid grid-cols-7 sm:grid-cols-9 gap-2`)
  - Keep Authentic Apple Releases, GreyPalettePicker, HexColorInput + eyedropper, Recent Custom swatches.
- Remove the floating "ASCII Mode / Terminal-style Now Playing" notice shown when `viewMode === "ascii"`.
- Reorder view-mode IconButtons so working modes are grouped on top and WIP modes are grouped at the bottom: `Flat → Preview → Focus → 3D (WIP) → ASCII (WIP)`.
- WIP badge becomes purely typographic: drop the yellow fill/border chip, render as small uppercase letter-spaced text in muted foreground.
- `IconButton` gains theme awareness: default (non-active, non-contrast) state follows the iPod theme — dark filled when theme is `black`, light gradient when theme is `white`. Active and contrast variants keep their dark fill regardless of theme.

## Impact

- Affected specs: `ipod-design-fidelity`
- Affected code:
  - `hooks/use-ipod-theme.ts` — rename variant, expose `wheelVariant`, expose theme via context
  - `lib/color-manifest.ts` — align dark `deriveWheelColors` with user-quoted gradient
  - `components/ipod/ipod-classic.tsx` — delete OKLCH grid pickers + ASCII notice; reorder view-mode buttons; wrap toolbar in theme provider
  - `components/ui/icon-button.tsx` — theme-aware default branch; typographic WIP badge
- No breaking data model changes; persisted `ipod-theme` string migrates `"silver"` → `"white"` on load.
