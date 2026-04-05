## ADDED Requirements

### Requirement: GIF Motion Guarantee
The system SHALL ensure all exported GIF files contain visible animation. Static-frame GIFs (where all frames are pixel-identical) MUST NOT be produced. The system SHALL detect and prevent this condition.

#### Scenario: GIF with marquee animation
- **WHEN** the user exports a GIF and the song title overflows (triggering marquee)
- **THEN** the exported GIF contains frames showing the title scrolling from right to left
- **AND** the GIF loops seamlessly

#### Scenario: GIF with short title (no marquee)
- **WHEN** the user exports a GIF and the song title fits without scrolling
- **THEN** the system forces visible motion by advancing the progress bar fill across frames
- **AND** the exported GIF contains frames with different progress bar positions

#### Scenario: Frame-difference validation
- **WHEN** the GIF encoder has captured all frames
- **THEN** the system compares pixel data between the first and last frames
- **AND** if the frames are identical, the system extends capture duration and retries (up to 3 attempts)

### Requirement: GIF Quality Optimization
The system SHALL use a global color palette, 2x capture scale, and dithering to produce high-quality GIF output suitable for Instagram stories and social sharing.

#### Scenario: Global palette encoding
- **WHEN** the GIF encoder begins processing captured frames
- **THEN** it samples pixels from the first, middle, and last frames to build a shared 256-color palette
- **AND** applies this global palette to all frames (not per-frame quantization)

#### Scenario: Export resolution
- **WHEN** the user triggers GIF export
- **THEN** frames are captured at 2x the display resolution (not 1x)
- **AND** Floyd-Steinberg dithering is applied to reduce color banding in gradient areas
