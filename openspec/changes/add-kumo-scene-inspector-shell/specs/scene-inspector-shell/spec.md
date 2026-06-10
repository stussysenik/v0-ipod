## ADDED Requirements

### Requirement: Archived Legacy Inspector
The system SHALL preserve the current toolbox/settings implementation in a frozen archive path inside the repository before the new inspector shell replaces it in the live UI.

#### Scenario: Legacy toolbox remains recoverable
- **WHEN** the live inspector shell is rebuilt
- **THEN** the prior toolbox implementation SHALL still exist in the repository under a clearly marked archive path

#### Scenario: Live UI no longer depends on legacy modules
- **WHEN** the new inspector shell is active
- **THEN** the default application path SHALL render the new shell without importing the archived legacy implementation

### Requirement: Tree-First Scene Inspection
The system SHALL provide a tree-first inspector shell that exposes the parent/child scene hierarchy, selected-node path, and semantic node controls.

#### Scenario: Selecting a node reveals its structure
- **WHEN** a user selects a scene node
- **THEN** the inspector SHALL highlight that node in the tree and resolve its breadcrumb path within the scene hierarchy

#### Scenario: Parent and child relationships remain navigable
- **WHEN** a selected node has parents or children
- **THEN** the inspector SHALL allow the user to expand, collapse, and navigate those relationships without losing the active selection

### Requirement: One Semantic Inspector Across Desktop And Mobile
The system SHALL project the same semantic inspector model on desktop and mobile while adapting shell layout and motion by profile.

#### Scenario: Mobile shell reuses desktop semantics
- **WHEN** the inspector is opened from the mobile toolbox trigger
- **THEN** it SHALL present the same scene tree, breadcrumbs, and semantic panel grouping used on desktop

#### Scenario: Profile-driven shell transitions
- **WHEN** the inspector changes between closed, expanded, or docked states
- **THEN** the transition SHALL be driven by the active projection profile rather than a separate mobile-only control taxonomy

### Requirement: Semantic Control Grouping
The system SHALL group controls by scene scope and selected-node semantics instead of one large mixed settings sheet.

#### Scenario: Scene-level controls stay distinct
- **WHEN** the user is editing global scene settings
- **THEN** those controls SHALL appear in a dedicated scene-level panel separate from node-level controls

#### Scenario: Node-level controls follow node meaning
- **WHEN** a node such as `title`, `artwork`, or `progress` is selected
- **THEN** the inspector SHALL show a control panel specific to that node's semantics

