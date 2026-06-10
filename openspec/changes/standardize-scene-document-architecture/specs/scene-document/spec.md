## ADDED Requirements

### Requirement: Canonical Scene Document
The system SHALL represent the editable iPod interface as a canonical immutable scene document with normalized nodes, stable identifiers, and explicit parent/child relationships.

#### Scenario: Rendering from a normalized scene document
- **WHEN** the application prepares the current interface for rendering
- **THEN** it SHALL be able to derive the full render tree from a scene document without relying on implicit component-only structure

#### Scenario: Stable node identity across contexts
- **WHEN** a user switches between desktop authoring, mobile authoring, export, or viewer contexts
- **THEN** the same semantic node ids SHALL continue to identify the same interface elements

### Requirement: Node-Scoped Selection And Navigation
The system SHALL support selecting, identifying, and navigating interface elements by scene node id and tree path.

#### Scenario: Breadcrumb path for selected element
- **WHEN** a user selects a node such as `title` or `progress`
- **THEN** the system SHALL be able to resolve its full path within the scene hierarchy

#### Scenario: Inspector grouping by selected node
- **WHEN** a node is selected
- **THEN** node-specific controls SHALL be grouped by that node's semantics instead of only by generic feature sheets

### Requirement: Shared Intent Patching
The system SHALL route authoring interactions through immutable scene-document patches.

#### Scenario: Multiple input surfaces update the same model
- **WHEN** a user edits content through inline editing, fixed mobile editing, drag layout adjustments, or inspector controls
- **THEN** each interaction SHALL update the same scene document rather than separate parallel state branches

#### Scenario: Preference changes remain document-driven
- **WHEN** a user changes interaction mode, selection kind, or export intent
- **THEN** the change SHALL be representable as scene-document preferences or document-targeted patches
