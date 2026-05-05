## ADDED Requirements

### Requirement: iPod State Model
The ipod package SHALL define an `IpodModel` algebraic type capturing all state: metadata
(title, artist, album, artwork, duration, rating, track info), presentation (skin color,
background color, view mode, hardware preset), interaction (model, OS screen, menu index,
editability, play state, battery), and playback (current time, selection kind, range bounds).

#### Scenario: Model construction
- **WHEN** `IpodModel::default()` is called
- **THEN** a valid model is returned with sensible defaults (flat view, graphite color, 0:00 time)

#### Scenario: Normalization after mutation
- **WHEN** a model update violates invariants (e.g., negative duration)
- **THEN** `normalize_model()` clamps values to valid ranges

### Requirement: iPod Event System
The package SHALL define all 29 original workbench actions as `IpodEvent` constructors covering
metadata editing, view switching, color changes, interaction mode changes, playback control,
snapshot operations, and battery updates.

#### Scenario: Metadata event
- **WHEN** `IpodEvent::UpdateTitle("New Title")` is constructed
- **THEN** the event carries the string payload for title update

#### Scenario: View mode event
- **WHEN** `IpodEvent::SetViewMode(Preview)` is constructed
- **THEN** the event carries the target view mode enum value

### Requirement: State Transitions
The package SHALL implement an FSM using ibuki that handles all 29 event types, producing
correct next states and appropriate effects.

#### Scenario: Metadata transition
- **WHEN** `UpdateTitle("Hello")` is dispatched
- **THEN** the model's `metadata.title` is set to "Hello" and a `persist_metadata` effect is emitted

#### Scenario: Color transition
- **WHEN** `SetSkinColor("#FF0000")` is dispatched
- **THEN** the model's `presentation.skinColor` is set and a `persist_ui` effect is emitted

#### Scenario: View mode transition
- **WHEN** `SetViewMode(Ascii)` is dispatched
- **THEN** the model's `presentation.viewMode` changes to Ascii

#### Scenario: Invalid transition
- **WHEN** an event with a guard that checks view mode is dispatched while in wrong mode
- **THEN** the state remains unchanged

### Requirement: Color System
The package SHALL provide a color system with 9 authentic Apple iPod finishes, 6 grey undertone
families with 23 perceptual lightness stops each, OKLCH-based color math, wheel contrast
derivation, and hex deduplication.

#### Scenario: Apple finishes
- **WHEN** `get_authentic_colors()` is called
- **THEN** a list of 9 entries is returned with labels (graphite, silver, starlight, midnight, blue, pink, purple, red, green)

#### Scenario: Grey palette
- **WHEN** `get_grey_palette("warm")` is called
- **THEN** 23 lightness stops are returned with OKLCH hue/chroma/lightness values

#### Scenario: Wheel color derivation
- **WHEN** `derive_wheel_colors("#333333")` is called with a dark color
- **THEN** light wheel labels and appropriate border contrast are computed

#### Scenario: Hex deduplication
- **WHEN** the grey palette builds its swatch list
- **THEN** duplicate hex colors across adjacent stops are merged into single entries

### Requirement: Marquee Math
The package SHALL provide pure functions for computing marquee animation parameters:
frame scroll position given elapsed time, total cycle duration given text and container
dimensions, and gap width between repeated text instances.

#### Scenario: Frame at start
- **WHEN** `get_marquee_frame(0, cycle_duration)` is called at elapsed time 0
- **THEN** the scroll position is at the start (0px)

#### Scenario: Frame at midpoint
- **WHEN** `get_marquee_frame(cycle_duration / 2, cycle_duration)` is called at half duration
- **THEN** the scroll position is approximately at the midpoint

#### Scenario: No overflow
- **WHEN** text width is less than container width
- **THEN** `get_marquee_cycle_duration()` returns a static display with no scrolling

### Requirement: Export Plan
The package SHALL compute export frame plans including total frame count, frame delay,
capture dimensions, and per-frame interpolated display values for marquee position and
progress simulation.

#### Scenario: Plan for 3-second GIF
- **WHEN** `build_export_plan(3.0, 12, 2.0)` is called (3s, 12fps, 2x scale)
- **THEN** the plan contains 36 frames at ~83ms delay with capture dimensions at 2x

#### Scenario: Duration clamping
- **WHEN** `clamp_export_duration(120.0)` is called with a value above maximum
- **THEN** the duration is clamped to the max value (e.g., 30 seconds)

### Requirement: Snapshot Persistence
The package SHALL serialize a full `IpodModel` to JSON and deserialize it back,
maintaining the same localStorage key names as the original for data compatibility.

#### Scenario: Round-trip serialization
- **WHEN** a model is serialized to JSON and deserialized back
- **THEN** the resulting model equals the original

#### Scenario: Invalid JSON
- **WHEN** `deserialize_model("{invalid}")` is called
- **THEN** an error result is returned with a parse failure message

#### Scenario: Missing field in JSON
- **WHEN** a JSON object is missing required fields like `metadata`
- **THEN** the deserialized model uses defaults for missing sections
