# Change: Minimal, opinionated repository top-level

## Why

After the package-architecture refactor, the repo *root* was still the source of
friction: ~27 visible top-level entries with loose source dirs (`services/`, `scripts/`,
`figma/`, `plugins/`, `design-tokens/`, `tests/`) scattered alongside config. There was
no obvious rule for where a new file belongs, which slowed shipping. Goal: the fewest
top-level entries with one obvious home per thing.

## What Changes

- Establish a **6-bucket top-level rule** (`apps/`, `packages/`, `tools/`, `docs/`,
  `openspec/`, + pinned root config) documented in `openspec/project.md`.
- **Fold loose source dirs into their obvious home:**
  - `services/mineru` → `apps/mineru` (deployable runtime)
  - `design-tokens/tokens.json` → `packages/tokens/`
  - `tests/` → `apps/web/tests/` (e2e for the web app)
  - `demo.gif`, `repro.sh`, `.repos.txt`, `ipod-config.yaml` (orphan) → `docs/`
- **Consolidate dev tooling under `tools/`:** `scripts/` → `tools/scripts/`,
  `plugins/` → `tools/plugins/`, `figma/` + `figma.config.json` → `tools/`.
- **BREAKING (internal only):** moved-file references repointed — `@scripts/*` alias,
  `tsconfig` include, Storybook glob, Playwright `testDir`, token/figma script paths,
  and `REPO_ROOT` depth in `tools/scripts/*` (`..` → `../..`).
- **Explicitly NOT done:** no `config/` dir. The seemingly-movable config files are
  auto-discovered, ship-critical, or hard-pinned; relocating them risks the build/ship
  pipeline for marginal gain. They stay at root by design.
- **Deferred:** `stories/` stays top-level — folding it into `packages/components/`
  surfaces stale imports entangled with `refactor-ipod-supporting-component-taxonomy`.

## Impact

- Affected specs: `package-architecture` (ADDED: top-level layout requirement)
- Affected code: `tools/**`, `apps/mineru`, `apps/web/tests`, `packages/tokens`,
  `docs/**`, plus references in `package.json`, `tsconfig*.json`, `vitest.config.ts`,
  `playwright.config.ts`, `.storybook/main.ts`, `tools/scripts/*`.
- No runtime/behavioral change to the app. Verified: type-check, build, unit tests
  (pre-existing marquee failure unrelated), Playwright discovery, and a runtime
  smoke-run of moved scripts.
- Pre-existing: the branch carries unstaged deletions from the in-flight monorepo
  migration (`app/`, `components/`, `lib/`, `hooks/` — already absent on disk). Out of
  scope here; stage separately to finalize that migration.
