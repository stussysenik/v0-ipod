## ADDED Requirements

### Requirement: Dynamic Wheel-to-Case Color Coupling
The system SHALL derive click wheel surface color, label color, and icon color from the current case color using OKLCH lightness analysis. Dark cases (L < 0.5) MUST produce dark wheels with light labels. Light cases (L >= 0.5) MUST produce light wheels with dark labels.

#### Scenario: Black case selected
- **WHEN** the user selects a case color with OKLCH lightness below 0.5 (e.g., #1C1C1E)
- **THEN** the click wheel surface renders in a dark gradient matching the case tone
- **AND** the MENU label, skip icons, and play/pause glyph render in white (#FFFFFF or near-white)
- **AND** the center button renders with a subtle lighter-than-wheel fill

#### Scenario: White case selected
- **WHEN** the user selects a case color with OKLCH lightness at or above 0.5 (e.g., #F5F5F5)
- **THEN** the click wheel surface renders in a light gradient matching the case tone
- **AND** the MENU label, skip icons, and play/pause glyph render in grey (#808791)
- **AND** the center button renders with a subtle lighter-than-wheel fill

### Requirement: Authentic Click Wheel Icon Glyphs
The system SHALL render click wheel icons as inline SVG glyphs matching real iPod Classic hardware. Skip-back and skip-forward MUST use double-triangle-with-bar shapes. Play/pause MUST be a single combined triangle-and-double-bar glyph.

#### Scenario: Click wheel icon rendering
- **WHEN** the iPod interface renders in any view mode
- **THEN** the bottom icon shows a combined ▶‖ play/pause glyph (not two separate icons)
- **AND** the left icon shows ⏪ (two left-pointing triangles with a bar)
- **AND** the right icon shows ⏩ (two right-pointing triangles with a bar)

### Requirement: Authentic Apple Finish Library
The system SHALL provide a curated library of documented iPod Classic case colors with provenance metadata including generation name, year, and hex value. The finish picker MUST group colors by iPod generation.

#### Scenario: User browses authentic finishes
- **WHEN** the user opens the case color picker
- **THEN** authentic Apple finishes are displayed grouped by generation (e.g., "Classic 6th Gen (2007)")
- **AND** each swatch shows its provenance label on hover/tap

#### Scenario: Selecting an authentic finish
- **WHEN** the user selects an authentic finish color
- **THEN** the case color updates to the selected hex
- **AND** the wheel color adapts via the dynamic coupling system
- **AND** the screen surround darkness adjusts to complement the case

### Requirement: Screen Bezel Fidelity
The system SHALL render the screen bezel, surround gradient, status bar, and progress area to match real iPod Classic reference photographs at the pixel level. The progress area MUST NOT have a visible divider line above it.

#### Scenario: Screen rendering matches reference
- **WHEN** the Now Playing screen renders
- **THEN** the screen surround gradient is darkest at the bottom and has a subtle highlight at the top
- **AND** the status bar has a subtle grey gradient (not high-contrast)
- **AND** the progress bar section blends seamlessly into the content area without a visible border
- **AND** the album artwork has a subtle shadow matching the reference depth
