## Context

The current implementation has three useful traits and one structural problem:

1. The app already has identifiable leaf elements for now-playing layout (`artwork`, `title`, `artist`, `album`, `rating`, `track-info`, `progress`, `elapsed-time`, `remaining-time`).
2. The app already uses typed state for view mode, interaction model, snapshot selection, and export presets.
3. The app already has meaningful render boundaries such as page, stage, shell, screen, and wheel.

The structural problem is that these traits are not unified by one canonical document. Semantic structure, layout rules, export preferences, and inspector grouping are split across large component state, helper functions, and ad hoc UI branches.

## Goals

- Create a canonical scene document that becomes the source of truth for rendering, selection, editing, export, and persistence.
- Make parent/child relationships explicit so the interface can be inspected and navigated as a tree.
- Keep the model data-oriented, serializable, immutable, and projection-friendly.
- Separate node semantics from spatial constraints and profile-specific layout behavior.
- Support incremental migration from the current code without requiring a rewrite.

## Non-Goals

- Rebuild the entire application in a single change.
- Replace the current rendering aesthetic or fidelity targets.
- Commit to a new global state library in this proposal.
- Remove legacy state before parity exists in the scene-document path.

## Standard

The standard is a two-layer contract:

1. `SceneDocument`
   - semantic tree
   - normalized nodes
   - parent/child relationships
   - selection and navigation state
   - reusable preferences and export intent

2. `ProjectionProfile`
   - layout constraints
   - spacing rules
   - visibility rules
   - touch/pointer behavior thresholds
   - export framing and preset geometry

React components and CSS become projections of these two layers, not a second source of truth.

## Proposed Data Model

```json
{
  "version": 1,
  "rootId": "scene",
  "selectedNodeId": "title",
  "nodes": {
    "scene": {
      "id": "scene",
      "kind": "scene",
      "role": "root",
      "children": ["stage", "toolbox"],
      "props": {
        "backgroundColor": "#F3F2EE",
        "hardwarePreset": "classic-2009"
      }
    },
    "stage": {
      "id": "stage",
      "kind": "container",
      "role": "preview-stage",
      "children": ["shell"]
    },
    "shell": {
      "id": "shell",
      "kind": "device-shell",
      "role": "ipod-shell",
      "children": ["screen", "wheel"]
    },
    "screen": {
      "id": "screen",
      "kind": "screen",
      "role": "playback-screen",
      "children": ["status-bar", "now-playing"]
    },
    "now-playing": {
      "id": "now-playing",
      "kind": "container",
      "role": "now-playing-layout",
      "children": [
        "artwork",
        "title",
        "artist",
        "album",
        "rating",
        "track-info",
        "progress"
      ]
    },
    "progress": {
      "id": "progress",
      "kind": "progress",
      "role": "playback-progress",
      "children": ["elapsed-time", "remaining-time"]
    }
  },
  "preferences": {
    "interactionModel": "ipod-os",
    "viewMode": "flat",
    "selectionKind": "moment",
    "exportPreset": "product"
  },
  "profiles": {
    "authoring-desktop": {},
    "authoring-mobile": {},
    "export-product": {},
    "export-story": {}
  }
}
```

## Architectural Rules

### 1. Normalized Nodes

- Every renderable or inspectable entity MUST have a stable `id`, `kind`, `role`, and `children`.
- Parent/child relationships MUST be discoverable from the document alone.
- Nodes MUST contain semantic props only, not viewport-specific measurements.

### 2. Projection Profiles

- Viewport- and context-specific spacing MUST live in projection profiles, not inside node semantics.
- A profile MAY define offsets, size constraints, pinning, visibility, and gesture policy.
- Export presets MUST be represented as projection profiles, not special-case render branches.

### 3. Bidirectional Editing

- UI interactions MUST emit intents against node ids or scene paths.
- Reducers/selectors MUST update the scene document immutably.
- Inspector edits, drag operations, click-wheel navigation, and export preset changes MUST patch the same document model.

### 4. Node-Scoped Inspection

- The inspector MUST be driven by `selectedNodeId` and path breadcrumbs.
- Global settings MAY exist, but node-specific controls MUST be grouped by selected node semantics.
- Mobile sheets MUST project the same inspector model, not a separate control taxonomy.

### 5. CSS/Component Boundary

- React components MUST read from selectors/projectors derived from `SceneDocument` and `ProjectionProfile`.
- CSS variables or inline styles MAY be used for final presentation, but they MUST be derived from profile output.
- Components MUST remain dumb with respect to document ownership; orchestration belongs in scene reducers/selectors.

## Migration Strategy

### Phase 1: Document Definition

- Introduce `SceneDocument` and projector types beside existing `IpodUiState`.
- Map current now-playing leaf ids into canonical node ids.
- Add selectors that derive current render props from the new document while preserving current UI behavior.

### Phase 2: Stage And Shell Extraction

- Extract stage/shell/screen/wheel parents as first-class scene nodes.
- Route export framing through the same shell/stage abstraction already used by framed export code.
- Replace duplicated shell geometry branches with a shared projection path.

### Phase 3: Inspector Standardization

- Replace grouped toolbox-only logic with node-aware selection and breadcrumbs.
- Keep global controls in a smaller scene-level inspector section.
- Reuse the same inspector sections for desktop and mobile, with only profile-level layout differences.

### Phase 4: Legacy Cleanup

- Remove duplicated or dead branches only after scene-document rendering reaches parity.
- Keep test coverage focused on tree selection, profile switching, export parity, and mobile usability.

## Trade-offs

### Option A: Keep expanding the current monolithic state

- Lowest short-term cost.
- Highest long-term coupling.
- Continues mixing semantics, layout, preferences, and export logic.

### Option B: Introduce a canonical scene document with projection profiles

- Slightly higher upfront modeling cost.
- Strongest long-term standard.
- Best fit for AST navigation, node-scoped editing, export reuse, and dead-code cleanup.

This proposal selects Option B.

## Validation Strategy

- Unit-test selectors and projectors from `SceneDocument` to render props.
- Preserve Playwright coverage for mobile controls, editing, and export.
- Add tests that assert breadcrumb selection, node inspector parity, and export preset determinism from profile selection.
