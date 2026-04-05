## ADDED Requirements

### Requirement: 1st Generation iPod Preset
The system SHALL provide an iPod 1st Generation (2001) hardware preset with accurate physical proportions, mechanical scroll wheel (ring), separate physical buttons (Menu, Play/Pause, Previous, Next above the wheel), and a monochrome green-backlit screen displaying the original menu items (Playlists, Artists, Songs, Contacts, Settings).

#### Scenario: Selecting 1st Gen preset
- **WHEN** the user selects the "iPod 1G (2001)" hardware preset
- **THEN** the device renders with 1st Gen proportions (thicker body, larger radius corners)
- **AND** the wheel renders as a mechanical scroll ring (no button labels on wheel surface)
- **AND** four physical buttons render between the screen and wheel (Menu, Play/Pause, Prev, Next)
- **AND** the screen displays monochrome content with a green-tinted backlight

### Requirement: Generation Switcher
The system SHALL provide a UI for switching between iPod generations. Each generation loads its correct proportions, default finish, menu items, and screen style.

#### Scenario: Browsing generations
- **WHEN** the user opens the generation switcher
- **THEN** available iPod generations are displayed in chronological order
- **AND** each entry shows the generation name, year, and a silhouette or icon
- **AND** selecting a generation updates the entire device render to match that model

### Requirement: Photorealistic 3D Materials
The system SHALL provide physically-based materials in the Three.js 3D view that approximate real iPod hardware: subsurface scattering on polycarbonate shells, directional anisotropic scratches on brushed steel backs, and environment reflection mapping on screen glass.

#### Scenario: 3D material quality
- **WHEN** the user switches to 3D view mode
- **THEN** the front shell shows subtle light diffusion through the plastic (subsurface scattering)
- **AND** the steel back shows directional scratch patterns aligned to the brushing axis
- **AND** the screen glass reflects the studio environment subtly
