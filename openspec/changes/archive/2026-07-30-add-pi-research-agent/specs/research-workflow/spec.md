## ADDED Requirements

### Requirement: Structured Research Presets
The system SHALL provide durable research presets instead of relying on fully ad hoc prompts.

#### Scenario: Provenance Audit Preset
- **GIVEN** the user needs iPod finish provenance research
- **WHEN** they invoke the provenance audit preset
- **THEN** the agent SHALL generate a structured brief oriented around documented families, finishes, eras, and source notes
- **AND** the output SHALL be suitable for follow-on planning or review

### Requirement: Reusable Brief Output Format
The system SHALL emit research results in a reusable brief format that can feed OpenSpec, implementation prompts, or audit review.

#### Scenario: Implementation Brief Preparation
- **GIVEN** the user requests an implementation brief for a design or fidelity slice
- **WHEN** `pi-research` completes the request
- **THEN** the result SHALL be formatted as a structured brief rather than raw conversational drift
- **AND** the output SHALL be easy to hand to a separate implementation model or human reviewer

### Requirement: Fidelity Program Integration
The system SHALL document how research output supports the approved fidelity program.

#### Scenario: Restore Finish Provenance Support
- **GIVEN** the `restore-finish-provenance` change is active
- **WHEN** the operator uses `pi-research`
- **THEN** the documented workflow SHALL explain how research findings feed into planning, implementation briefs, or test updates
- **AND** it SHALL not imply that research output overrides the approved spec
