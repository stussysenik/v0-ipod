## ADDED Requirements
### Requirement: Collapsible Mobile Toolbox
The system SHALL present a compact toolbox toggle on mobile viewports that can hide or reveal the floating controls without removing access to editing, view switching, and export actions.

#### Scenario: Mobile toolbox collapsed by default
- **WHEN** the app loads on a mobile viewport
- **THEN** only the toolbox toggle is visible
- **AND** the full tools stack remains hidden until expanded

#### Scenario: Mobile toolbox closes after outside interaction
- **WHEN** the mobile toolbox is open
- **AND** the user taps outside the toolbox area
- **THEN** the toolbox closes
- **AND** any open settings popover is also closed

### Requirement: Interaction Chrome Reset Includes Toolbox
The system SHALL reset transient UI chrome, including toolbox and settings state, during major interaction transitions that prioritize a clear canvas.

#### Scenario: Export start clears toolbox chrome
- **WHEN** the user starts an export in flat view
- **THEN** toolbox and settings panels are closed before capture begins
