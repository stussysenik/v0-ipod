## ADDED Requirements

### Requirement: Physical Assembly Taxonomy
The system SHALL organize core iPod frontend code using a physical-assembly naming model rather than ambiguous feature names.

#### Scenario: Locating A Physical Part
- **GIVEN** a contributor is looking for the code that renders a physical part of the iPod
- **WHEN** they navigate the component tree
- **THEN** the code SHALL use names such as `workbench`, `device`, `shell`, `display`, `scene`, `panel`, or `editor` according to the part's responsibility
- **AND** the naming SHALL avoid mixing hardware identity, screen content, and app orchestration in one term unless explicitly documented

### Requirement: Explicit Category Boundaries
The system SHALL separate workbench orchestration, physical assemblies, scenes, panels, editors, and hooks into intentional categories.

#### Scenario: Shared Part Placement
- **GIVEN** a reusable display or device subassembly is introduced
- **WHEN** the code is added to the repository
- **THEN** it SHALL live under a category that reflects its assembly role
- **AND** scene composition and editor behavior SHALL remain separate from reusable physical-part rendering
