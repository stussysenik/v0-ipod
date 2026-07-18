# browser-navigation Specification

## Purpose
Governs the iPod menu-tree browser: hierarchical menu navigation and per-slug preview rendering.
## Requirements
### Requirement: Menu-Tree Navigation

The system SHALL navigate the feed's menu tree using the iPod primitives: move focus within a list, drill into a child list, return to the parent, and select a leaf. Navigation SHALL be drivable by wheel, keyboard, and touch, and SHALL operate solely on the feed model.

#### Scenario: Drill into a work and return

- **WHEN** the user focuses a work in a list and selects it, then issues back
- **THEN** the work opens, and back returns focus to the originating list at the same item

### Requirement: Slug Preview Render

Each work SHALL render as a self-contained preview (cover, title, one-line summary) suitable for standalone display, and selecting it SHALL expand it (IA model C) into a full-size surface that respects the stage keep-out layout, with a return affordance.

#### Scenario: Work expands into real space

- **WHEN** a work is selected
- **THEN** its preview expands out of the device into a full-size surface that does not overlap the device keep-out zone, and a return affordance restores the device view

#### Scenario: Preview renders standalone

- **WHEN** a single work model is rendered as a preview
- **THEN** it shows cover, title, and summary without requiring the surrounding app shell

