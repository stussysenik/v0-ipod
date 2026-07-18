## ADDED Requirements

### Requirement: Shared UI Primitives Have Explicit Ownership Boundaries
The system SHALL define which UI surfaces belong to the reusable primitive layer versus the iPod product layer.

#### Scenario: Classifying A Component
- **GIVEN** a contributor is reviewing a component in `components/ui` or `components/ipod`
- **WHEN** they evaluate whether it is reusable
- **THEN** the repository SHALL provide explicit ownership guidance for shared primitives versus product assemblies
- **AND** the contributor SHALL not need to infer that boundary from naming alone

### Requirement: Components UI Contains Intentional Reuse Surfaces
The system SHALL keep `components/ui` limited to intentionally reusable primitives and patterns.

#### Scenario: Adding Or Refactoring Shared UI
- **GIVEN** a contributor is introducing or extracting a shared primitive
- **WHEN** they place that component in the repository
- **THEN** `components/ui` SHALL only contain primitives intended for reuse beyond the iPod assembly
- **AND** product-specific assembly code SHALL remain under `components/ipod`

### Requirement: Storybook Candidates Are Identified Before Storybook Setup
The system SHALL identify DS-ready primitives before Storybook is introduced as the shared UI workflow.

#### Scenario: Preparing Storybook Scope
- **GIVEN** a contributor is planning Storybook coverage
- **WHEN** they inspect the DS foundation outputs
- **THEN** the repository SHALL identify which shared primitives are ready for first-class documentation
- **AND** product-only artifacts SHALL be distinguishable from reusable DS components
