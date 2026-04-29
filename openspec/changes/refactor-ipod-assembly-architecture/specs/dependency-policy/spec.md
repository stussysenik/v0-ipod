## ADDED Requirements

### Requirement: Local-First State Discipline
The system SHALL prefer React local state plus pure domain helpers until the product has clear remote-state or multi-surface store requirements.

#### Scenario: Evaluating A New State Library
- **GIVEN** a contributor proposes Zustand, Nanostores, or another client-state abstraction
- **WHEN** the product still operates primarily on local state, local persistence, and local export workflows
- **THEN** the default decision SHALL be to keep state local and explicit
- **AND** the new library SHALL require a concrete justification beyond prop reduction or stylistic preference

### Requirement: Remote-State Threshold For TanStack Query
The system SHALL defer TanStack Query until meaningful remote server state exists.

#### Scenario: Evaluating TanStack Query
- **GIVEN** a contributor proposes TanStack Query
- **WHEN** the product does not yet depend on authenticated APIs, remote snapshot catalogs, background jobs, or other durable server state
- **THEN** the default decision SHALL be not to add TanStack Query
- **AND** the stack SHALL continue using local-first state and explicit effects until the remote-state threshold is crossed
