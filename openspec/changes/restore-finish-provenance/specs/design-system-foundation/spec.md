## ADDED Requirements

### Requirement: Typed Token Taxonomy
The system SHALL provide typed tokens for spacing, finish, surface, and export-medium values before large-scale visual restyling proceeds.

#### Scenario: Token Consumption
- **GIVEN** a component needs spacing or finish values
- **WHEN** it resolves those values at runtime
- **THEN** it SHALL read from the shared token system
- **AND** it SHALL not introduce one-off layout or surface constants without a documented reason

### Requirement: Explicit Component Categories
The system SHALL organize primitives and feature components into clear categories so device fidelity work can evolve without UI drift.

#### Scenario: Shared Primitive Placement
- **GIVEN** a shared control or surface primitive is introduced
- **WHEN** a developer locates that code in the repository
- **THEN** the component SHALL live under an explicit category for UI primitives or iPod primitives
- **AND** feature-specific mode composition SHALL remain separate from reusable building blocks
