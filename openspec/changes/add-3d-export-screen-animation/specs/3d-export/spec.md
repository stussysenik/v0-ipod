## ADDED Requirements

### Requirement: Title marquee scrolls in the clip export
A `/3d` clip (MP4) export SHALL animate the Now Playing title marquee: when the title
overflows its container, the title strip MUST scroll horizontally over the clip rather than
remain frozen. The marquee offset at clip-time `t` MUST be the deterministic value from the
shared marquee source (`getMarqueeFrame` in `lib/marquee.ts`) so the scroll is reproducible.

#### Scenario: Overflowing title scrolls across the clip
- **WHEN** the user exports a clip whose Now Playing title overflows the screen width
- **THEN** the exported title marquee scrolls horizontally across the clip frames
- **AND** sampling frames at increasing `t` shows the title `translateX` changing, not fixed

#### Scenario: Non-overflowing title is held still
- **WHEN** the title fits within the screen width
- **THEN** the exported title does not scroll (matching the live marquee's overflow behaviour)

### Requirement: Progress bar and time advance in the clip export
A `/3d` clip export SHALL advance the song progress over the clip: the progress-bar fill
width and the elapsed/remaining time text MUST move forward with clip-time, instead of
showing a single frozen value. Progress at `t` MUST equal `currentTime(t) / duration`, where
`currentTime(t)` advances from the base playhead at the same 1-second-per-real-second cadence
as the live transport.

#### Scenario: Progress fill grows over the clip
- **WHEN** the user exports a clip while the transport is playing
- **THEN** the exported progress-bar fill width increases monotonically with `t` (until loop/clamp)
- **AND** the elapsed time text increments and the remaining time text decrements over the clip

#### Scenario: Progress derives from currentTime over duration
- **WHEN** a clip frame is produced at clip-time `t`
- **THEN** the progress fill equals `currentTime(t) / duration` for that frame's `currentTime`

### Requirement: Live preview marquee animates during play
The Now Playing title marquee SHALL scroll in the live `/3d` preview during playback (not
only during export capture): while the transport is playing and the title overflows, the
preview marquee MUST animate. This establishes the preview as the truth the export reproduces.

#### Scenario: Marquee scrolls in preview play
- **WHEN** the transport is playing in the live preview and the title overflows
- **THEN** the preview title marquee scrolls horizontally without requiring an export to start

#### Scenario: Preview marquee shares the export's source
- **WHEN** the preview marquee and the export compositor are at the same playhead `t`
- **THEN** both compute the title offset from the same deterministic marquee source and agree

### Requirement: Exported screen animation is WYSIWYG with the preview
The animated Now Playing screen in a clip export SHALL match the live preview screen at the
same playhead `t`: the marquee offset, the progress-bar fill, and the elapsed/remaining time
MUST equal what the preview shows when scrubbed/played to `t`. The export screen animation
MUST follow the same clip-`t` mapping the camera move already uses, so preview === export.

#### Scenario: Screen state matches preview at the same t
- **WHEN** the user scrubs the preview to `t`, then exports the same move at the same length
- **THEN** the exported frame at `t` shows the identical marquee position, progress width, and time as the preview at `t`

#### Scenario: Screen and camera share one clock
- **WHEN** a clip frame is rendered at clip-time `t`
- **THEN** the camera pose and the screen animation are both derived from the same `t`, with no independent or drifting screen clock

### Requirement: Bounded export cost — screen rasterizations decoupled from frame count
Animating the export screen SHALL NOT perform a full `html-to-image` DOM rasterization on
every frame (measured ≈85–115ms each). The number of full screen rasterizations per export
MUST be decoupled from the frame count and bounded, via either (a) a throttled screen-refresh
budget that re-bakes on a capped cadence while the camera renders at full fps, or (b) a
bake-the-chrome-once compositor that updates animated layers with cheap 2D `CanvasTexture`
compositing. Any cap on the screen-refresh rate MUST be applied predictably (e.g. logged),
never silently truncated.

#### Scenario: Rasterizations do not scale with frame count
- **WHEN** the user exports a 60s @ 30fps (≈1800-frame) clip
- **THEN** the number of full DOM rasterizations is bounded (a capped re-bake count or a single chrome bake), NOT ≈1800
- **AND** export time does not incur a ~115ms full DOM rasterization per frame

#### Scenario: Screen-refresh cap is explicit
- **WHEN** the export throttles the screen-refresh rate below the camera frame rate to stay within budget
- **THEN** the applied screen-refresh rate (or bake cap) is surfaced/logged rather than silently reducing fidelity
