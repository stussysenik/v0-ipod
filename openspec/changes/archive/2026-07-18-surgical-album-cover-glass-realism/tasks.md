## 1. Implementation (Code Changes)
- [x] 1.1 Reduce reflection height from `0.45` → `0.30` of artwork size in `ipod-artwork-panel.tsx:34`
- [x] 1.2 Soften reflection mask gradient from `rgba(0,0,0,0.65)` → `rgba(0,0,0,0.38)` in `ipod-artwork-panel.tsx:40`
- [x] 1.3 Add `filter: blur(2.5px)` to reflection container in `ipod-artwork-panel.tsx:56-57`
- [x] 1.4 Replace `border border-[#A1A1A1]` with `boxShadow: ..., 0 0 0 1px rgba(0,0,0,0.07)` in `ipod-artwork-panel.tsx:77,83`
- [x] 1.5 Add glass diffusion overlay (`backdrop-filter: blur(1.5px)` + gradient) over artwork in `ipod-artwork-panel.tsx:107-120`
- [x] 1.6 Guard glass overlay behind `!exportSafe` condition in `ipod-artwork-panel.tsx:108`
- [x] 1.7 Run ESLint (`npm run lint`) — 0 errors
- [x] 1.8 Run TypeScript check (`npx tsc --noEmit`) — clean

## 2. Visual Verification (Requires Vision Model or Chrome DevTools)
- [ ] 2.1 Start dev server (`npm run dev`) and load the Now Playing screen
- [ ] 2.2 Capture screenshot of artwork area at 1x and 2x device pixel ratio
- [ ] 2.3 Compare against reference: real iPod Classic 6th gen Now Playing screen photographs
- [ ] 2.4 Verify glass diffusion is visible but subtle — artwork should not look "blurred," it should look "behind glass"
- [ ] 2.5 Verify reflection reads as glossy-screen surface reflection, not a mirror
- [ ] 2.6 Verify border is near-invisible at normal viewing distance, visible only on close inspection
- [ ] 2.7 Check with album artwork containing dark tones, light tones, and high-contrast cover art
- [ ] 2.8 Verify export-safe path renders correctly (glass overlay disabled, reflection present, border clean)

## 3. Tuning (If Needed After Visual Verification)
- [ ] 3.1 If blur is too strong: reduce `backdrop-filter: blur()` to `1px` or increase gradient opacity
- [ ] 3.2 If reflection is still too sharp: increase blur to `3px` or reduce height further to `0.25`
- [ ] 3.3 If border is invisible: increase boxShadow opacity to `0.10`
- [ ] 3.4 If glass effect is invisible: increase gradient `rgba(255,255,255,0.07)` → `0.10`

## 4. Final Validation
- [ ] 4.1 Run `npm run validate`
- [ ] 4.2 Run Playwright visual regression if available
- [ ] 4.3 Run `openspec validate surgical-album-cover-glass-realism --strict --no-interactive`
