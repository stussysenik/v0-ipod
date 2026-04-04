## ADDED Requirements

### Requirement: Repo-Local Pi Research Agent
The system SHALL provide a repo-local `pi-research` agent surface for design-reference research and audit generation.

#### Scenario: Local Agent Discovery
- **GIVEN** a developer or operator inspects the repository tooling
- **WHEN** they look for the Kimi-backed research surface
- **THEN** they SHALL find a repo-local `pi-research` agent or plugin definition
- **AND** its purpose SHALL be documented as research and audit support for the project

### Requirement: Committed Repo Discovery
The system SHALL make the `pi-research` surface discoverable and structurally valid from committed repo files alone.

#### Scenario: Fresh Clone Validation
- **GIVEN** a developer clones the repository without any ignored local assistant state
- **WHEN** they inspect and validate the `pi-research` surface
- **THEN** the committed plugin docs, manifests, scripts, and skill files SHALL be sufficient to discover and validate it
- **AND** structural validation SHALL not require `.agents/` or another ignored local directory to exist

### Requirement: Kimi K2.5 Default Model Binding
The system SHALL default the `pi-research` agent to NVIDIA NIM using `moonshotai/kimi-k2.5`.

#### Scenario: Default Model Resolution
- **GIVEN** the research agent is invoked without an explicit model override
- **WHEN** it prepares a request to the model backend
- **THEN** it SHALL target `moonshotai/kimi-k2.5`
- **AND** the model choice SHALL be explicit in the configuration surface rather than hidden in a prompt

### Requirement: Local Environment Secret Usage
The system SHALL read NIM credentials from the local environment at runtime.

#### Scenario: Missing NIM Key
- **GIVEN** `NIM_API_KEY` is absent or invalid
- **WHEN** the user invokes `pi-research`
- **THEN** the agent SHALL fail with a clear local configuration error
- **AND** it SHALL not attempt to persist secrets or placeholder credentials into repository files
