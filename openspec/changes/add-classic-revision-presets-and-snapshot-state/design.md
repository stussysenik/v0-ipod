## Context
The project started as a high-fidelity iPod snapshot and export surface. The new request turns it into a more complete iPod classic experience generator: users should be able to choose between documented device revisions, switch between a fast editing workflow and an authentic iPod-like interaction model, and save meaningful song moments or ranges as durable state.

The codebase already contains a simple `SongSnapshot` model in `lib/storage.ts`, but it only captures metadata plus a minimal UI subset. That is not enough for revision fidelity, deterministic exports, or future API-backed persistence.

## Goals
- Support multiple documented iPod classic revision presets instead of one averaged device.
- Preserve a fast direct-edit workflow while also supporting an authentic iPod-style OS interaction model.
- Establish one canonical, versioned full-state format that can drive live rendering, export, and future API storage.
- Resolve geometry and UI decisions from documented references, not ad hoc visual averaging.

## Non-Goals
- Recreating every pre-classic iPod hardware family in this change.
- Building the backend API in the same change.
- Perfecting every secondary experimental surface before the preset and state architecture is stable.

## Assumptions
- Phase 1 targets the iPod classic family rather than all earlier iPod generations.
- Reference priority is: Apple official product materials and manuals first, archival sources such as Apple Wiki second, then curated video frames and annotated examples for unresolved visual details.
- The same underlying state model should power both direct-edit and authentic navigation modes.

## Architecture

### 1. Shared Full-State Model
Both interaction models should project onto one canonical client state. A representative shape is:

```ts
interface IpodFullState {
  schemaVersion: 2;
  metadata: SongMetadata;
  playback: {
    currentTime: number;
    selectionKind: "moment" | "range";
    rangeStartTime: number | null;
    rangeEndTime: number | null;
  };
  device: {
    hardwarePreset: string;
    interactionModel: "direct" | "ipod-os";
    viewMode: IpodViewMode;
    finishId: string;
    backgroundId: string;
  };
}
```

This shape is intentionally API-ready and deterministic. It keeps playback state separate from device presentation state, which makes replay, export, and later server persistence more stable.

### 2. Preset-Driven Rendering
Rendering should derive from preset bundles rather than scattered conditional values. Each preset should define:
- front-face geometry tokens
- screen chrome tokens
- wheel proportions and line-weight tokens
- canonical layout rules for `Now Playing` and menu screens

That keeps revision work composable and avoids a single component accumulating arbitrary per-version exceptions.

### 3. Dual Interaction Projection
The direct-edit experience should remain the fast authoring and export workflow. The authentic mode should drive navigation through click-wheel-like state transitions and menu focus, but both modes should mutate the same shared state. The interaction model should change control semantics, not fork the data model.

### 4. Legacy Snapshot Migration
The current `SongSnapshot` payload should be migrated into the new format on load. Missing fields should resolve to safe defaults derived from the current product defaults, and the migrated state should be saved back in the canonical format.

## Delivery Order
1. Lock the preset taxonomy and full-state schema.
2. Implement legacy snapshot migration and canonical fixtures.
3. Add settings-level preset and interaction toggles.
4. Refactor rendering to consume preset bundles.
5. Add authentic iPod-style navigation flows on top of the shared state.
6. Re-run export and restoration checks for each supported preset.
