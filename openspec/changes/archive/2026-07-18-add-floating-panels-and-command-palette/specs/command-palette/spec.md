## ADDED Requirements

### Requirement: Global Command Palette Invocation

The application SHALL provide a single global command palette opened with ⌘K (macOS) / Ctrl+K (other platforms) and closed with Escape. The palette SHALL be available from every view mode.

#### Scenario: User opens the palette
- **WHEN** a user presses ⌘K or Ctrl+K anywhere in the app
- **THEN** the command palette SHALL open and receive keyboard focus

#### Scenario: User closes the palette
- **WHEN** the palette is open and the user presses Escape
- **THEN** the palette SHALL close and SHALL return focus to the prior surface

#### Scenario: Palette opens regardless of current mode
- **WHEN** the user invokes the palette while in any view mode
- **THEN** the palette SHALL open with commands relevant to the current state

### Requirement: Fuzzy Search and Keyboard Navigation

The palette SHALL filter commands by fuzzy text match and SHALL be fully operable by keyboard, including arrow navigation and Enter to run the highlighted command.

#### Scenario: User filters commands by typing
- **WHEN** a user types a query into the palette
- **THEN** the command list SHALL narrow to fuzzy matches of the query
- **AND** the first match SHALL be highlighted

#### Scenario: User runs a command with the keyboard
- **WHEN** a command is highlighted and the user presses Enter
- **THEN** that command SHALL execute and the palette SHALL close

### Requirement: Mode Switching Commands

The palette SHALL expose a command to switch to each available view mode, respecting feature gating so that disabled modes are not offered.

#### Scenario: User switches mode from the palette
- **WHEN** a user runs a "switch to <mode>" command
- **THEN** the application SHALL change to that view mode
- **AND** that mode's persisted panel arrangement SHALL be restored

#### Scenario: Gated modes are hidden
- **WHEN** a view mode is disabled by feature flags
- **THEN** the palette SHALL NOT offer a command to switch to it

### Requirement: Panel Management Commands

The palette SHALL expose commands to summon (show and focus), toggle, and collapse each registered panel, and to reset the panel layout for the current mode.

#### Scenario: User summons a panel
- **WHEN** a user runs a "summon <panel>" command
- **THEN** the panel SHALL become visible, expanded, and focused to the front

#### Scenario: User toggles a panel
- **WHEN** a user runs a "toggle <panel>" command
- **THEN** the panel's visibility SHALL invert from its current state

#### Scenario: User resets layout from the palette
- **WHEN** a user runs the "reset layout" command
- **THEN** every panel in the current mode SHALL return to its default frame, visibility, and expanded state

### Requirement: Live Command Source

The set of commands offered SHALL reflect current application state, so that available modes and registered panels are always represented accurately.

#### Scenario: Newly registered panel appears in the palette
- **WHEN** a panel is part of the active panel registry
- **THEN** its summon / toggle / collapse commands SHALL be available in the palette without a reload
