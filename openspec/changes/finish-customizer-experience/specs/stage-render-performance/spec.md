## ADDED Requirements

### Requirement: Non-Blocking Model Persistence
Workbench model persistence SHALL NOT perform synchronous storage writes on every
state change during continuous interaction; writes are debounced with a trailing
flush that runs on page hide and unmount so no acknowledged edit is lost.

#### Scenario: Slider drag does not write per frame
- **WHEN** a user drags a color or lighting control continuously
- **THEN** localStorage is written at most once per debounce window and the final
  value is persisted after the drag ends

#### Scenario: Flush on leave
- **WHEN** the page is hidden or the stage unmounts within the debounce window
- **THEN** the pending model state is flushed to storage before teardown

### Requirement: Pose-Stable Color Edits
The 3D device settle (drop) animation SHALL re-trigger only when the finish or
hardware preset changes, never on color-only edits, so rapid color changes keep a
stable pose and do not restart per-frame spring work.

#### Scenario: Color spam keeps pose
- **WHEN** a user rapidly changes shell/stage colors ten times
- **THEN** the device pose remains settled and no drop animation replays

### Requirement: Single Viewport Subscription
The 2D workbench SHALL derive viewport dimensions from a single shared
subscription rather than parallel resize listeners with duplicate state.

#### Scenario: One resize handler per surface
- **WHEN** the 2D workbench is mounted
- **THEN** viewport size state updates flow from one resize/orientation
  subscription shared by the workbench and panel system
