## ADDED Requirements

### Requirement: Repository Modules Have Explicit Architectural Ownership
The system SHALL organize touched TypeScript and JavaScript modules by clear subsystem ownership rather than a flat utility or legacy naming surface.

#### Scenario: Auditing The Repository Surface
- **GIVEN** a contributor is reviewing the repository-level TS/JS module inventory
- **WHEN** they inspect app, component, library, script, and test modules
- **THEN** each touched module SHALL be classifiable by a clear role such as workbench, device, display, scene, panel, control, editor, export, hook, test, script, or config
- **AND** exceptions SHALL be deliberate rather than accidental leftovers from prototype growth

### Requirement: Theme Standardization Remains Out Of Scope
The system SHALL separate architecture normalization from visual theme standardization during this change.

#### Scenario: Reviewing Repository Refactor Scope
- **GIVEN** a contributor evaluates the repository cleanup proposal
- **WHEN** they inspect the planned changes
- **THEN** the change SHALL focus on architecture, module ownership, typing, and effect boundaries
- **AND** it SHALL not require palette, token, typography, or broader theme standardization work
