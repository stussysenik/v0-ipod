## 1. Feature Flag Infrastructure
- [x] 1.1 Create `lib/feature-flags.ts` with toggle constants
- [x] 1.2 Import feature flags in `ipod-classic-workbench.tsx`

## 2. Gate UI Elements
- [x] 2.1 Wrap "Classic 2009 · Late 160GB" preset button behind `SHOW_CLASSIC_2009_PRESET`
- [x] 2.2 Wrap "iPod OS Original" interaction button behind `SHOW_IPOD_OS_ORIGINAL`
- [x] 2.3 Wrap OKLCH Spectrum case color section behind `SHOW_OKLCH_SPECTRUM`
- [x] 2.4 Wrap OKLCH Ambient background color section behind `SHOW_OKLCH_AMBIENT`
- [x] 2.5 Wrap "3D Experience" view mode button behind `SHOW_3D_VIEW_MODE`
- [x] 2.6 Wrap "Focus Mode" view mode button behind `SHOW_FOCUS_VIEW_MODE`
- [x] 2.7 Wrap "ASCII Mode" view mode button behind `SHOW_ASCII_VIEW_MODE`

## 3. Fix iPod OS Menu Navigation
- [x] 3.1 Ensure Menu button always navigates to menu screen from Now Playing in iPod OS modes (already correctly implemented - `handleMenuButtonPress` at `ipod-classic-workbench.tsx:1009` sets `osScreen` to `"menu"`)

## 4. Validation
- [x] 4.1 Run `npm run type-check` to verify no TS errors
- [x] 4.2 Run `npm run lint` to verify code quality
