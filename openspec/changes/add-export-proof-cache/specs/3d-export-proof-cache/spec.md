# 3d-export-proof-cache

## ADDED Requirements

### Requirement: A deterministic export fingerprint SHALL key every pixel-determining input

The system SHALL compute an `exportFingerprint` as a pure, stable hash over a normalized
snapshot of exactly the inputs that determine the export's anchor-frame pixels: the
quantized hero pose (azimuth, elevation, reach, target), move, loop style, speed, aspect,
quality, screen/metadata state (title, artist, album, currentTime, duration, marquee,
batteryLevel, osScreen), per-surface colors, hardware preset, and the lighting signature.
The function SHALL NOT read `Date`/random/wall-clock, so it is reproducible across reloads
and unit-testable in the node project. A `FINGERPRINT_VERSION` constant SHALL be folded into
the hash so changing the input set invalidates all prior entries.

#### Scenario: Identical setups produce identical fingerprints

- **WHEN** two studio setups have the same pixel-determining inputs in any field order
- **THEN** `exportFingerprint` returns the same value for both

#### Scenario: A pixel-affecting change changes the fingerprint

- **WHEN** any pixel-determining input changes (e.g. azimuth, title text, or skin color)
- **THEN** `exportFingerprint` returns a different value

#### Scenario: Sub-visible pose jitter does not change the fingerprint

- **WHEN** the hero pose moves by less than the quantization precision
- **THEN** the fingerprint is unchanged, so micro-nudges do not thrash the cache

### Requirement: The fingerprint snapshot SHALL be sufficient to restore the exact setup

The fingerprint SHALL be derived from a single `fingerprintInputs(model, options)` selector,
and the full snapshot it produces SHALL be retained alongside the hash so the originating
setup can be reconstructed later. The selector SHALL be the only source of the snapshot.

#### Scenario: Snapshot round-trips to the same fingerprint

- **WHEN** a retained snapshot is re-hashed
- **THEN** it yields the fingerprint it was stored under

### Requirement: A proof cache SHALL map fingerprints to offline-rendered proof frames

The system SHALL maintain a `fingerprint → proof frame` cache. A proof frame SHALL be the
anchor frame (phase 0, the composed angle) rendered through the real export pipeline (the
Hero `captureHighRes` path), so a cached frame is byte-equivalent to what the export
produces at that fingerprint. The cache SHALL be an in-memory LRU backed by an IndexedDB
blob store; when IndexedDB is unavailable the cache SHALL degrade to in-memory only without
error.

#### Scenario: A hit returns the exact export visual

- **WHEN** the current fingerprint is present in the cache
- **THEN** the stored proof frame is returned and it equals the export's anchor frame for
  that fingerprint

#### Scenario: Persistence survives reload

- **WHEN** a proof was cached, the page reloads, and the same fingerprint recurs
- **THEN** the IndexedDB-persisted frame is served without re-rendering

#### Scenario: Bounded eviction

- **WHEN** the number of entries exceeds the configured bound
- **THEN** the least-recently-used entries are evicted from memory and IndexedDB

### Requirement: The system SHALL pre-compute proof frames speculatively on idle

The system SHALL render the current fingerprint's proof frame speculatively. When the studio
is idle for a short debounce (~300 ms) after the last change and the current fingerprint is
uncached, the system SHALL enqueue that render in a background, single-flight queue so the
proof is present before it is requested. The queue SHALL run at most one render at a time and
SHALL NOT block user interaction.

#### Scenario: Proof is ready without an explicit request

- **WHEN** the user composes an angle and then pauses
- **THEN** the proof frame for that setup is rendered in the background and cached, with no
  export action triggered

#### Scenario: Background work yields to a real export

- **WHEN** a real export bake is in progress
- **THEN** speculative proof rendering is suspended until the export completes, so the two
  paths never contend for the camera or frameloop

### Requirement: Neighbor warming SHALL be best-effort and droppable

The system SHALL treat likely-neighbor warming as optional, best-effort work: it MAY, at
lower priority within the same single-flight queue, pre-render the proof for likely-next
setups (the other aspect ratios and `hold` style at the current pose), and it SHALL drop
such warming under load so it never delays the current fingerprint's proof or user
interaction.

#### Scenario: Switching aspect is instant when warmed

- **WHEN** a neighbor aspect was warmed and the user switches to it
- **THEN** its proof is served from cache without a wait
