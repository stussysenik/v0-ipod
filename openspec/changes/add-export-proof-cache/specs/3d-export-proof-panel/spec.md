# 3d-export-proof-panel

## ADDED Requirements

### Requirement: A persistent proof panel SHALL display the cached proof for the current setup

The `/3d` studio SHALL present a persistent right-rail proof panel (not a transient confirm
modal) that displays `cache[currentFingerprint]`. The panel SHALL be a pure reader of the
cache: it SHALL NOT itself trigger a render. When the current fingerprint is cached the
panel SHALL show that frame immediately. This makes the proof ambient and always-true rather
than an action the user waits on.

#### Scenario: Hit shows instantly

- **WHEN** the current fingerprint is cached
- **THEN** the panel shows the proof frame with no spinner and no delay

#### Scenario: Panel persists across edits

- **WHEN** the user adjusts the composition over several changes
- **THEN** the panel remains docked and updates to the proof for each new fingerprint as the
  cache fills

### Requirement: A miss SHALL show the last frame with a non-blocking pending state

When the current fingerprint is not yet cached (a render is in flight), the panel SHALL show
the most recent available proof frame in a dimmed/pending treatment with a subtle
"computing…" indicator, and SHALL resolve to the new frame when the background queue fills
the slot. The panel SHALL never block interaction while pending.

#### Scenario: Pending resolves to the new proof

- **WHEN** the user changes the setup and the new fingerprint is uncached
- **THEN** the panel dims the prior frame and marks it computing, then swaps to the new
  proof once it is rendered

### Requirement: The panel SHALL show the export spec and host the Export action

The panel SHALL display the export specification for the current setup — aspect, quality,
fps, duration, and frame count — and SHALL host the Export action directly with the proof it
validates, so the user exports from the same surface that shows what they will get.

#### Scenario: Export is initiated from the proof surface

- **WHEN** the user is satisfied with the displayed proof
- **THEN** they initiate the export from the panel, and the rendered clip's anchor frame
  matches the proof shown

#### Scenario: Hold style proof equals the whole clip

- **WHEN** the loop style is `hold`
- **THEN** the panel communicates that the static proof frame is the entire clip
