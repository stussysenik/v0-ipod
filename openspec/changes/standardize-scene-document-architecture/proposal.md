# Change: Standardize scene document architecture for authoring, layout, and export

## Why
The current iPod editor already contains part of an AST-like model, but only at the leaf level. `IPodClassic` owns a large mixed state surface, parent/child structure is implicit, the toolbox groups controls by feature instead of by selected node, and export presets/preferences live beside the render tree instead of inside the same canonical contract.

This makes the system harder to reason about, harder to extend, and harder to cleanly adapt across desktop authoring, mobile authoring, export capture, and future 3D/viewer modes. We need one strong data-oriented standard that treats the scene as a document first and the UI as a projection of that document.

## What Changes
- Define a canonical JSON scene document that represents renderable nodes, parent/child relationships, node selection, semantic roles, and non-rendered preferences in a normalized immutable structure.
- Separate semantic structure from layout constraints by introducing projection profiles for desktop authoring, mobile authoring, export presets, and viewer-specific modes.
- Standardize a node-scoped inspection model so identification, decision, navigation, and editing are driven by selected scene paths rather than one large grouped sheet.
- Define bidirectional update rules so wheel/screen/inspector interactions all emit document patches against the same scene graph.
- Document migration boundaries so monolithic state in `components/ipod/ipod-classic.tsx` can be reduced incrementally without breaking current fidelity work.
- Establish dead-code cleanup rules that only remove legacy branches after the equivalent scene-document path reaches parity.

## Impact
- Affected specs:
  - `scene-document`
  - `projection-profiles`
- Affected code:
  - `components/ipod/ipod-classic.tsx`
  - `components/ipod/ipod-screen.tsx`
  - `components/ipod/click-wheel.tsx`
  - `components/ipod/ipod-device-shell.tsx`
  - `components/ipod/framed-export-stage.tsx`
  - `lib/storage.ts`
  - `lib/export-scene.ts`
  - `lib/export-utils.ts`
  - `types/ipod-state.ts`
  - future scene-document modules under `lib/` or `types/`
  - Playwright coverage for mobile, export, and interaction flows under `tests/`
