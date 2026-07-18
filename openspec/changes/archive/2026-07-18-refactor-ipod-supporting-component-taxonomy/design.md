## Context
The repository now has a stronger core assembly model than it did before, but the supporting layers still reveal earlier prototype growth:

- several support components remain at `components/ipod/` root even though their role is now clearly `scene`, `control`, `editor`, or `export`
- the ASCII renderer, GIF preview, and framed export stage do not yet read as first-class parts of the same taxonomy
- tests and page objects still reference older names or mixed concepts rather than mirroring the architecture vocabulary
- `lib/` is clearer than before, but some ownership boundaries still read as a flat utility layer instead of explicit subsystems

This creates an avoidable gap between the repository’s code quality and the design-engineering story the project is trying to communicate.

## Goals
- Finish the repository-wide taxonomy for the remaining support components and related modules.
- Keep the codebase readable as a physical product assembly plus explicit workbench support layers.
- Enforce typed, intent-first interfaces for shared editors, controls, and export UI.
- Preserve the current Elm-like `model -> update -> view -> effects` direction rather than letting support files drift back into ad hoc local business logic.
- Make tests, page objects, and docs speak the same vocabulary as the production code.

## Non-Goals
- Standardizing or redesigning the visual theme, token palette, or typography system.
- Reworking the product’s visual direction.
- Introducing new client-state or server-state libraries.
- Replacing the current Next.js / React runtime.
- Renaming files purely for novelty when a compatibility shim is still strategically useful during migration.

## Repository Audit Surface

### Primary component targets
- `components/ipod/ascii-ipod.tsx`
- `components/ipod/click-wheel.tsx`
- `components/ipod/editable-duration.tsx`
- `components/ipod/editable-text.tsx`
- `components/ipod/editable-time.tsx`
- `components/ipod/editable-track-number.tsx`
- `components/ipod/fixed-editor.tsx`
- `components/ipod/framed-export-stage.tsx`
- `components/ipod/gif-preview-modal.tsx`
- `components/ipod/grey-palette-picker.tsx`
- `components/ipod/hex-color-input.tsx`
- `components/ipod/image-upload.tsx`
- `components/ipod/progress-bar.tsx`
- `components/ipod/screen-battery.tsx`
- `components/ipod/star-rating.tsx`

### Follow-through modules
- `components/ipod/ipod-classic.tsx`
- `components/ipod/ipod-screen.tsx`
- `components/ipod/ipod-device-shell.tsx`
- `components/ipod/workbench/ipod-workbench.tsx`
- `components/three/three-d-ipod.tsx`
- `components/ui/marquee-text.tsx`
- `lib/export-scene.ts`
- `lib/export-utils.ts`
- `lib/gif-export.ts`
- `lib/storage.ts`
- `lib/song-snapshots.ts`
- `tests/**/*.ts`
- `scripts/**/*.ts`
- `scripts/**/*.mjs`

### Explicit exclusion for this change
- color token redesign
- design theme standardization
- palette curation changes beyond what is needed for taxonomy or typing boundaries

## Target Topology

The intended taxonomy after this change should converge toward a repository shape like:

```text
components/ipod/
  workbench/
    ipod-workbench.tsx
    ipod-toolbox.tsx
    ipod-theme-panel.tsx
  device/
    ipod-device.tsx
    ipod-click-wheel.tsx
  display/
    ...
  scenes/
    ipod-menu-scene.tsx
    ipod-now-playing-scene.tsx
    ipod-ascii-scene.tsx
  panels/
    ...
  controls/
    progress-bar.tsx
    star-rating.tsx
  editors/
    fixed-editor.tsx
    editable-text.tsx
    editable-time.tsx
    editable-track-number.tsx
    editable-duration.tsx
    hex-color-input.tsx
    image-upload.tsx
    grey-palette-picker.tsx
  export/
    framed-export-stage.tsx
    gif-preview-modal.tsx
  hooks/
    ...
```

The exact filenames may differ if migration ergonomics justify temporary wrappers, but the ownership model should match this structure.

## Design Principles

### 1. Alternate renderers are still scenes
ASCII and related alternate representations should read as display scenes or scene variants, not as unrelated artifacts sitting at the component root.

### 2. Shared controls are hardware or playback primitives
The click wheel, progress bar, and rating control should be categorized as reusable physical or playback controls rather than generic helpers.

### 3. Editors are authoring affordances
Fixed editor, editable text, editable time, editable track counts, image upload, and color inputs should be grouped as authoring surfaces that emit typed intents and stay separate from durable business rules.

### 4. Export belongs to an explicit surface
Framed export stage and GIF preview/recording UI should live behind an explicit export boundary so capture layout, preview playback, and export orchestration do not bleed into general device rendering.

### 5. Tests mirror the architecture
Page objects and test helpers should track workbench, display, control, editor, and export boundaries rather than invent a parallel naming system.

## State And Effect Guidance

### Shared controls and editors
Shared controls may own ephemeral interaction state such as pointer drag state, focus state, or temporary draft strings. They should not own durable persistence, export orchestration, or cross-feature domain policy.

### Workbench-owned effects
Storage writes, export triggers, GIF encoding, file ingestion policies, and click-audio playback should continue to remain above the leaf view layer, even when helper modules move.

### Typed interfaces
All shared component contracts should remain explicit. Props should be concrete and typed; intent callbacks should describe business meaning rather than leak DOM event details upward unless that detail is essential.

## Migration Strategy
1. Inventory the remaining TS/JS module surface.
2. Classify modules by architectural role.
3. Move or wrap the remaining `components/ipod/*` legacy-shape files into explicit categories.
4. Normalize imports and update docs.
5. Align test helpers and page objects.
6. Validate with type-check, build, targeted Playwright coverage, and OpenSpec validation.
