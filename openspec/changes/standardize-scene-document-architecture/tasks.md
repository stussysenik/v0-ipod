## 1. Specification
- [x] 1.1 Define the canonical `scene-document` capability and its normalized node contract.
- [x] 1.2 Define the `projection-profiles` capability for desktop, mobile, export, and viewer contexts.
- [x] 1.3 Record migration boundaries between existing `IpodUiState` state and the new scene-document path.

## 2. Data Model
- [x] 2.1 Introduce typed `SceneDocument`, `SceneNode`, `ScenePreferences`, and `ProjectionProfile` contracts.
- [x] 2.2 Map current now-playing layout ids and parent containers into stable scene node ids.
- [x] 2.3 Define immutable patch/intention helpers for selection, node edits, and profile switching.

## 3. Rendering
- [ ] 3.1 Extract selectors/projectors that derive screen, shell, toolbox, and export props from the scene document.
- [ ] 3.2 Reuse shared shell/stage projection paths so flat preview and export do not duplicate geometry logic.
- [ ] 3.3 Introduce breadcrumb-based node inspection and selected-node control grouping.

## 4. Responsive And Export
- [ ] 4.1 Add mobile projection rules for compact inspector layout without changing semantic node structure.
- [ ] 4.2 Route export preset selection through projection profiles instead of side-channel state.
- [ ] 4.3 Verify deterministic export output from the same scene document used for authoring.

## 5. Cleanup And Validation
- [ ] 5.1 Remove dead or duplicated state branches only after scene-document parity is verified.
- [ ] 5.2 Add or update tests for selection, profile switching, mobile inspector behavior, and export parity.
- [x] 5.3 Run `openspec validate standardize-scene-document-architecture --strict --no-interactive`.
