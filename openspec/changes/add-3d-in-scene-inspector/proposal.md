# Change: In-Scene 3D Dev Inspector for `/3d`

## Why

The `/3d` stage is a dense React Three Fiber scene — a custom `OrbitRig`, env-first
`meshPhysicalMaterial` stack, drei `<Html>` screen/wheel portals, and an offline clip
renderer — but it ships with **no runtime visibility** into what the GPU is doing or which
object a pixel belongs to. When a material reads wrong, a mesh lands off-frame, or the
framerate dips, the only feedback is the final image. A staff-quality 3D surface deserves the
same instant, click-to-inspect feedback a DOM app gets from Nuxt DevTools' Component
Inspector: click a mesh → see its node, material, and transform → live-tweak → watch the
stats respond.

This change adds a **zero-dependency, dev-only in-scene inspector** that is auto-enabled in
development and dead-code-eliminated in production. It is the Nuxt "click and connect"
equivalent for the 3D scene: a live stats HUD (FPS, frame time, draw calls, triangles, GPU
memory) plus a click-to-pick scene inspector with a scene-graph browser and a live property
editor.

## What Changes

- **Live stats HUD** — a dev-only overlay drawing `gl.info` (draw calls, triangles, geometries,
  textures) and a rolling FPS / frame-time average from `useFrame`. The single source of truth
  for the "look for performance gains" goal: you can now measure the cost of every material,
  light, and `Html` portal in real time.
- **Click-to-pick inspector** — a raycaster against the live scene graph, driven by pointer
  events on the canvas. Clicking a mesh selects it, highlights it (outline / emissive boost),
  and surfaces its node in a side panel. Picking is gated behind a "Pick" mode so it never
  fights the existing `OrbitRig` drag-to-orbit.
- **Scene-graph browser** — a collapsible tree of the live `scene` graph (traversed from
  `useThree`). Clicking any node selects + highlights it, so you can drill into groups, meshes,
  and lights without guessing.
- **Live property editor** — the selected node's transform (position / rotation / scale),
  material (color, roughness, metalness, clearcoat, opacity), and geometry (type, bounds) are
  shown as editable numeric/color fields. Edits write straight to the three object and update
  the canvas immediately — WYSIWYG tuning without touching the cockpit.
- **Dev-only gating** — the whole inspector mounts only when `process.env.NODE_ENV ===
  "development"`. In prod builds it is dead-code eliminated (no bundle cost, no surface). A
  hotkey (`i`) toggles it in dev so it can be hidden while composing.
- **Zero new dependencies** — built on `useThree` / `useFrame` + a tiny external store, so it
  tracks the existing R3F reconciler instead of fighting it.

## Impact

- Affected specs: `3d-dev-inspector` (**ADDED** — new capability).
- Affected code:
  - new: `packages/components/three/scene-inspector/*` (store, in-canvas core, panel, stats,
    scene tree, property editor) — all dev-only.
  - `packages/components/three/three-d-ipod.tsx` (mount the in-canvas core inside `<Canvas>`;
    gate on `process.env.NODE_ENV`).
  - `packages/components/ipod/scenes/ipod-3d-stage.tsx` (mount the DOM panel; `i` hotkey
    toggle; gate on `process.env.NODE_ENV`).
- Out of scope: production profiling, MCP/AI bridge (separate change if wanted), editing the
  persisted workbench model (the inspector edits live three objects only — it is a compose-time
  aid, like Nuxt DevTools, not a data layer).
- Quality bar: verified **visually** on the running `/3d` stage — stats HUD tracks FPS /
  draw calls, click-to-pick selects the correct mesh, scene tree drills into groups, property
  edits update the canvas live, and the overlay is absent from exports and prod builds.
