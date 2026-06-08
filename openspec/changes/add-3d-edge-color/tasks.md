# Tasks: Independently colorable device edges on /3d

Every phase ends with a **visual verification** on the running `/3d` (vision check) — the
edge must read as its own controllable band, and unedited devices must look unchanged.

## 1. Geometry: make the edges their own material zone
- [x] Decide split strategy per `design.md` (material-group split on the side faces of the
  `bodyGeo` ExtrudeGeometry vs. a thin edge-trim mesh) and implement it in
  `components/three/three-d-ipod.tsx`
- [x] If material-group split: assign the ExtrudeGeometry side/bevel-face group a second
  material index so the back cap and the sides resolve to separate materials
- [x] Keep the back cap on `backColor` (steel: metalness 1.0, satin roughness, env-driven)
  and route the side/rim faces to a new `edgeColor`
- [x] Verify the seam between face / edge / back stays crisp (no doubled bevels, no z-fight)

## 2. State plumbing (mirror `backColor`)
- [x] Add `edgeColor: string` to `IpodPresentationState` in `lib/ipod-state/model.ts`
- [x] Seed `edgeColor` (default = back color) in `createInitialIpodWorkbenchModel`
- [x] Add a `SET_EDGE_COLOR` action to the reducer in `lib/ipod-state/update.ts`
- [x] Default `edgeColor` to the back color on `SET_HARDWARE_PRESET` and on snapshot apply
- [x] Normalize + persist `edgeColor` in `lib/ipod-state/storage.ts`, falling back to
  `backColor` when absent (so older saved snapshots still load and look unchanged)

## 3. Material wiring
- [x] Thread `edgeColor` from the workbench state into `ThreeDIpod` / `IpodModel` props
- [x] Bind the edge material zone to `edgeColor` (flat + finish material paths)
- [x] Reset the settle/needle-drop effect dependency to include `edgeColor` (parity with
  the other color deps) so an edge edit acknowledges with the same physical beat

## 4. Control surface
- [x] Add an **Edges** row to the `PARTS` array in
  `components/ipod/scenes/ipod-3d-color-cockpit.tsx` (`SET_EDGE_COLOR`,
  `value: (p) => p.edgeColor`)
- [x] Have the default finishes (Silver/Black) and named looks set `edgeColor` from their
  `backColor` so picking a finish keeps edge == back until manually changed

## 5. Composition + persistence verification
- [x] Verify the edge color composes with the anodized-aluminum material model and the
  default lighting rig (no blow-out on a light edge, distinct from a dark back)
- [x] Verify saved finishes/looks/studio shots round-trip the edge color
- [x] Verify reload restores a custom edge color from persistence
- [x] Verify a fresh/legacy snapshot with no `edgeColor` renders edge == back (unchanged)

## 6. Program validation
- [x] `pnpm type-check` + `pnpm lint` clean
- [ ] Before/after screenshots: default (edge == back, unchanged) and a deliberate
  contrasting edge (e.g. black back + silver rim)
