## Context

The current editing surface is still shaped like a floating utility palette:

- a compact mobile toggle reveals a generic `toolbox-panel`
- a `theme-panel` contains hardware presets, interaction mode, colors, snapshot controls, and persistence actions in one long sheet
- desktop and mobile share some controls, but not a single structural editing model
- scene selection, breadcrumbs, and export history are not presented as first-class authoring affordances

At the same time, the in-flight `standardize-scene-document-architecture` change establishes the deeper contract this redesign needs:

- canonical `SceneDocument`
- explicit parent/child nodes
- profile-driven layout
- selected-node semantics

This redesign should consume that contract, not replace it.

## Design Brief

### Feature Summary

Build a scene inspector for a detail-oriented author who treats the iPod now-playing surface as a crafted artifact, not a casual form. The inspector must make structure, state, and history legible while preserving a minimal, soulful visual language and strong mobile ergonomics.

### Primary User Action

The most important action is: identify the current scene node, understand where it lives in the parent/child tree, and adjust it without losing context about export state, snapshot state, or prior captures.

### Design Direction

The direction is precise, essential, and kinetic:

- precise: outlines, hierarchy, spacing, and contrast make every control feel intentional
- essential: low-noise surfaces, flat information architecture, and strong grouping by meaning
- kinetic: motion explains state changes, especially tree unfolding, sheet expansion, and context transitions

The target feel is not skeuomorphic nostalgia. It should feel like a modern authoring OS for the iPod scene system: quiet, disciplined, and deeply considered.

### Layout Strategy

The inspector is staged into five layers:

1. Shell trigger
   - the mobile toolbox button becomes the entry point into the scene inspector shell
   - desktop keeps a persistent docked inspector rail

2. Scene header
   - current scene label, active breadcrumb path, and quick context chips for mode/profile/export state

3. Tree navigator
   - parent/child scene nodes rendered as a collapsible tree
   - selection and expansion are independent but coordinated

4. Node editor
   - selected-node controls grouped by node semantics
   - scene-level controls remain available in a dedicated scene section rather than mixed into all nodes

5. History rail/section
   - snapshots and completed exports shown as persistent artifacts with metadata and replay/load actions

On mobile, these layers stack in one inspector sheet. On desktop, the tree and editor can coexist in a split inspector panel if space allows.

### Key States

- default: current node selected, tree partially expanded to selected path
- mobile closed: only trigger visible
- mobile open: full-height inspector sheet with preserved selection context
- node with children: collapsed and expanded states
- scene-level selection: global controls and history visible
- no history yet: empty-state messaging that explains how snapshot/export artifacts appear
- exporting: history section shows pending/exporting state without blocking navigation
- archived legacy mode: reference-only legacy toolbox remains present in repo but not mounted in the default UI

### Interaction Model

- selecting a node highlights it in the tree and updates breadcrumbs plus editor content
- expanding/collapsing tree branches uses transform/opacity-driven motion and minimal layout thrash
- mobile shell opens from the toolbox button into a profile-driven sheet
- scene-level actions such as export, snapshot save/load, and profile changes remain reachable from a stable top layer
- history items can be inspected, restored, or referenced without leaving the inspector context

### Content Requirements

- clear path labels and node titles
- small scene metadata chips for view mode, interaction model, and export profile
- explicit labels for snapshot/history state
- concise empty-state copy for history and unselected nodes
- clear separation between live editing, saved snapshots, and completed exports

## Goals

- Replace the monolithic settings sheet with a tree-first inspector shell.
- Preserve the current implementation in a frozen archive path.
- Use Kumo components wherever they fit cleanly, and use Kumo/Base UI primitives where a custom tree composition is still required.
- Keep the new shell fully responsive and driven by the same semantic scene model on desktop and mobile.
- Treat snapshot/export history as part of authoring, not hidden persistence.
- Improve discoverability, control grouping, and future maintainability.

## Non-Goals

- Delete or rewrite the legacy toolbox in place.
- Introduce a backend requirement before the history model exists locally.
- Force a dedicated tree-view dependency if Kumo primitives already cover the need.
- Block the redesign on `bacon`; the repo does not currently include it, and the existing JS/TS quality gates are sufficient for this change.

