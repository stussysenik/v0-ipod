## Context
The repo is currently strongest as a visual artifact and weaker as a deliberately structured frontend system. The main bottlenecks are not missing features; they are mixed responsibilities, oversized feature files, and unclear boundaries between physical part rendering, screen scenes, state updates, and side effects.

The iPod is also a special kind of frontend object: it is best understood as a physical product assembly rather than a generic app shell. That suggests a structure where naming and composition should mirror an industrial-design mental model.

## Goals
- Make the codebase read like a physical assembly with explicit scene composition.
- Move toward an Elm-like `model -> update -> view -> effects` structure without changing product behavior.
- Keep the visual and CSS craft as the hero rather than burying the project under unnecessary infrastructure.
- Make the dependency policy explicit: local state first, remote-state tools only when remote state exists.
- Create a cleaner review surface for design engineering and frontend systems work.

## Non-Goals
- Introducing a new server-state layer before the app has meaningful remote data.
- Introducing a global client-state library purely to shorten prop chains.
- Rewriting the product into a new framework or replacing the current stack.
- Changing the visual direction as part of this architecture pass.

## Product And Engineering Principles

### 1. Physical nouns for physical parts
Component names should map to the device assembly:
- `workbench` for the app-level orchestrator
- `device` for the assembled object
- `shell` for the enclosure
- `display` for the physical screen assembly
- `scene` for display content modes
- `panel` for grouped content regions
- `control` for reusable interaction hardware or UI controls
- `editor` for authoring-only affordances

### 2. One model, many views
The app should maintain one canonical snapshot-oriented domain model and derive multiple views from it. Feature modes may change interaction semantics, but they should not fork the underlying data model.

### 3. Pure updates, isolated effects
State transitions should be pure and testable. Persistence, export, click audio, and upload handling should be adapters around that model rather than logic embedded in presentation components.

### 4. Infrastructure restraint
The product is currently local-first. Do not add TanStack Query, Zustand, or Nanostores unless the app gains genuine remote state or multiple independently mounted consumers that materially benefit from a shared store.

### 5. CSS and token craft stay central
The project’s strongest signal is visual fidelity and careful CSS. Architecture should make that craft easier to reason about, not dilute it with avoidable abstraction.

## Current Architectural Pressure Points
- `components/ipod/ipod-classic.tsx` acts as workbench, state owner, export orchestrator, and device composition root.
- `components/ipod/ipod-screen.tsx` mixes display chrome, status bar, scene switching, drag-layout behavior, and editable content.
- State transitions are partially pure already, but they are still anchored inside a large component file.
- Side effects such as storage and export are isolated in places, but component ownership still obscures the boundary.

## Target Structure

```text
components/ipod/
  workbench/
    ipod-workbench.tsx
  device/
    ipod-device.tsx
    ipod-shell.tsx
    ipod-display.tsx
    ipod-click-wheel.tsx
  display/
    ipod-status-bar.tsx
    ipod-battery-indicator.tsx
    ipod-display-viewport.tsx
    ipod-glass-overlay.tsx
  scenes/
    ipod-menu-scene.tsx
    ipod-now-playing-scene.tsx
  panels/
    ipod-artwork-panel.tsx
    ipod-track-meta-panel.tsx
    ipod-playback-footer.tsx
  editors/
    editable-text.tsx
    editable-time.tsx
    editable-track-number.tsx
    fixed-editor.tsx
  hooks/
    use-ipod-now-playing-layout.ts
lib/ipod-state/
  model.ts
  update.ts
  selectors.ts
  effects.ts
```

## State Mapping

### Canonical model
The system should converge on a single snapshot domain model that contains:
- song metadata
- playback state
- hardware preset and presentation state
- interaction mode and layout state

### Update layer
The system should express state changes as pure update functions driven by explicit action types. React remains the runtime host, but domain transitions should no longer depend on component-local implementation details.

### Effects layer
The following concerns should remain outside visual components:
- localStorage persistence
- export orchestration
- click audio playback
- file import / artwork ingest

## Dependency Policy

### TanStack Query
Do not add TanStack Query in this change. It becomes justified only when the project introduces actual remote server state such as:
- cloud snapshot persistence
- provenance or finish catalogs fetched over the network
- async import or processing jobs
- authenticated user workspaces

### Zustand / Nanostores
Do not add a client-state library in this change. The preferred order is:
1. extract pure domain state and update functions
2. keep React local state as the runtime boundary
3. introduce a store only if multiple independent consumers make that necessary

If a store ever becomes necessary, the decision should be justified against the canonical domain model rather than used as a substitute for decomposition.

## Migration Sequence
1. Document the naming model and target folder taxonomy.
2. Extract canonical state types and pure update functions.
3. Split display chrome from screen scenes.
4. Move drag-layout behavior into a dedicated hook/module.
5. Keep export and persistence as explicit adapters around the canonical model.
6. Update tests and docs to match the new boundaries.
