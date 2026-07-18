## ADDED Requirements

### Requirement: Storybook Documents The Stabilized Shared UI Layer
The system SHALL introduce Storybook only after the repository has defined a stable shared primitive layer and local design contract.

#### Scenario: Reviewing The Storybook Workflow
- **GIVEN** a contributor is using Storybook to work on the repository UI
- **WHEN** they inspect Storybook scope and documentation
- **THEN** Storybook SHALL document stabilized shared primitives first
- **AND** it SHALL reflect the local design-system contract rather than inventing a parallel one

### Requirement: Shared Primitive Tokens Remain Repository-Owned
The system SHALL keep repository token files as the source of truth for shared primitive styling, with design-tool sync layered on top of that contract.

#### Scenario: Updating A Shared Primitive Token
- **GIVEN** a contributor needs to change a shared primitive token
- **WHEN** they perform that change through the documented workflow
- **THEN** the authoritative token update SHALL land in repository-managed token files
- **AND** any Tokens Studio or Figma workflow SHALL sync with that repository source rather than replace it

### Requirement: Storybook Separates Shared DS Stories From Product Showcase Stories
The system SHALL distinguish reusable design-system stories from iPod-specific product showcase stories.

#### Scenario: Browsing Story Navigation
- **GIVEN** a contributor is exploring Storybook
- **WHEN** they inspect the story hierarchy
- **THEN** shared DS primitives SHALL be separated from product showcase artifacts
- **AND** product stories SHALL not imply unintended reuse scope
- **AND** Storybook-only infrastructure surfaces SHALL not be presented as reusable primitives

### Requirement: Storybook Verifies Component States
The system SHALL use Storybook to verify important interactive and visual states for shared primitives.

#### Scenario: Inspecting A Shared Primitive Story
- **GIVEN** a contributor opens a shared primitive in Storybook
- **WHEN** they review the story set
- **THEN** Storybook SHALL expose relevant states such as default, hover, focus, disabled, or busy states
- **AND** the story documentation SHALL support DS-first iteration
