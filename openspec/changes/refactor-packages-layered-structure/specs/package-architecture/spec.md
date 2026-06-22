## ADDED Requirements

### Requirement: Layer-driven package organization

The repository SHALL organize shared package code by technical role (layer), following
a Rails-inspired "convention over configuration" model, so that each file has a single
obvious home determined by its role rather than by feature or author preference.

The canonical layers and their Rails analog are:

- `domain/` — models: pure entity data with no side effects
- `state/` — controllers: state machines and reducers that orchestrate behavior
- `services/` — side-effecting operations (I/O, export, persistence, external work)
- `serializers/` — transforms between domain objects and persistable/wire forms
- `support/` — cross-cutting pure utilities

#### Scenario: Placing a new pure data module

- **WHEN** a contributor adds a module that only defines entity data or constants with no side effects
- **THEN** it is placed under the `domain/` layer of its package

#### Scenario: Placing a new side-effecting module

- **WHEN** a contributor adds a module that performs I/O, export, or persistence
- **THEN** it is placed under the `services/` layer of its package

#### Scenario: Resolving where state orchestration lives

- **WHEN** a contributor adds a state machine or reducer
- **THEN** it is placed under the `state/` layer, not mixed with domain data or services

### Requirement: `@ipod/lib` is split into layer folders

The `@ipod/lib` package SHALL expose its modules under layer folders
(`domain/`, `state/`, `services/`, `serializers/`, `support/`) rather than as a flat
collection, and SHALL NOT retain a top-level module that belongs to one of those layers.

#### Scenario: Importing a domain module from lib

- **WHEN** a consumer imports iPod revision or preset data
- **THEN** the import specifier resolves under `@ipod/lib/domain/`

#### Scenario: No duplicate module across layers

- **WHEN** two modules previously provided the same export from different paths (e.g. `export-scene`)
- **THEN** the package retains exactly one canonical module for that export

### Requirement: Package-to-layer mapping is documented and authoritative

The repository SHALL document, in `openspec/project.md`, which Rails layer each
workspace package corresponds to (`components` = views, `hooks` = helpers,
`types` = domain contracts, `tokens` = design assets, `config` = initializers), and
this mapping SHALL be the reference contributors use when deciding where code belongs.

#### Scenario: Deciding which package a new module belongs to

- **WHEN** a contributor is unsure which package a new module belongs in
- **THEN** the documented package-to-layer mapping in `openspec/project.md` resolves the decision

### Requirement: Structural refactor preserves behavior and resolution

Reorganizing files into layer folders SHALL NOT change runtime behavior, and import
resolution SHALL continue to work via the existing `@ipod/*` alias scheme without
introducing back-compat shims or duplicate path aliases.

#### Scenario: Consumers resolve relocated modules

- **WHEN** the build, type-checker, and test runner resolve imports after the move
- **THEN** all relocated modules resolve through `@ipod/lib/*` with no remaining references to pre-move specifiers

#### Scenario: No behavioral change

- **WHEN** the unit test suite and production build run after the refactor
- **THEN** they pass with no logic changes attributable to the reorganization
