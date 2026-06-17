# Design: Floating Tool Panels & Central Command Palette

## Context

The app's tool surfaces are pinned into fixed docks (`ipod-classic-workbench.tsx`) and hand-positioned absolute clusters (`ipod-3d-stage.tsx`). View mode lives in the XState central machine at `context.presentation.viewMode` (`flat | 3d | focus | preview | ascii`). There is an existing precedent for persisted draggable positions: `IpodNowPlayingLayoutState = Partial<Record<elementId, {x, y}>>` in `lib/ipod-state/model.ts`. `cmdk@1.0.4` is installed but unused. The R3F `<Canvas>` already auto-sizes from its parent DOM element, and `setCaptureViewport` shows the codebase is comfortable mutating canvas dimensions imperatively.

Goal: a reusable floating-panel system (drag / resize / collapse-to-minimal) whose layout persists per view mode, a 3D canvas that reflows in symbiosis with open panels, and a central ⌘K palette that drives it all — without regressing the mobile guarantees from `add-mobile-responsive-stability` and without touching export pixel-exactness or 3D camera semantics.

## Goals / Non-Goals

- **Goals**
  - One `FloatingPanel` primitive: title-bar drag, edge + corner resize, collapse to ideal-minimal, focus-to-front, viewport clamping.
  - Layout (position, size, collapsed, visible) persisted **per view mode** in the central model.
  - Spatial canvas reflows so the model stays fully visible around open panels.
  - Global ⌘K palette: switch modes, summon/toggle/collapse panels, reset layout, run core actions.
  - Mobile/compact: graceful fallback to existing dock/sheet behavior.
- **Non-Goals**
  - No change to export pipeline / pixel-exactness.
  - No change to 3D camera control semantics (`getCameraPose` / `setCameraGoal`); symbiosis changes layout/framing only.
  - No free-floating drag/resize on compact touch viewports (deferred; falls back to docks).
  - No multi-window / pop-out-to-OS-window; panels stay within the app viewport.

## Decisions

- **Decision: layout state lives in the central XState model, keyed by `[viewMode][panelId]`.**
  - Shape: `panelLayout: Partial<Record<IpodViewMode, Partial<Record<PanelId, PanelFrame>>>>` where `PanelFrame = { x, y, w, h, collapsed, visible, z }`.
  - *Why:* Mirrors the existing `IpodNowPlayingLayoutState` precedent and the existing snapshot/persistence path (`normalizeModel`, `RESTORE_MODEL`), so panel layouts persist and round-trip with everything else for free. Per-mode keying delivers "under the mode" — each mode keeps its own arrangement.
  - *Alternatives:* (a) Local component state — loses persistence and per-mode memory. (b) A separate store — splits source of truth from the rest of the model and complicates snapshots. (c) `localStorage` only — duplicates the existing persistence channel.

- **Decision: panels are registered through a static registry, not free-form children.**
  - A `PANEL_REGISTRY: Record<PanelId, { title, idealMinSize, defaultFrame, minSize, content }>` declares each panel's ideal-minimal size, default frame, and constraints. The host renders registered panels by id; the palette and layout state reference the same ids.
  - *Why:* "Ideal smallness" must be a declared property per panel (a color picker collapses differently than a timeline). A registry gives one source of truth shared by the host, the persistence layer, and the command palette.

- **Decision: collapse means snap to the panel's declared `idealMinSize` (title bar + nub), preserving the pre-collapse frame for restore.**
  - *Why:* This is the "view your own ideal smallness" behavior — minimal but still grabbable/identifiable. Restoring returns to the user's last expanded size, not a default.

- **Decision: drag/resize via custom pointer-event handlers, not a new library.**
  - Pointer capture + `requestAnimationFrame`-batched frame updates; commit to XState on pointer-up (transient drag uses local state to avoid a machine event per frame). `touch-action: none` on handles.
  - *Why:* The codebase already hand-rolls pointer drag (OrbitRig, now-playing layout, wheel). Avoids a dep and keeps interaction consistent. Per-frame XState dispatch would be too chatty; commit-on-release matches the export-determinism posture.

- **Decision: canvas symbiosis is layout-driven, not camera-driven.**
  - The 3D stage computes a "safe content rect" = viewport minus the union of visible (non-collapsed) panel frames on the docked edges, and sizes/insets the canvas container to it. The model stays centered in the safe rect. No camera pose change.
  - *Why:* Keeps symbiosis purely presentational and reversible; respects the Non-Goal of not touching camera semantics. The canvas already auto-sizes from its parent, so resizing the parent container is sufficient.

- **Decision: ⌘K palette is global, mounted once in `app/layout.tsx`, built on `cmdk`.**
  - A single key listener (meta/ctrl + K) toggles it; Esc closes. Commands are sourced from a registry that reads current machine state (available modes via feature flags, registered panels) so the list is always live. Typing-in-input is respected (the listener ignores ⌘K only when it would conflict, but ⌘K is reserved globally per the shader-lab pattern).
  - *Why:* One connective surface, as requested. `cmdk` gives fuzzy search + keyboard nav out of the box and is already a dependency.

- **Decision: compact/touch fallback reuses the existing dock/sheet layout.**
  - Below the compact breakpoint, the panel host renders the current docked/bottom-sheet controls (the `add-mobile-responsive-stability` layout) instead of free-floating panels. Drag/resize affordances are not shown.
  - *Why:* Free-floating windows on a phone fight the just-landed stability/reachability guarantees. Keeps this change additive on mobile.

## Risks / Trade-offs

- **Risk: per-frame re-render jank during drag/resize.** → Mitigation: local transient state + rAF batching during the gesture; single XState commit on release.
- **Risk: persisted layout traps a panel off-screen after a viewport resize.** → Mitigation: clamp every frame into the current viewport on mount and on resize; a palette "Reset layout" command and a per-panel reset.
- **Risk: canvas symbiosis reflow conflicts with export capture framing.** → Mitigation: symbiosis is disabled during `isExportCapturing` (same guard the workbench already uses for `previewScale`); export uses its own viewport path.
- **Risk: migrating existing docks into panels is large.** → Mitigation: incremental — land the primitive + palette + one panel first; migrate remaining docks panel-by-panel in later tasks. Docked controls keep working until migrated.
- **Risk: ⌘K collides with browser/OS shortcuts.** → Mitigation: ⌘K is the conventional palette binding (shader-lab, Linear, VS Code); `preventDefault` only when we open.

## Migration Plan

Additive. New state field defaults to empty (`normalizeModel` fills defaults; absent layout → registry `defaultFrame`). Existing docks remain until each is migrated to a panel. No data migration; older snapshots without `panelLayout` normalize cleanly. Rollback = stop mounting the panel host + palette and revert the model field.

## Open Questions

- Should panel layouts be shareable/exportable as part of a song snapshot, or kept device-local? (Lean: part of the model so they round-trip, but could be stripped from shared snapshots — deferred.)
- Snapping: edge/peer snapping and magnetic guides — include in v1 or defer? (Lean: defer; viewport-clamp only in v1.)
