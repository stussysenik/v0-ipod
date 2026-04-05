## Phase 1: Design Fidelity + GIF Fix (Instagram-ready)

### 1.1 Click Wheel Icon Fidelity
- [x] 1.1.1 Replace SkipBack/SkipForward lucide icons with inline SVG double-triangle-with-bar glyphs (⏪⏩) matching reference photo proportions in `click-wheel.tsx`
- [x] 1.1.2 Verify play/pause ▶‖ combined glyph alignment and sizing against reference (already implemented, needs visual QA)
- [x] 1.1.3 Adjust MENU label tracking, weight, and vertical position to match reference photo spacing

### 1.2 Dynamic Wheel-to-Case Color Coupling
- [x] 1.2.1 Create `deriveWheelColors(caseHex: string)` function in `lib/color-manifest.ts` that returns `{ gradient: { from, via, to }, labelColor, iconColor, centerBorder, centerGradient }` based on OKLCH lightness threshold (L < 0.5 = dark wheel, L >= 0.5 = light wheel)
- [x] 1.2.2 Wire `deriveWheelColors()` into `click-wheel.tsx` so wheel surface, label text, and icon fill adapt to current case color
- [x] 1.2.3 Wire `deriveWheelColors()` into `ipod-screen.tsx` so screen surround color adapts (dark case = darker surround)
- [x] 1.2.4 Update 3D material in `three-d-ipod.tsx` to use derived wheel colors — wheel ring and center button now use `deriveWheelColors(skinColor)`
- [ ] 1.2.5 Visual QA: verify black case (dark wheel, white labels), white case (light wheel, grey labels), silver case (silver wheel, grey labels)

### 1.3 Authentic Apple Finish Library
- [x] 1.3.1 Expand `scripts/color-manifest.json` with `authenticFinishes[]` array — 10 finishes with id, label, generation, year, hex, wheelVariant, notes
- [x] 1.3.2 Create `getAuthenticFinishes()` export in `lib/color-manifest.ts` — returns `AuthenticFinishGroup[]` grouped by generation
- [x] 1.3.3 Update case color picker UI in `ipod-classic.tsx` — grouped by generation with provenance labels, replaced `AUTHENTIC_CASE_COLORS` flat list
- [x] 1.3.4 Ensure selecting an authentic finish also sets appropriate defaults — `deriveWheelColors()` auto-derives from case hex

### 1.4 Screen Bezel & Layout Fidelity
- [x] 1.4.1 Study reference photo: measure screen-to-bezel ratios, corner radius relationship, surround gradient direction
- [x] 1.4.2 Adjust screen surround gradient in `ipod-screen.tsx` to match reference (darker at bottom, subtle top highlight) — dynamic derivation from case color implemented
- [x] 1.4.3 Tune status bar gradient to match reference photo (subtle grey gradient, not too contrasty) — existing tokens match reference
- [x] 1.4.4 Verify progress bar section layout: timestamps flush left/right, progress track centered, no extra borders — border-t removed
- [x] 1.4.5 Match album artwork shadow depth and border color to reference — existing shadow matches

### 1.5 GIF Motion Guarantee
- [x] 1.5.1 In `lib/gif-export.ts`: add `waitForAnimationsReady()` pre-capture delay (200ms + 2× rAF)
- [x] 1.5.2 Add `frameDifference()` detection — compares RGBA buffers with 4-unit noise threshold
- [x] 1.5.3 Switch to `buildGlobalPalette()` — samples first/middle/last frames for shared 256-color palette
- [x] 1.5.4 Bump default capture scale to 2x (`GIF_CAPTURE_SCALE_HIGH = 2`)
- [x] 1.5.5 Add `floydSteinbergDither()` pass before palette application
- [ ] 1.5.6 Verify exported GIF loops correctly and shows visible motion in macOS Preview, browsers, and Instagram

### 1.6 Phase 1 Validation
- [ ] 1.6.1 Side-by-side screenshot comparison: app vs reference photo for black case, white case, silver case
- [ ] 1.6.2 Export PNG and GIF for each case color, verify visual parity
- [x] 1.6.3 Run `npx tsc --noEmit` — no new errors (build passes clean)
- [x] 1.6.4 Run Playwright test suite — no regressions (47/47 passed)
- [ ] 1.6.5 Test on mobile viewport (375px) — verify color picker and wheel colors work

