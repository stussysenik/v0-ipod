## ADDED Requirements

### Requirement: Dedicated Marquee Preview Mode
The system SHALL provide a dedicated preview mode for the now-playing screen that focuses on authentic title marquee playback without changing flat-mode editing behavior.

#### Scenario: Preview mode is separate from flat editing
- **WHEN** the user enters Preview Mode
- **THEN** the flat screen layout SHALL remain visually consistent
- **AND** title editing SHALL stay in Flat View rather than inline in Preview Mode

### Requirement: Authentic Overflow Marquee Behavior
The system SHALL animate the now-playing title only when it overflows the available title viewport, using an iPod-style one-way marquee.

#### Scenario: Overflow title crawls with a hard pause and blank gap
- **WHEN** the title width exceeds the available title viewport in Preview Mode
- **THEN** the title SHALL pause before moving
- **AND** scroll leftward with linear stepped motion
- **AND** leave a blank gap before restarting from the right

#### Scenario: Short title stays still
- **WHEN** the title fits within the available title viewport
- **THEN** the title SHALL remain static

### Requirement: Preview Mode Persistence
The system SHALL persist the selected preview mode in the same UI state storage used for other view modes.

#### Scenario: Preview mode restores after reload
- **WHEN** the user leaves the app while Preview Mode is active
- **THEN** the app SHALL restore Preview Mode on reload
