## ADDED Requirements

### Requirement: Repository Defines A Local Design-System Contract
The system SHALL define a project-local design contract before introducing repository-wide design-system standardization.

#### Scenario: Reviewing The Design Workflow Source Of Truth
- **GIVEN** a contributor needs to understand the repository's design-system rules
- **WHEN** they inspect the project-level design contract
- **THEN** the repository SHALL provide a local `DESIGN.md`
- **AND** that contract SHALL override generic global assumptions with project-specific guidance

### Requirement: Shared Design Tokens Have An Explicit Foundation
The system SHALL define an explicit token foundation for shared reusable UI surfaces.

#### Scenario: Auditing Shared UI Styling
- **GIVEN** a contributor is evaluating reusable UI primitives
- **WHEN** they inspect shared styling rules and token ownership
- **THEN** the repository SHALL identify a token source of truth for the shared system
- **AND** the migration path away from hardcoded shared styles SHALL be documented

### Requirement: Product Visual Fidelity Remains Distinct From DS Scope
The system SHALL keep iPod product fidelity concerns separate from early shared-system tokenization.

#### Scenario: Inspecting Product-Specific Visual Code
- **GIVEN** a contributor is reviewing iPod fidelity surfaces
- **WHEN** they inspect the DS foundation scope
- **THEN** the change SHALL preserve product-specific visual ownership where reuse would be artificial
- **AND** broad product redesign SHALL remain out of scope