## Architecture

### 1. Legacy Archive Contract

The current toolbox/settings implementation MUST be preserved in a dedicated archive path, for example:

```text
components/ipod/archive/legacy-toolbox/
```

Rules:

- legacy code is copied, not deleted
- archived modules are marked read-only via a local README or file header comment
- the live app does not import the archived implementation except behind an explicit debug flag if one is added later

### 2. Inspector Shell Composition

The new live inspector SHOULD be decomposed into small owned modules, for example:

```text
components/ipod/scene-inspector-shell.tsx
components/ipod/scene-tree.tsx
components/ipod/scene-tree-node.tsx
components/ipod/scene-breadcrumbs.tsx
components/ipod/scene-node-panel.tsx
components/ipod/scene-history-panel.tsx
components/ipod/scene-shell-trigger.tsx
```

Ownership boundaries:

- shell: visibility, layout mode, stage transitions
- tree: node expansion, selection display, breadcrumbs linkage
- node panel: selected-node editor surface
- history panel: snapshots and completed exports

### 3. Kumo Strategy

Use Kumo as the first choice for published UI primitives:

- `Button`
- `Collapsible`
- other published Kumo components where they match cleanly

When Kumo does not expose a dedicated component, prefer Kumo re-exported Base UI primitives rather than introducing another UI dependency.

The tree itself is expected to be a project composition built on top of these primitives rather than a drop-in third-party tree widget.

### 4. Tokens And Styling

The redesign MUST define explicit inspector tokens for:

- surface/background layers
- outline and border contrast
- spacing scale
- corner radii
- motion timing and easing
- focus/selection states

Use CSS variables with Tailwind utilities layered on top. Motion should be transform/opacity-first where possible.

### 5. Scene History Model

History should start as local-first persistence and remain database-ready.

Minimal artifact model:

- `id`
- `kind` (`snapshot` | `export`)
- `createdAt`
- `title`
- `sceneDocumentVersion`
- `selectedNodeId`
- `profileId`
- `exportPresetId` when relevant
- `selectionKind`
- summary metadata for the current track and timing context

This change does not require a production database, but it MUST define a persistence interface that can later sync to one without rewriting the inspector UI.

### 6. Quality And Discoverability

The redesign MUST preserve or improve:

- ESLint, Prettier, and TypeScript validation
- Playwright coverage for mobile shell behavior, tree selection, and history visibility
- component discoverability through focused file boundaries and explicit names
- scene-document ownership through selectors and immutable intents rather than ad hoc local branching

If `husky` is added, it should enforce the existing quality gates. `bacon` remains optional and out of scope for the first implementation pass.

## Rollout Plan

### Stage 0: Archive

- move the current toolbox/settings UI into a frozen archive path
- add documentation on how to inspect or restore it manually

### Stage 1: Shell Trigger And Frame

- replace the current mobile toolbox trigger and desktop dock container
- introduce the new inspector shell frame with placeholder sections

### Stage 2: Tree And Breadcrumbs

- render the canonical scene tree
- sync selection and path breadcrumbs with the selected node

### Stage 3: Node Panels

- move scene-level and node-level controls into semantic panels
- remove grouped-sheet logic from the live shell

### Stage 4: History

- persist snapshots and completed exports as history artifacts
- display them in the scene history panel

### Stage 5: Cleanup

- remove only the now-dead live toolbox branches after parity is verified
- keep the frozen archive

## Trade-offs

### Option A: Keep evolving the existing toolbox sheet

- lower short-term cost
- keeps current test ids and flows mostly intact
- preserves poor structural discoverability

### Option B: Archive legacy and rebuild around a tree-first shell

- higher upfront cost
- cleaner long-term architecture
- aligns directly with scene-document and projection-profile work
- gives mobile and desktop one semantic editing model

This proposal selects Option B.

## Validation Strategy

- Playwright coverage for mobile open/close, tree expansion, and selected-path continuity
- tests for node selection and breadcrumb derivation from scene document selectors
- persistence tests for snapshot/export history entries
- visual/manual validation that the archived legacy toolbox remains recoverable in-repo

