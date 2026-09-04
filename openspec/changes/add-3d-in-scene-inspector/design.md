# Design: In-Scene 3D Dev Inspector

## Goal

A dev-only, zero-dependency inspector for the `/3d` R3F scene that is the Nuxt DevTools
Component Inspector equivalent for 3D: live stats HUD + click-to-pick + scene-graph browser +
live property editor. Auto-enabled in development, dead-code eliminated in production.

## Architecture

The inspector is split into an **in-canvas core** (owns three.js access) and a **DOM panel**
(owns HTML rendering), bridged by a **tiny external store**. This keeps three.js work inside the
R3F reconciler and DOM work out of it — no `useThree` calls in DOM, no DOM in the canvas.

```
<Canvas>
  … existing scene …
  <SceneInspectorCore />          ← reads gl/scene/camera, publishes stats + selection
</Canvas>
<SceneInspectorPanel />           ← DOM: stats HUD + pick mode + tree + editor (reads store)
```

### The store (`inspector-store.ts`)

A minimal `useSyncExternalStore` store with no deps — the single bridge between core and panel.

```ts
type InspectorState = {
  ready: boolean;                 // core has registered gl/scene/camera
  scene: THREE.Scene | null;
  camera: THREE.Camera | null;
  canvas: HTMLCanvasElement | null;
  stats: { fps: number; frameMs: number; calls: number; triangles: number;
           geometries: number; textures: number } | null;
  selected: THREE.Object3D | null;
  pickMode: boolean;              // core raycasts only when true
};
```

- `setStats`, `register(gl, scene, canvas)`, `setSelected(obj | null)`,
  `setPickMode(bool)` — called by the core / panel.
- `subscribe`/`getSnapshot` — React subscription.
- A module-level singleton is fine: the app mounts one 3D stage at a time. The core registers
  on mount and clears on unmount, so a remount re-points the inspector at the live scene.

### In-canvas core (`SceneInspectorCore.tsx`)

Mounted inside `<Canvas>`, gated on `process.env.NODE_ENV === "development"`. Uses `useThree`
to grab `gl`, `scene`, `camera`, `size`, `raycaster`, `pointer`.

- **Registration** — on mount, `register(gl, scene, gl.domElement)`.
- **Stats** — a `useFrame` callback computes a rolling FPS / frame-time average (EWMA over
  `delta`) and reads `gl.info.render` (calls, triangles) + `gl.info.memory` (geometries,
  textures). Pushes to the store at a throttled cadence (~4 Hz) so the HUD updates without
  forcing a React re-render every frame.
- **Picking** — when `pickMode`, a `pointerdown`→`pointerup` on the canvas that didn't travel
  (a click, not a drag) runs a raycast through `scene.children`, recursing into groups, and
  `setSelected(first Mesh hit)`. The "click vs drag" guard (`< 6px` travel) is what keeps pick
  mode from hijacking `OrbitRig` drag-to-orbit.
- **Highlight** — on `selected` change, the core restores the previous object and applies a
  highlight to the new one. Two robust, dependency-free options, chosen per material:
  - *emissive boost* on materials that have `emissive` (standard/physical) — stash original
    `emissive` + `emissiveIntensity`, set to an accent color.
  - *outline fallback* — a `THREE.Box3Helper` attached to the object when it has no editable
    emissive, so every node (groups, lights) can be highlighted.
  Cleanup on `selected` change / unmount restores stashed values and disposes the helper.

The core renders **nothing** to the DOM — it only mutates three objects and writes the store.

### DOM panel (`SceneInspectorPanel.tsx`)

A fixed, `pointer-events-none` overlay (children re-enable pointer events) mounted by the stage
outside the `<Canvas>`, gated on dev. Reads the store via `useSyncExternalStore`.

Layout (matches the existing cockpit aesthetic — small mono panels, `z-[150]` above the
`z-10` cockpits but below the `z-[100]` export veil):

- **Stats HUD** (top-left) — FPS, ms/frame, draw calls, triangles, geo, tex. The at-a-glance
  performance readout.
- **Toolbar** — a "Pick" toggle (sets `pickMode` in the store; when on, the canvas cursor becomes
  crosshair and clicks select instead of orbit), and a highlight of the selected node's name.
- **Scene tree** (left, scrollable) — renders `scene.children` recursively as a collapsible
  tree. Each row shows `obj.name || obj.type`, a visibility dot, and is clickable →
  `setSelected`. The selected row is accent-colored. Recursion handles the nested groups the
  model uses (device group → body/face/wheel groups → meshes).
- **Property editor** (right) — the selected node's editable props, grouped:
  - *Transform*: position, rotation (degrees), scale — `Vector3` / `Euler` inputs.
  - *Material*: color, roughness, metalness, clearcoat, clearcoatRoughness, opacity, transparent,
    emissive — only the fields the material actually has are shown (introspected from
    `material.type`). Edits write straight to the three material/object.
  - *Geometry*: type, bounding-sphere radius, vertex count (read-only, from `geometry`).
  - *Object*: name, visible, renderOrder (editable).
- **Hotkey** — the stage binds `window` keydown `i` to toggle panel visibility in dev.

Edits write **only** to live three objects (never to the persisted workbench model) — this is a
compose-time aid. Reloading restores the real model, exactly like editing in Nuxt DevTools.

### Dev-only gating

Both the core and the panel are mounted inside a `DEV &&
…` guard. `process.env.NODE_ENV` is a static constant, so production builds (and the `next
build` the project already runs) dead-code-elimit the entire inspector — zero bundle cost. This
matches the existing pattern where `TheatreStudioDev` and `layoutMode` chrome are dev-only.

## Data flow

```
[click on canvas] → core raycaster → store.setSelected(mesh)
                         ↑                         │
store.setPickMode ───────┘                         ▼
                                              panel re-renders
                                              tree highlights row
                                              editor shows props
[user edits prop] → three object mutated → canvas re-renders (rAF)
[useFrame] → gl.info + fps → store.setStats → HUD re-renders (~4Hz)
```

## Constraints / decisions

- **Zero deps.** The project already pins R3F v9 / drei v10 / three 0.182; everything the
  inspector needs (`useThree`, `useFrame`, `gl.info`, `THREE.Raycaster`, `THREE.Box3Helper`,
  `useSyncExternalStore`) ships with those. No `lil-gui` / `leva` / stats.js.
- **No fight with OrbitRig.** Pick mode is opt-in via the toggle, and uses a click-vs-drag
  travel guard, so drag-to-orbit is untouched when picking is off.
- **No export leakage.** The panel is a DOM overlay outside the canvas; the highlight is
  cleared on unmount and the inspector is dev-only — it can never bake into a still/clip.
- **One three scene at a time.** The store is a singleton keyed to the mounted stage; the core
  registers/unregisters on mount/unmount.

## Files

```
packages/components/three/scene-inspector/
  inspector-store.ts      # external store (subscribe/getSnapshot + actions)
  SceneInspectorCore.tsx  # in-canvas: stats + pick + highlight (renders nothing)
  SceneInspectorPanel.tsx # DOM overlay: HUD + toolbar + tree + editor
  SceneTree.tsx           # recursive scene-graph tree
  PropertyEditor.tsx      # selected-node property editor
  StatsHud.tsx            # FPS / gl.info readout
  highlight.ts            # stash/restore + box3 helper (pure three)
packages/components/three/three-d-ipod.tsx   # mount core in <Canvas> (dev-only)
packages/components/ipod/scenes/ipod-3d-stage.tsx # mount panel + `i` hotkey (dev-only)
```
