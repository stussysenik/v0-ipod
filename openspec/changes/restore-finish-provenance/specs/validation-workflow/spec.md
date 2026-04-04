## ADDED Requirements

### Requirement: Playwright-First Tdd Loop
The system SHALL express known layout and export regressions as failing Playwright checks before implementation fixes land.

#### Scenario: Regression-Driven Fix
- **GIVEN** a white-rectangle artifact, long-metadata breakage, or mode-labeling regression is identified
- **WHEN** implementation work begins
- **THEN** a Playwright test covering that behavior SHALL exist and fail against the broken baseline before the fix is applied
- **AND** the change SHALL not be considered complete until that test passes

### Requirement: Optional Secondary Validation Channels
The system SHALL treat Cypress and Chrome DevTools as optional follow-up validation paths unless they are configured as active project tooling.

#### Scenario: Missing Secondary Tooling
- **GIVEN** a validation pass is requested
- **WHEN** Cypress or Chrome DevTools automation is not available in the repository or toolchain
- **THEN** the change SHALL still require Playwright and local type validation
- **AND** any missing secondary validation path SHALL be documented rather than implied
