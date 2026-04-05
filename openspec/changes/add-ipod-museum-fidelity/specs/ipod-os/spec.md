## ADDED Requirements

### Requirement: Hierarchical Menu Navigation
The system SHALL provide a stack-based menu navigation system that supports arbitrary-depth sub-menus matching the real iPod Classic OS. Each menu level MUST display a list of items with a blue gradient highlight on the selected item.

#### Scenario: Entering a sub-menu
- **WHEN** the user presses the center button on a menu item that has children (e.g., "Music")
- **THEN** the screen slides left to reveal the sub-menu
- **AND** the status bar title updates to the sub-menu name (e.g., "Music")
- **AND** the first item in the sub-menu is highlighted

#### Scenario: Navigating back
- **WHEN** the user presses the Menu button while in a sub-menu
- **THEN** the screen slides right to return to the parent menu
- **AND** the previously selected item is re-highlighted
- **AND** the status bar title reverts to the parent menu name

#### Scenario: Reaching Now Playing
- **WHEN** the user selects "Now Playing" from any menu depth OR selects a terminal music item
- **THEN** the screen transitions to the Now Playing view
- **AND** pressing Menu returns to the last menu position

### Requirement: Menu Tree Definition
The system SHALL define the complete iPod Classic menu hierarchy including at minimum: Music (with sub-menus for Playlists, Artists, Albums, Songs, Genres), Videos, Photos, Podcasts, Extras, Settings, Shuffle Songs, and Now Playing.

#### Scenario: Root menu items
- **WHEN** the iPod OS menu screen renders at root level
- **THEN** it displays: Music, Videos, Photos, Podcasts, Extras, Settings, Shuffle Songs, Now Playing
- **AND** items with sub-menus show a right-arrow chevron (>)

### Requirement: Slide Transitions
The system SHALL animate menu transitions with horizontal slide animations. Entering a sub-menu slides the new content in from the right. Exiting (via Menu button) slides content back from the left. Transitions MUST complete within 300ms and maintain 60fps.

#### Scenario: Transition performance
- **WHEN** the user navigates between menu levels
- **THEN** the slide animation completes in under 300 milliseconds
- **AND** no frame drops occur during the transition
