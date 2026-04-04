## ADDED Requirements

### Requirement: Research-Only Boundary
The system SHALL keep `pi-research` scoped to research and audit generation rather than direct code mutation.

#### Scenario: Code-Write Request
- **GIVEN** a user attempts to use `pi-research` as an implementation agent
- **WHEN** the request reaches the agent surface
- **THEN** the tool SHALL direct the workflow toward research output, implementation briefs, or audit notes
- **AND** it SHALL not present itself as the authority to modify product code directly

### Requirement: Explicit Implementation Redirect
The system SHALL provide a visible redirect when users try to route direct product-code mutation through the research agent.

#### Scenario: Direct Product-Code Request
- **GIVEN** a user asks `pi-research` to write, rewrite, or patch application code directly
- **WHEN** the runner or documented workflow handles that request
- **THEN** the system SHALL refuse to present `pi-research` as the code-writing authority
- **AND** it SHALL redirect the user toward an implementation brief, critique, or research artifact that can be reviewed by a separate implementation path

### Requirement: Planner And Validation Review
The system SHALL require planner normalization and downstream validation before research output changes the product.

#### Scenario: Research Output Handoff
- **GIVEN** `pi-research` produces a critique or brief
- **WHEN** that output is used to influence implementation
- **THEN** the workflow SHALL route through planning, review, or validation steps
- **AND** the research output SHALL not become repository truth without an explicit follow-on change

### Requirement: Safe Persistence Defaults
The system SHALL avoid persisting unsafe or noisy transient research artifacts by default.

#### Scenario: Default Output Handling
- **GIVEN** the user runs a research query
- **WHEN** the agent produces its result
- **THEN** the default behavior SHALL avoid scattering transient output or secrets across the repository
- **AND** any persisted artifact path SHALL be intentional and documented
