## ADDED Requirements

### Requirement: Minimal opinionated top-level layout

The repository root SHALL minimize the number of top-level entries by mapping every
file and directory to one of a small, fixed set of opinionated homes, so that the
correct location for any new file is unambiguous without deliberation.

The top-level homes are:

- `apps/` — deployable runtimes
- `packages/` — reusable code imported by apps (the `@ipod/*` workspace packages)
- `tools/` — developer/automation/integration tooling that is not shipped
- `docs/` — documentation and reference assets
- `openspec/` — specs and change proposals

#### Scenario: Placing a new deployable runtime

- **WHEN** a contributor adds a new runnable service or app
- **THEN** it is placed under `apps/<name>` (e.g. the Python `mineru` service lives at `apps/mineru`)

#### Scenario: Placing a new dev script or integration

- **WHEN** a contributor adds a build script, automation, or external integration that is not shipped in an app
- **THEN** it is placed under `tools/` (e.g. `tools/scripts/`, `tools/figma/`, `tools/plugins/`)

#### Scenario: Deciding where a new file belongs

- **WHEN** a contributor is unsure where a new file goes
- **THEN** the documented top-level rule in `openspec/project.md` resolves it without case-by-case debate

### Requirement: Root config files stay at root

Tool configuration files SHALL remain at the repository root rather than being
consolidated into a `config/` directory, because they are auto-discovered by their
tools, ship-critical, or hard-pinned, and relocating them would break the build or
release pipeline.

#### Scenario: Adding a tool config

- **WHEN** a contributor adds or moves a config file that a tool auto-discovers at the repo root (test runner, linter, release tooling)
- **THEN** it stays at the repo root and is not moved under a `config/` directory

#### Scenario: Structural moves preserve the build and ship pipeline

- **WHEN** loose directories are folded into the top-level homes
- **THEN** type-check, production build, e2e test discovery, and moved dev scripts all continue to resolve their paths and pass
