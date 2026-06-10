# 3d-export-reliability

## ADDED Requirements

### Requirement: Exported clips SHALL never contain a blank Now Playing screen

Every frame of an exported clip SHALL show legible screen content. When a
screen rasterization comes back blank (near-zero luminance variance in the
content region), the system SHALL retry warm (no cache bust) up to a small
budget, and on persistent blank SHALL hold the last good texture rather than
swap in the blank bake.

#### Scenario: Long export under GPU pressure

- **WHEN** a 60-second clip is exported at standard quality
- **THEN** no rendered frame's screen content region is near-uniform (blank),
  and a blank first rasterization is repaired by an immediate warm retry

#### Scenario: Rasterizer fails persistently

- **WHEN** every retry of a mid-clip re-bake rasterizes blank
- **THEN** the LCD keeps the last good texture (a held frame), and the export
  completes without a dead-screen frame

### Requirement: The song clock SHALL cycle for the full specified clip duration

The on-screen elapsed time, progress bar and marquee SHALL advance continuously
across the entire clip, driven by the deterministic clip clock (`i / total`
sampled at bake time), cycling modulo the song duration — never freezing
partway regardless of clip length.

#### Scenario: 60s clip with a 6s song

- **WHEN** a 60s clip is exported while a 6s song is loaded
- **THEN** the song position wraps multiple times and the screen still shows
  motion in the final third of the clip (continuity e2e guard)

### Requirement: Export lifecycle SHALL be governed by a central XState machine

Export state SHALL be modeled as a single machine
(idle → preparing → rendering → encoding → saving → idle | error) that derives
the veil/progress UI, forbids concurrent exports, and always returns to idle
(restoring playhead, marquee clock and overlays) on success, failure or
cancellation.

#### Scenario: Export fails mid-encode

- **WHEN** the video encoder errors midway through a clip
- **THEN** the machine transitions to error, the user sees a failure notice,
  and the live scene (frameloop, overlays, playhead, marquee) is fully restored

#### Scenario: Re-entrancy is blocked

- **WHEN** an export is in progress and the user clicks Export again
- **THEN** the second request is rejected by a machine guard with no side effects

### Requirement: Test artifacts SHALL NOT be written into the dev-watched tree

Playwright traces/screenshots SHALL stream to a directory outside the
repository so the Next dev watcher never enters a rebuild loop during e2e runs.

#### Scenario: Continuity e2e on the dev server

- **WHEN** the export continuity e2e runs against `next dev`
- **THEN** no Fast Refresh rebuild loop occurs and the /3d page never 500s
  during the export
