## ADDED Requirements

### Requirement: Focus Mode Hides Inspector Chrome

The system SHALL provide a focus (zen) mode toggle that hides the studio inspector
panels to present a clean stage view, and restores them when toggled off. Focus mode
SHALL be independent of the existing "Lock editing" state and SHALL NOT alter the
underlying configuration.

#### Scenario: Entering focus mode

- **GIVEN** the studio is showing its inspector panels
- **WHEN** the user enables focus mode
- **THEN** the inspector chrome SHALL be hidden, leaving the stage and product visible
- **AND** the current configuration SHALL be unchanged

#### Scenario: Exiting focus mode

- **GIVEN** focus mode is active
- **WHEN** the user disables it
- **THEN** the inspector panels SHALL return to their prior layout and state

#### Scenario: Independent from Lock editing

- **GIVEN** "Lock editing" is off
- **WHEN** the user toggles focus mode on and off
- **THEN** the "Lock editing" state SHALL remain unchanged
