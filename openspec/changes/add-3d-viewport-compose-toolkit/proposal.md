# Change: Viewport Compose Toolkit for the /3d Camera

## Why

`/3d` composes like a viewport with the lights off. The custom `OrbitRig` is a clean,
single-owner camera, but the only compose-time aid is a single origin crosshair
(`OriginMarker`). A designer shooting a product hero has none of the instruments a real
camera or DCC viewport gives them:

- **You compose blind to the export crop.** Stills/clips are cropped to 9:16 / 4:5 / 1:1
  (`ASPECT_DIMS`), but the live viewport shows the full square canvas. What you frame is
  *not* what exports — the crop silently eats the edges of your composition.
- **No framing discipline.** No rule-of-thirds, no center line, no safe margins — the
  classic guides that turn an okay angle into a deliberate one.
- **No spatial reference.** No ground grid, no world axes; depth and "where is level"
  are pure guesswork on a floating device.
- **No fast perspective changes.** Reaching a canonical view (dead front, profile, top)
  means hand-dragging by eye. The mobile layer has a gizmo; the desktop compose surface
  does not.
- **The lens is fixed.** FOV is hardcoded at 32°, and the camera is perspective-only.
  You can't go longer (flatter, more "product catalog") or wider, and you can't get a
  true square-on **orthographic** elevation — the view engineers and spec-sheets want.

drei (`Grid`, axes, gizmo helpers) is already installed and unused. The rig already
exposes a clean public API (`getCameraPose` / `setCameraGoal` / `resetCamera`). The
missing piece is a **compose toolkit** layered on top: framing guides, spatial helpers,
an orientation gizmo, a lens control, and a perspective↔orthographic mode — all
compose-time only, suppressed during preview and export exactly like the origin gizmo,
so nothing new ever bakes into a frame.

## What Changes

- **Export-aspect framing overlay (A)** — a non-baked DOM layer over the canvas that
  draws the **real export crop** for the active aspect (9:16 / 4:5 / 1:1), with
  rule-of-thirds lines, a center crosshair, and edge margins inside that crop. The user
  finally composes *inside the frame the export will capture*. Reads the same `aspect`
  state the export dock owns, so it tracks live.
- **Orientation gizmo (B)** — a compose-surface gizmo that snaps the camera to canonical
  views (Front / Back / Left / Right / Top / ¾ hero) by driving `setCameraGoal`. Because
  the rig is the custom `OrbitRig` (not drei `OrbitControls`), the gizmo MUST drive the
  public API, not auto-wire a drei `<GizmoHelper>`. Reuses the canonical view set already
  defined for the mobile touch gizmo, extracted to a shared constant.
- **Ground grid + axes (C)** — a toggleable in-scene drei `Grid` ground plane plus a world
  axes helper for spatial reference. In-scene, so it MUST be conditionally rendered off
  during preview and export.
- **Lens / FOV control (D)** — a focal-length slider that sets the perspective camera's
  `fov` live and recomputes the responsive fit floor so a longer/wider lens never crops
  the device on a narrow viewport.
- **Perspective ↔ Orthographic mode** — a camera-mode toggle. The `OrbitRig` becomes the
  sole owner of **both** a `PerspectiveCamera` and an `OrthographicCamera`, writing
  position/lookAt to whichever is `makeDefault`, and mapping `reach` to ortho `zoom` so
  apparent size still tracks the same dial. The capture and clip-export pipeline MUST
  render through the **active** camera so an orthographic export is WYSIWYG with the live
  view. The lens slider is disabled (or repurposed as zoom) in ortho mode.
- **Compose-aid unification** — every new aid (A–D + grid/axes) is a compose-time
  instrument: toggleable from the Camera cockpit, suppressed whenever a preview is flying
  or an export is capturing, and never present in a rendered frame.

## Impact

- Affected specs:
  - `3d-camera-system` — ADDED requirements (camera mode, lens, framing overlay,
    orientation gizmo, spatial helpers, non-baked compose aids). Complements
    `add-3d-mobile-camera-controls` (touch gizmo) and `add-3d-studio-control-suite`
    (desktop gimbal / saved shots / lock).
  - `3d-export` — ADDED requirement (capture + clip render honor the active camera mode
    and exclude all compose aids).
- Affected code:
  - `components/three/three-d-ipod.tsx` — `OrbitRig` (dual-camera ownership, ortho `zoom`
    mapping, fov→fit recompute), `Canvas` (mount both cameras + grid/axes), `SceneCapture`
    / capture path (render through the active camera), new framing-overlay + gizmo mounts.
  - `components/ipod/scenes/ipod-3d-stage.tsx` — own the new compose-aid state (camera mode,
    fov, framing-overlay toggle, grid toggle), thread `aspect` into the overlay, pass through
    to `ThreeDIpod`.
  - `components/ipod/scenes/ipod-3d-camera-cockpit.tsx` — new toggles/controls (mode, lens,
    framing, grid, gizmo) following the existing `showOrigin` toggle pattern.
  - `lib/studio-camera.ts` — shared `CANONICAL_VIEWS`, ortho zoom↔reach mapping helper,
    fov-aware fit helper; reuse `ELEVATION_RANGE` / `REACH_RANGE`.
  - `lib/three-clip-recorder.ts` / capture utilities — render through the active camera.
- New components: framing-overlay layer, compose orientation gizmo (DOM or HUD), shared
  with the existing mobile gizmo's canonical views.
- Quality bar: verified **visually** on a running viewport — overlay matches each export
  aspect's actual crop; gizmo snaps reach the exact canonical poses; grid/axes toggle
  cleanly and never appear in an export; lens changes reframe without cropping;
  orthographic export is byte-faithful to the live ortho view; no regression to canvas
  drag-orbit, the existing origin gizmo, the mobile touch layer, or clean exports.
