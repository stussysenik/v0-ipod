## 1. Inspector store

- [x] 1.1 Create `packages/components/three/scene-inspector/inspector-store.ts` — a
      `useSyncExternalStore` singleton holding `{ ready, scene, camera, canvas, stats, selected,
      pickMode }` with actions `register(gl,scene,canvas)`, `setStats`, `setSelected`,
      `setPickMode`, `clear`. No deps.

## 2. In-canvas core

- [x] 2.1 Create `SceneInspectorCore.tsx` — `useThree` to grab gl/scene/camera/size; register on
      mount, clear on unmount.
- [x] 2.2 Stats: a `useFrame` EWMA of FPS/frame-ms + `gl.info.render`/`gl.info.memory`, pushed
      to the store throttled to ~4 Hz (no per-frame React re-render).
- [x] 2.3 Picking: when `pickMode`, a click-vs-drag-guarded `pointerdown`→`pointerup` on the
      canvas runs a recursive raycast through `scene.children` and `setSelected(first Mesh)`.
- [x] 2.4 Highlight: on `selected` change, restore the previous object and highlight the new one
      (emissive boost for standard/physical materials, `Box3Helper` fallback for groups/lights).
      Pure-three helper in `highlight.ts`. Cleanup on change/unmount.
- [x] 2.5 Core renders nothing to the DOM.

## 3. DOM panel

- [x] 3.1 Create `StatsHud.tsx` — FPS, ms/frame, draw calls, triangles, geo, tex from the store.
- [x] 3.2 Create `SceneTree.tsx` — recursive collapsible tree of `scene.children`; click a row →
      `setSelected`; accent the selected row; show `name || type` + visibility dot.
- [x] 3.3 Create `PropertyEditor.tsx` — transform (pos/rot-deg/scale), material
      (color/roughness/metalness/clearcoat/opacity/emissive — only fields the material has),
      geometry (read-only type/bounds/verts), object (name/visible/renderOrder). Writes straight
      to the three object.
- [x] 3.4 Create `SceneInspectorPanel.tsx` — fixed `pointer-events-none` overlay assembling the
      HUD + a "Pick" toolbar toggle + tree + editor; reads the store; dev aesthetic.

## 4. Mount + dev gating

- [x] 4.1 In `three-d-ipod.tsx`, mount `<SceneInspectorCore />` inside `<Canvas>`, gated on
      `process.env.NODE_ENV === "development"`.
- [x] 4.2 In `ipod-3d-stage.tsx`, mount `<SceneInspectorPanel />` outside the canvas, gated on
      dev; bind the `i` hotkey to toggle visibility.

## 5. Verify

- [x] 5.1 Run the dev server; confirm the stats HUD appears in `/3d` and tracks FPS / draw calls
      / triangles live.
- [x] 5.2 Toggle Pick mode, click a device mesh → it highlights, the tree accents the row, the
      editor shows its material/transform.
- [x] 5.3 Edit a property (e.g. position.x, material color) → canvas updates live.
- [x] 5.4 Confirm drag-to-orbit is unaffected with Pick off; `i` hides/shows the panel.
- [x] 5.5 Confirm the inspector is absent from exports and from a production `next build`
      (dead-code eliminated).
- [x] 5.6 Run `openspec validate add-3d-in-scene-inspector --strict --no-interactive` and fix any
      issues.
