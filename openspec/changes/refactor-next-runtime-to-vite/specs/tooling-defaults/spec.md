## ADDED Requirements

### Requirement: Bun And OXC Default Workflow
The project SHALL use Bun as the default package manager and OXC as the default lint workflow while the application runtime remains Next.js.

#### Scenario: Developer follows the default local workflow
- **WHEN** a developer installs dependencies and runs the standard project scripts
- **THEN** the documented default commands use Bun
- **AND** the default lint entry point uses OXC

### Requirement: Vite Migration Requires Explicit Runtime Review
The project SHALL not switch from Next.js to Vite without an explicit runtime migration plan that inventories current Next.js dependencies and replacement paths.

#### Scenario: Maintainer proposes Vite as the runtime
- **WHEN** the repository is evaluated for a Vite migration
- **THEN** the proposal identifies current Next.js-specific runtime features
- **AND** it defines replacements for those features before implementation begins
