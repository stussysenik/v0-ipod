## 1. Touch camera-control layer

- [x] 1.1 Create a new on-canvas touch-controls component that floats above the always-visible `Ipod3DStudioShots` bottom bar, anchored within one-thumb reach (lower edge, safe-area aware)
- [x] 1.2 Wire the component to the public `ThreeDIpodHandle` camera API via `ipodApiRef` — read with `getCameraPose()`, drive with `setCameraGoal({ azimuth, elevation, reach })`, and never instantiate a second camera/controls system
- [x] 1.3 Render the layer only when controls are enabled, and ensure it is never present in exports (no HUD/cockpit chrome in frame)

## 2. Gizmo / orientation snap widget

- [x] 2.1 Build a 3D-modeling-style orientation widget (origin/corner gizmo) with tappable canonical-view targets
- [x] 2.2 Map targets to canonical poses: Front (az 0, el 0), Back (az 180), Left (az -90), Right (az 90), Top (el ~70), ¾ hero (az ~20, el ~12)
- [x] 2.3 Drive snaps through the public API (or a thin adapter), NOT a drei `<GizmoHelper>` auto-wire, since the rig is the custom `OrbitRig`
- [x] 2.4 Keep the widget orientation in sync with the live pose from `getCameraPose()`

## 3. Touch orbit-pad (fine continuous orbit)

- [x] 3.1 Add a relative-drag orbit-pad surface; on touch-start, capture the current goal pose from `getCameraPose()`
- [x] 3.2 Accumulate azimuth / elevation deltas onto the captured start goal each move and call `setCameraGoal` (avoid lag-drift from re-reading an eased pose mid-gesture)
- [x] 3.3 Respect clamps — elevation to `ELEVATION_RANGE` [-78, 78]; rely on the API's own clamping as the source of truth

## 4. Pinch / zoom (reach)

- [x] 4.1 Attach two-finger pinch handling (use `getCanvas()` for live listeners or the pad surface), tracking pointer distance
- [x] 4.2 Map pinch distance delta to `reach`, clamped to `REACH_RANGE` [5.5, 19], via `setCameraGoal`
- [x] 4.3 Ensure pinch and single-finger orbit do not trigger each other (gesture disambiguation by active-pointer count)

## 5. Settings toggle

- [x] 5.1 Add a "Touch controls" on/off toggle to `Ipod3DStudioCockpit` alongside Lock editing / Marquee
- [x] 5.2 Hold the toggle state in `ipod-3d-stage.tsx` (`controlsOpen`-adjacent stage-local state) or persist via the model UI state
- [x] 5.3 When toggled off, fully unmount/hide the touch layer and detach its listeners

## 6. Sensible mobile default

- [x] 6.1 Default the toggle ON when `(pointer: coarse)` matches and OFF otherwise (desktop)
- [x] 6.2 Let the explicit settings toggle override the media-query default in both directions

## 7. Non-interference

- [ ] 7.1 Verify existing canvas drag-to-orbit still works when the touch layer is off (and where it does not overlap the pad when on)
- [x] 7.2 Verify the desktop cockpit and desktop floating panels are unchanged at `lg:`
- [x] 7.3 Verify exports contain no touch-control chrome

## 8. Visual verification

- [ ] 8.1 On a mobile viewport, confirm all controls are reachable with one thumb above the bottom bar
- [ ] 8.2 Confirm gizmo snaps land on the exact canonical poses; fine orbit is smooth with no drift; pinch reaches the full `REACH_RANGE`
- [ ] 8.3 Confirm toggling the setting hides/shows the layer and the coarse-pointer default behaves correctly
