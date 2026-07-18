## 1. References And Product Definition
- [x] 1.1 Assemble a per-preset reference matrix for the supported iPod classic revisions, including front-face geometry, wheel proportions, screen chrome, and canonical `Now Playing` layouts.
- [x] 1.2 Define the supported preset taxonomy and naming so settings, saved state, and exports refer to the same revision identifiers.
- [x] 1.3 Document unresolved visual ambiguities and record the source-priority rule used to resolve them.

## 2. Core State And Persistence
- [x] 2.1 Extend the current snapshot schema into a versioned full-state contract that remains compatible with existing local storage data.
- [x] 2.2 Add fields for hardware preset, interaction model, playback moment, optional playback range, and render-affecting device settings.
- [x] 2.3 Implement migration logic from the current `SongSnapshot` shape to the new full-state model.
- [x] 2.4 Seed canonical demo states and test fixtures that cover single-moment and range-based saves.

## 3. Settings And Interaction Architecture
- [x] 3.1 Add settings controls for selecting the active iPod classic revision preset.
- [x] 3.2 Add a toggle between direct authoring mode and authentic iPod-style OS navigation mode.
- [x] 3.3 Ensure both interaction models read from and write to the same underlying song and playback state.
- [x] 3.4 Preserve export readiness and editing speed when the user switches away from authentic OS mode.

## 4. Revision-Specific Rendering
- [x] 4.1 Refactor shell, screen, and wheel rendering so preset-specific geometry and line weights can be applied without branching chaos.
- [x] 4.2 Rebuild screen composition rules so `Now Playing` and menu layouts follow the active preset rather than one averaged layout.
- [x] 4.3 Ensure Flat and Preview exports reflect the active preset and interaction state consistently.

## 5. Snapshot Authoring And API Readiness
- [x] 5.1 Update save/load interactions so users can capture either an exact playback moment or a start/end range.
- [x] 5.2 Serialize enough state for future API-backed persistence, replay, and export workflows without needing a second client-side format.
- [x] 5.3 Keep saved state deterministic so the same snapshot can be restored into the same screen, progress, and export context.

## 6. Validation
- [x] 6.1 Add regression coverage for preset switching, interaction-model switching, legacy snapshot migration, and range serialization.
- [x] 6.2 Run the relevant Playwright suites and manual visual checks for each supported preset.
- [x] 6.3 Run `react-doctor` after React implementation work.
- [x] 6.4 Run `openspec validate add-classic-revision-presets-and-snapshot-state --strict --no-interactive`.
