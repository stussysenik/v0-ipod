## 1. Render performance
- [x] 1.1 Debounce `saveWorkbenchModel` in `ipod-3d-stage.tsx` (trailing ~300ms) with flush on `pagehide`/unmount
- [x] 1.2 Key the settle spring on finish/preset identity, not color values
- [x] 1.3 Collapse duplicate 2D viewport listeners into the shared `useViewportSize`

## 2. Responsive controls
- [x] 2.1 Extend compact detection to short-landscape (`width<768 || height<480`) and give landscape the scrollable branch
- [x] 2.2 Coordinate the bottom band: sonner offset above the dock, relocate soft-notice pill
- [x] 2.3 Add palette trigger IconButton to the compact dock
- [x] 2.4 `/3d`: `min-h-screen` → `min-h-dvh`; verify mid-width control columns don't overlap the model

## 3. Portable state
- [x] 3.1 `lib/ipod-state/portable-state.ts` codec (encode/decode, versioned, normalized, null on bad input) + unit round-trip test
- [x] 3.2 Restore from `?s=` on both surfaces; copy-share-link action
- [x] 3.3 Export/import config JSON file actions
- [x] 3.4 Fix `isHardwarePreset` to accept all preset ids; add analytics events for share/export/import

## 4. Robustness
- [x] 4.1 Error boundary component wrapping workbench + 3D stage with `data-testid="app-error-fallback"` and reset
- [x] 4.2 WebGL context-loss handling (preventDefault + notice + restored resume)
- [x] 4.3 Camera: pinch-spread floor, finite guards, `touchAction` cleanup on unmount
- [x] 4.4 Clamp lighting intensity ceilings in `sanitizeLightingConfig`; engraving env intensity scales with rig; contact-shadow opacity derives from stage luminance; fix stale composer comments

## 5. Tests & verification
- [x] 5.1 `tests/rapid-interaction.spec.ts`: pageerror collectors + click-wheel spam + toggle storm + panel drag storm + fallback-absent + post-storm liveness
- [x] 5.2 Camera gesture-spam finiteness unit test
- [ ] 5.3 Run lint/type-check/unit; run new spec; browser-verify 2D+3D at 320/390/844×390/1024 via chrome-devtools
- [ ] 5.4 Commit(s), deploy, update memory
