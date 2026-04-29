## ADDED Requirements

### Requirement: Test Vocabulary Mirrors Production Architecture
The system SHALL align test helpers, page objects, and relevant interaction specs with the production architecture vocabulary.

#### Scenario: Reading A Playwright Helper
- **GIVEN** a contributor is using a page object or test helper
- **WHEN** they inspect section names and helper ownership
- **THEN** the terminology SHALL map cleanly to workbench, display, scene, control, editor, or export concepts
- **AND** the test layer SHALL avoid inventing a conflicting parallel taxonomy

### Requirement: Architecture Refactors Carry Validation Follow-Through
The system SHALL update affected tests when repository taxonomy or ownership boundaries change.

#### Scenario: Moving A Support Component
- **GIVEN** a support component or helper changes architectural category
- **WHEN** the repository is validated
- **THEN** the relevant tests, fixtures, and page objects SHALL be updated to match the new ownership model
- **AND** the refactor SHALL not leave stale references that only reflect pre-refactor filenames or concepts
