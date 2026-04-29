## ADDED Requirements

### Requirement: Canonical Figma file reference

The project SHALL reference the canonical Figma file at fileKey `UEUmBeQrbJd5gjbUennIg3` via `figma.config.json`. No build, script, CI job, or plugin invocation SHALL succeed while `figma.config.json` contains the string `PLACEHOLDER_FILE_KEY`.

#### Scenario: A clean checkout reaches the live file

- **WHEN** a contributor clones the repo, runs `bun install`, sets `FIGMA_TOKEN`, and runs `bun run figma:check-token`
- **THEN** the command SHALL succeed and print the canonical file name

#### Scenario: Placeholder fileKey fails fast

- **WHEN** any script reads `figma.config.json` and encounters `PLACEHOLDER_FILE_KEY`
- **THEN** the script SHALL exit with a non-zero status and print a remedy pointing at `README.md`

### Requirement: Idempotent file bootstrap

The project SHALL provide `scripts/figma-bootstrap.ts` that creates the full page skeleton and Variable collections in the canonical Figma file. Re-running the script against a file that has already been bootstrapped SHALL produce zero new nodes and zero deletions.

#### Scenario: First run populates the file

- **WHEN** a maintainer runs `bun run figma:bootstrap` against an empty canonical file
- **THEN** the script SHALL create every page listed in the design spec §6.1 with its two-digit prefix, populate `00 Cover`, `01 Changelog`, and `02 How to Use` with seed content, and create the `Primitives`, `Semantic`, and `Component` Variable collections

#### Scenario: Re-run is a no-op

- **WHEN** a maintainer runs `bun run figma:bootstrap` a second time against the same file
- **THEN** the script SHALL detect existing pages and collections via their stable `plugin-data` keys, skip creation, and exit with a summary showing zero changes

### Requirement: Three-tier Variable architecture

The canonical Figma file SHALL expose three Variable collections — `Primitives`, `Semantic`, and `Component` — that together form the full token authority for the project.

- `Primitives` holds raw values (color ramp, space scale, radius scale, stroke scale, type scale) with no modes.
- `Semantic` binds Primitives to roles (surface, text, border, focus) and is the ONLY collection that carries `Light` and `Dark` modes.
- `Component` is created empty in C1 and reserved for per-component overrides in C2.

#### Scenario: Semantic mode switching

- **WHEN** a designer toggles the `Semantic` collection's mode from `Light` to `Dark` on a frame
- **THEN** every Variable in the Semantic collection SHALL resolve to its dark-mode Primitive reference

#### Scenario: Primitives collection has no modes

- **WHEN** the bootstrap script creates the `Primitives` collection
- **THEN** the collection SHALL have exactly one mode (default) and no mode-switching affordance in Figma UI

### Requirement: Full page skeleton with separators

The canonical Figma file SHALL contain every page listed in the design spec §6.1 under `docs/superpowers/specs/2026-04-14-figma-atomic-foundations-design.md`, prefixed with two-digit ordinal keys and broken into groups by separator pages.

#### Scenario: Cover page seed content

- **WHEN** a designer opens `00 Cover` immediately after bootstrap
- **THEN** the page SHALL contain a version stamp, a status pill, and a maintainer handle placeholder referencing `[STICKY:maintainers]`

#### Scenario: Atoms pages exist empty

- **WHEN** a designer navigates to the Atoms page group after bootstrap
- **THEN** the pages `11 Atoms / Controls`, `12 Atoms / Text`, and `13 Atoms / Indicators` SHALL exist and be empty, ready for C2 population

### Requirement: Stable Figma ID manifest

The bootstrap script SHALL persist a mapping from stable token paths to Figma Variable IDs in `design-tokens/figma-id-map.json` so that subsequent runs reuse existing Variables rather than creating duplicates.

#### Scenario: Bootstrap reads the ID map before creating

- **WHEN** `bun run figma:bootstrap` runs against a file where `design-tokens/figma-id-map.json` already contains an entry for `color.primitive.blue.500`
- **THEN** the script SHALL reuse the recorded Variable ID and update the existing Variable's value rather than creating a new one
