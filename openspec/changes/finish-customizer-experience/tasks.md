## 1. Render performance
- [ ] 1.1 Debounce `saveWorkbenchModel` in `ipod-3d-stage.tsx` (trailing ~300ms) with flush on `pagehide`/unmount
- [ ] 1.2 Key the settle spring on finish/preset identity, not color values
- [ ] 1.3 Collapse duplicate 2D viewport listeners into the shared `useViewportSize`

## 2. Responsive controls
- [ ] 2.1 Extend compact detection to short-landscape (`width<768 || height<480`) and give landscape the scrollable branch
- [ ] 2.2 Coordinate the bottom band: sonner offset above the dock, relocate soft-notice pill
- [ ] 2.3 Add palette trigger IconButton to the compact dock
- [ ] 2.4 `/3d`: `min-h-screen` → `min-h-dvh`; verify mid-width control columns don't overlap the model

## 3. Portable state
- [ ] 3.1 `lib/ipod-state/portable-state.ts` codec (encode/decode, versioned, normalized, null on bad input) + unit round-trip test
- [ ] 3.2 Restore from `?s=` on both surfaces; copy-share-link action
- [ ] 3.3 Export/import config JSON file actions
- [ ] 3.4 Fix `isHardwarePreset` to accept all preset ids; add analytics events for share/export/import

## 4. Robustness
- [ ] 4.1 Error boundary component wrapping workbench + 3D stage with `data-testid="app-error-fallback"` and reset
- [ ] 4.2 WebGL context-loss handling (preventDefault + notice + restored resume)
- [ ] 4.3 Camera: pinch-spread floor, finite guards, `touchAction` cleanup on unmount
- [ ] 4.4 Clamp lighting intensity ceilings in `sanitizeLightingConfig`; engraving env intensity scales with rig; contact-shadow opacity derives from stage luminance; fix stale composer comments

## 5. Tests & verification
- [ ] 5.1 `tests/rapid-interaction.spec.ts`: pageerror collectors + click-wheel spam + toggle storm + panel drag storm + fallback-absent + post-storm liveness
- [ ] 5.2 Camera gesture-spam finiteness unit test
- [ ] 5.3 Run lint/type-check/unit; run new spec; browser-verify 2D+3D at 320/390/844×390/1024 via chrome-devtools
- [ ] 5.4 Commit(s), deploy, update memory
