## 1. Finish model + library
- [ ] 1.1 Create `lib/studio-finishes.ts`: `StudioFinish` type, `APPLE_FINISH_LIBRARY` grouped by family (Classic 6G, Mini 1G, Nano 2G incl (PRODUCT) RED, Nano 4G chromatic, U2 Edition), all seven surfaces explicit per entry
- [ ] 1.2 Add `ANODIZED_POP_RIG` to `lib/studio-lighting-config.ts` and register in `RIG_PRESETS`
- [ ] 1.3 Migrate `lib/studio-themes.ts`: `StudioTheme` → user-saved `StudioFinish` (family "custom"); keep storage shape compatible
- [ ] 1.4 Remove `FinishAsset` + `CURATED_LOOKS` from the cockpit; route everything through the library

## 2. Render styles
- [ ] 2.1 `renderStyle` union in `lib/ipod-state/model.ts`; `SET_RENDER_STYLE` in `update.ts`; legacy `technicalFlat` migration in `storage.ts`
- [ ] 2.2 Doodle pipeline in `components/three/three-d-ipod.tsx`: unlit albedo + black inverted-hull outlines per part; LCD stays live
- [ ] 2.3 Style segment (Studio / Flat / Doodle) in the studio cockpit; thread `renderStyle` through stage props

## 3. Cockpit restructure
- [ ] 3.1 Case×light pairing strip with mono spec readout at top of color cockpit
- [ ] 3.2 Generation-grouped finish library section (hairline-ring selection, full-look apply)
- [ ] 3.3 Keep part rows + shade strips + save-finish shelf; delete superseded sections

## 4. Verification
- [ ] 4.1 Visual pass: every library finish applied on stage — case/wheel/edge/bezel/stage/rig all correct, reds read red, U2 wheel reads red on black
- [ ] 4.2 Doodle style visual pass + export parity check
- [ ] 4.3 Legacy localStorage blob migration check (technicalFlat true/false)
- [ ] 4.4 `openspec validate add-3d-apple-finish-library-and-doodle-style --strict --no-interactive`
