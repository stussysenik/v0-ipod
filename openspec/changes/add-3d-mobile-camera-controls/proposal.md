# Change: On-screen Mobile Camera Controls for /3d

## Why

On mobile, `/3d` is effectively one-handed: the only way to move the camera is a raw
finger-drag on the canvas, which is imprecise, fights the page, and offers no way to reach
canonical angles or pull the device closer. A staff-quality 3D artifact should be fully
operable with one thumb — snap to a known view, nudge a fine angle, and zoom in for detail —
without ever needing a mouse, a keyboard, or the desktop cockpit. The studio already exposes a
clean public camera API (`getCameraPose` / `setCameraGoal` / `resetCamera`), so the missing
piece is a touch-first control layer on top of it, gated to mobile and toggleable so it never
clutters the desktop compose surface or appears in exports.

## What Changes

- **Touch camera-control layer** — a new on-canvas control component that floats above the
  always-visible `Ipod3DStudioShots` bottom bar, one-thumb reachable, rendered only when the
  controls are enabled. It drives the existing custom `OrbitRig` exclusively through the public
  `ThreeDIpodHandle` camera API (`getCameraPose()` + `setCameraGoal({ azimuth, elevation, reach })`,
  degrees, clamped to `ELEVATION_RANGE` / `REACH_RANGE`), never a second camera system.
- **Gizmo / orientation snap widget** — a 3D-modeling-style orientation widget that snaps the
  camera to canonical views: Front (az 0, el 0), Back (az 180), Left (az -90), Right (az 90),
  Top (el ~70), and a ¾ hero (az ~20, el ~12). Because the rig is custom (not drei
  `OrbitControls`), the widget MUST drive the public API (or a thin adapter) rather than auto-wire
  to a drei `<GizmoHelper>`.
- **Touch orbit-pad (fine continuous orbit)** — a relative-drag pad that accumulates azimuth /
  elevation deltas onto a goal captured at touch-start and calls `setCameraGoal` each move, so
  fine orbit is smooth and does not lag-drift away from the finger.
- **Pinch / zoom (reach)** — a two-finger pinch maps distance delta to `reach`, letting the user
  pull the device closer or push it back within `REACH_RANGE`.
- **Settings toggle** — the touch controls MUST be toggleable on/off from the studio cockpit
  (`Ipod3DStudioCockpit`, alongside Lock editing / Marquee), so the user can hide them entirely.
- **Sensible mobile default** — controls default ON for coarse pointers (`(pointer: coarse)`) and
  OFF on desktop, with the settings toggle always able to override the default.
- **Non-interference** — the new layer MUST NOT break the existing canvas drag-to-orbit, the
  desktop cockpit, or clean exports.

## Impact

- Affected specs: `3d-camera-system` (ADDED requirements; complements
  `add-3d-studio-control-suite`, which covers the desktop gimbal / saved shots / lock)
- Affected code:
  - new: touch camera-control component (gizmo snap widget + orbit-pad + pinch handler)
  - `components/ipod/scenes/ipod-3d-stage.tsx` (mount the layer; hold toggle state; pointer-media default)
  - `components/ipod/scenes/ipod-3d-camera-cockpit.tsx` (reference for the `getCameraPose()` + `setCameraGoal()` nudge pattern)
  - `components/three/three-d-ipod.tsx` (`OrbitRig`; public `ThreeDIpodHandle` API: `getCameraPose` / `setCameraGoal` / `resetCamera` / `getCanvas`)
  - `lib/studio-camera.ts` (`ELEVATION_RANGE` [-78, 78], `REACH_RANGE` [5.5, 19], canonical poses)
  - the cockpit toggle row in `Ipod3DStudioCockpit` (new "Touch controls" toggle)
- Quality bar: verified **visually** on a running mobile viewport (one-thumb reach, snap + fine
  orbit + pinch all working, no canvas-drag regression, nothing in exports).
