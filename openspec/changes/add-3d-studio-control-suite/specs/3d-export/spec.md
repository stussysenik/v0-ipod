## ADDED Requirements

### Requirement: Single-position highest-fidelity front .mp4 export
The export surface SHALL provide a reliable static front product export: a single,
motionless camera pose rendered at highest fidelity and encoded to an `.mp4` file —
the 3D equivalent of the classic 2D front product export.

#### Scenario: Export a static front clip
- **WHEN** the user runs the static front export
- **THEN** an `.mp4` is produced showing the device at one fixed front pose with no camera motion
- **AND** the frames are visually identical to the high-fidelity still (same render path)

#### Scenario: Fidelity matches the still pipeline
- **WHEN** the static front export renders
- **THEN** it uses the offscreen render-target path (not the live canvas) so there is no aspect/race artifact and fidelity equals the PNG still

### Requirement: Exports are WYSIWYG with the live view

Every export (still PNG, static front `.mp4`, and motion clips) SHALL be color-faithful to
the live `/3d` canvas — same exposure, color space, and post-processing tail — so what the
user composes on screen is what the file contains. The offscreen render path SHALL NOT
introduce darkening, gamma, or tone shifts.

#### Scenario: Export matches the on-screen exposure
- **WHEN** the user exports any still or clip
- **THEN** the saved frames have the same brightness/contrast/color as the live preview
- **AND** there is no overall darkening relative to the screen (no missing sRGB encode / tone-map divergence)

#### Scenario: Live composer tail is reproduced offscreen
- **WHEN** the offscreen target is read back
- **THEN** the same vignette and linear→sRGB encode the live `EffectComposer` applies are applied to the export pixels before encoding

### Requirement: Distortion-free front product framing

The static front export SHALL use a deliberate product-photography framing — a long focal
length (telephoto) at a near-dead-on angle — so the click wheel reads as a true circle and
the screen as a clean rectangle, free of the perspective keystone/foreshortening a wide lens
introduces at a 3/4 angle.

#### Scenario: Wheel and screen are undistorted
- **WHEN** the static front export renders
- **THEN** the click wheel is circular (not a perspective ellipse) and the screen edges are parallel (no keystone)

### Requirement: Static export coexists with stills and motion clips
The static front `.mp4` SHALL be offered alongside the existing still PNG and looping
motion clips without replacing them.

#### Scenario: All export options available
- **WHEN** the user opens the export controls
- **THEN** the still PNG, the static front `.mp4`, and the motion clip presets are all available

### Requirement: Export is the headline — product-cinematography quality that "pops"

Export is the PRIMARY focus of `/3d`. Exported frames SHALL meet or exceed the quality
bar of the 2D product exports ("like 2D, but better"), applying deliberate
game-development / product-photography camera and lighting craft so the result reads as a
hero product shot, not a screen grab — intentional composition, depth separation of the
device from the stage, controlled highlight roll-off, and a clear focal-attention hierarchy.

The visual attention hierarchy of every export SHALL be, in order: (1) the **album
cover / artwork**, (2) the **music / now-playing content** (title, artist, progress),
(3) the **physical assembly** of the device (anodized body, click wheel, chrome rim).
Lighting, framing, depth cues, and any vignette/contrast SHALL serve that hierarchy.

#### Scenario: Export quality meets-or-beats 2D
- **WHEN** a 3D export is compared side-by-side with the equivalent 2D product export
- **THEN** the 3D export is at least as clean and polished, and adds dimensional/material richness the 2D cannot

#### Scenario: Attention lands on the artwork and the music
- **WHEN** a viewer looks at an export
- **THEN** the eye is drawn first to the album artwork and now-playing content, then to the device assembly — not to the stage, chrome, or UI

#### Scenario: Camera + lighting craft studied from game dev / product photography
- **WHEN** the export framing and lighting are authored
- **THEN** they apply researched real-time-rendering and product-cinematography technique (composition, focal length, key/fill/rim balance, depth) rather than the default canvas view

### Requirement: Clean export — no HUD or control chrome in the frame

Every export (still, static `.mp4`, motion clip) SHALL contain ONLY the device and its
stage. The control surface — cockpits, command palette, and the bottom bar (orientation
snaps + studio shots) — SHALL be excluded from the captured frame, and the user SHALL be
able to hide all HUD chrome for a clean live preview as well.

#### Scenario: Bottom bar and HUD never appear in an export
- **WHEN** the user runs any export
- **THEN** the saved frame shows the device on its stage with no bottom bar, cockpits, or HUD overlays baked in

#### Scenario: HUD can be hidden on the live stage
- **WHEN** the user toggles the HUD off
- **THEN** the bottom bar and cockpits hide, leaving only the device + stage (a clean compose/preview mode)
</content>
