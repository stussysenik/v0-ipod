## ADDED Requirements

### Requirement: UnoCSS Is The Single Atomic-CSS Engine
The system SHALL use UnoCSS as the sole atomic-CSS engine for the application, wired into the active build pipeline, with Tailwind removed once parity is proven.

#### Scenario: Building the application
- **GIVEN** the project build runs through the webpack pipeline
- **WHEN** a developer builds or starts the app
- **THEN** UnoCSS SHALL generate the utility stylesheet consumed by the app
- **AND** after cutover no Tailwind configuration, directive, or dependency SHALL remain

#### Scenario: Authoring utility classes
- **GIVEN** a contributor writes utility classes on a React element
- **WHEN** the class names follow the `presetWind` (Tailwind-compatible) vocabulary already in use
- **THEN** UnoCSS SHALL resolve those classes without rewriting existing className strings
- **AND** `cva`-defined variants SHALL continue to function unchanged

### Requirement: Design Tokens Are Preserved Under UnoCSS
The system SHALL reproduce the existing shadcn CSS-variable token theme and the previously Tailwind-provided `animate-*` utilities within the UnoCSS configuration.

#### Scenario: Rendering a token-backed component
- **GIVEN** a component uses token classes such as `bg-background`, `text-foreground`, or `border-border`
- **WHEN** it renders under the UnoCSS engine
- **THEN** the resolved colors SHALL match the prior shadcn token values
- **AND** components relying on `animate-*` utilities SHALL retain equivalent animation behavior

### Requirement: Migration Preserves Visual Parity
The system SHALL migrate surfaces incrementally with Tailwind and UnoCSS coexisting until each surface is verified, removing Tailwind only after repo-wide parity holds.

#### Scenario: Verifying a migrated surface
- **GIVEN** a surface has been switched to UnoCSS-generated styles
- **WHEN** it is compared against the pre-migration rendering
- **THEN** the surface SHALL be visually equivalent
- **AND** the Lighthouse accessibility (≥0.95) and CLS (≤0.1) gates SHALL continue to pass

#### Scenario: Removing Tailwind safely
- **GIVEN** all surfaces report parity under UnoCSS
- **WHEN** Tailwind and its dependencies are removed
- **THEN** the build SHALL succeed with UnoCSS as the only engine
- **AND** `oxlint` SHALL remain the default lint gate with no ESLint twin reintroduced
