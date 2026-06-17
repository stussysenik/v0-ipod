# Change: Floating Tool Panels & Central Command Palette

## Why

The workbench tools (color editors, settings, studio controls, shot list, timeline-ish editors) are pinned into fixed docks and toolboxes. They cannot be moved, resized, or shrunk to get out of the way of the iPod — the very thing the user is trying to look at. On `/3d` the floating control clusters are positioned by hand-tuned absolute coordinates per orientation, which is brittle and does not let the user reclaim space around the model.

We want the [basement.studio shader-lab](https://eng.basement.studio/tools/shader-lab) pattern — **draggable, resizable floating panels** — but better:

- Each panel can **self-size to its own ideal minimal form** (collapse to a title-only / icon nub) **or** be freely user-resized. "View your own ideal smallness."
- Panels live **under the current view mode** (`flat` / `3d` / `focus` / `preview` / `ascii`), and their layout is remembered **per mode** so each mode keeps its own arrangement.
- The **spatial 3D canvas resizes in symbiosis** with the panels — it reflows to stay fully visible around whatever panels are open, instead of being shoved off-screen. The panel system and the canvas form one principled layout, not two systems fighting for pixels.
- A **central ⌘K command palette** is the connective tissue: switch modes, summon / toggle / collapse panels, run actions, and reset the layout — all from one keyboard surface. `cmdk@1.0.4` is already a dependency and currently unused.

## What Changes

- **New floating-panel-system capability.** A reusable floating window primitive: title-bar drag, edge + corner resize handles, collapse-to-minimal, focus-to-front z-ordering, viewport clamping, and a per-mode persisted layout map (position, size, collapsed, visible) stored in the central XState model — mirroring the existing `IpodNowPlayingLayoutState` `Record<id, {x,y}>` precedent.
- **Canvas symbiosis.** The spatial 3D canvas reads the active panel layout and reflows its usable framing so the model is never permanently occluded or clipped by an open panel.
- **New command-palette capability.** A global ⌘K / Ctrl+K palette built on `cmdk` that exposes mode switching, panel management (summon / toggle / collapse / reset layout), and core actions, with fuzzy search and full keyboard navigation.
- **Mobile/touch fallback (non-breaking).** On compact viewports the panels degrade to the existing docked / bottom-sheet behavior rather than free-floating, preserving the just-landed `add-mobile-responsive-stability` guarantees.

## Impact

- Affected specs: `floating-panel-system` (new), `command-palette` (new)
- Related specs: `mobile-responsive-layout` (compact fallback must not regress its stability/reachability guarantees), `3d-camera-system` (canvas symbiosis reflows layout only — no change to camera control semantics)
- Affected code (apply stage):
  - `lib/ipod-state/model.ts`, `lib/ipod-state/update.ts` — panel layout state shape + normalization defaults
  - `lib/xstate/central-machine.ts` — panel layout events (move / resize / collapse / toggle / reset)
  - New `components/ipod/panels/` — `FloatingPanel` primitive + panel registry/host
  - New `components/ipod/command/` — `CommandPalette` (cmdk) + command registry
  - `components/ipod/workbench/ipod-classic-workbench.tsx`, `components/ipod/scenes/ipod-3d-stage.tsx` — host the panel system; migrate existing dock controls into panels (incrementally); canvas symbiosis wiring
  - `app/layout.tsx` — mount the global command palette + key listener
  - `tests/` — panel interaction + palette regression coverage
- Dependencies: `cmdk` (already installed). No new runtime deps required for drag/resize (custom pointer-event handlers, consistent with existing custom OrbitRig / drag code).