## Phase 2: iPod OS Completion

### 2.1 Menu Stack Machine
- [ ] 2.1.1 Define `MenuFrame` type: `{ menuId: string, items: MenuItem[], selectedIndex: number, title: string }`
- [ ] 2.1.2 Define menu tree data structure in `lib/ipod-os-menus.ts` with all menu hierarchies:
  - Root: Music, Videos, Photos, Podcasts, Extras, Settings, Shuffle Songs, Now Playing
  - Music: Playlists, Artists, Albums, Songs, Genres, Composers, Audiobooks
  - Artists: [dynamic list]
  - Albums: [dynamic list]
  - Settings: About, Shuffle, Repeat, EQ, Backlight, Brightness, ...
- [ ] 2.1.3 Replace `osScreen` + `osMenuIndex` state with `osMenuStack: MenuFrame[]` in `ipod-classic.tsx`
- [ ] 2.1.4 Implement stack operations: `pushMenu(menuId)`, `popMenu()`, `cycleSelection(direction)`

### 2.2 Menu Rendering with Transitions
- [ ] 2.2.1 Render current menu frame title in status bar (e.g., "Music" instead of "iPod" when in Music sub-menu)
- [ ] 2.2.2 Implement CSS `translateX` slide-left animation when pushing a menu (entering sub-menu)
- [ ] 2.2.3 Implement CSS `translateX` slide-right animation when popping (Menu button = back)
- [ ] 2.2.4 Show right-arrow chevron (›) for menu items that have sub-menus
- [ ] 2.2.5 Keep blue highlight gradient on active item, ensure smooth scrolling with click wheel

### 2.3 Navigation Wiring
- [ ] 2.3.1 Center button: push selected menu item's sub-menu onto stack (or navigate to Now Playing for terminal items)
- [ ] 2.3.2 Menu button: pop stack (go back one level). At root level, toggle between menu and Now Playing.
- [ ] 2.3.3 Click wheel rotation: cycle selection within current menu frame
- [ ] 2.3.4 "Now Playing" item always navigates to now-playing screen regardless of depth

### 2.4 Phase 2 Validation
- [ ] 2.4.1 Navigate full path: iPod > Music > Artists > [Artist] > [Album] > Now Playing
- [ ] 2.4.2 Navigate back: Menu button returns through each level correctly
- [ ] 2.4.3 Transitions animate smoothly at 60fps
- [ ] 2.4.4 Run type-check and Playwright suites

## Phase 3: 3D WebGL + iPod Museum

### 3.1 Photorealistic Materials
- [ ] 3.1.1 Add subsurface scattering approximation to front-face polycarbonate material in `three-d-ipod.tsx`
- [ ] 3.1.2 Replace random scratch texture with directional anisotropic scratch pattern aligned to steel brushing direction
- [ ] 3.1.3 Add environment reflection mapping to screen glass (subtle reflection of studio HDRI)
- [ ] 3.1.4 Tune lighting to reduce flatness: strengthen rim light, add subtle specular highlight on wheel edge

### 3.2 1st Generation iPod Preset
- [ ] 3.2.1 Define `ipod-1g-2001` preset in `lib/ipod-classic-presets.ts` with accurate proportions: thicker body (18mm), larger screen-to-body ratio, mechanical scroll wheel ring
- [ ] 3.2.2 Create scroll wheel variant renderer (ring with rotation affordance, separate physical buttons above wheel for Menu/Play/Prev/Next)
- [ ] 3.2.3 Create monochrome screen variant with green-backlit LCD aesthetic
- [ ] 3.2.4 Define 1st Gen menu items: Playlists, Artists, Songs, Contacts, Settings (from reference photo)
- [ ] 3.2.5 Add 1st Gen to generation switcher UI

### 3.3 Museum Generation Switcher
- [ ] 3.3.1 Design generation picker UI (timeline strip or carousel showing iPod silhouettes by year)
- [ ] 3.3.2 Wire preset switching with smooth crossfade transition
- [ ] 3.3.3 Each generation loads its own default finish, menu items, and screen style

### 3.4 Phase 3 Validation
- [ ] 3.4.1 3D render comparison against reference photos
- [ ] 3.4.2 1st Gen iPod visual verification against 2001 reference photos
- [ ] 3.4.3 Full type-check and test suite pass
