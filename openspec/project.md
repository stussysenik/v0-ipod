# Project Context

## Purpose
[Describe your project's purpose and goals]

## Tech Stack
- [List your primary technologies]
- [e.g., TypeScript, React, Node.js]

## Project Conventions

### Code Style
[Describe your code style preferences, formatting rules, and naming conventions]

### Architecture Patterns

**Layer-driven (Rails-inspired) package organization.** Shared code in `packages/*`
is organized by technical role — "convention over configuration" — so every file has
a single obvious home. When unsure where a module belongs, this mapping is authoritative.

Layers within a package (used today inside `@ipod/lib`):

| Folder | Rails analog | Holds |
|--------|--------------|-------|
| `domain/` | `app/models` | Pure entity data / constants, no side effects (revisions, presets, assets, color manifest) |
| `state/` | controllers | State machines and reducers that orchestrate behavior (`xstate/`, `ipod-state/`) |
| `services/` | `app/services` | Side-effecting work — I/O, export, persistence, flags (`export/`, storage, delivery) |
| `serializers/` | `app/serializers` | Transforms between domain objects and persisted/wire forms (snapshots) |
| `support/` | `lib/`, helpers | Cross-cutting pure utilities (time, marquee, color-proximity, utils) |

Package-to-layer mapping across the monorepo:

| Package | Role |
|---------|------|
| `@ipod/components` | views |
| `@ipod/hooks` | helpers (view-adjacent) |
| `@ipod/types` | domain contracts |
| `@ipod/tokens` | design assets |
| `@ipod/config` | initializers / build config |

Rules:
- No back-compat barrels or duplicate path aliases — one import path per module.
- Imports use the `@ipod/*` alias with the layer in the path
  (e.g. `@ipod/lib/state/ipod-state/model`, `@ipod/lib/services/export/animated-export`).
- A new module's folder is decided by its role, never by feature or author.

**Repository top-level layout.** The root is kept minimal — the goal is the fewest
top-level entries with one obvious home per thing. When adding a file, this decides
where it goes:

| Top-level | Holds | Decision cue |
|-----------|-------|--------------|
| `apps/` | Deployable runtimes (`web`, `mineru`) | "Does it ship as a running thing?" |
| `packages/` | Reusable code apps import (`@ipod/*`) | "Is it imported by an app?" |
| `tools/` | Dev/automation/integration tooling, not shipped (`scripts/`, `figma/` code-connect + `figma.config.json`, `plugins/`) | "A dev script or integration, not app code?" |
| `docs/` | Documentation & assets (`demo.gif`, repro, reference config) | "Is it documentation/reference?" |
| `openspec/` | Specs & change proposals | "Is it a spec or proposal?" |

Root config files **stay at root** and are intentionally not consolidated into a
`config/` dir: they are either auto-discovered by their tool (`vitest.config.ts`,
`playwright.config.ts`, `eslint.config.mjs`, `.lintstagedrc.json`), ship-critical CI
config (`.releaserc.json`, `lighthouserc.js`), or hard-pinned (`package.json`,
`pnpm-lock.yaml`, `tsconfig*.json`, `vercel.json`, `flake.*`, `shell.nix`, git
dotfiles). Moving them buys a few sidebar slots at the cost of breaking the build/ship
pipeline, so they remain at root by design.

Notes:
- `stories/` stays top-level for now: it is entangled with the in-flight
  component-taxonomy refactor and has stale imports that surface once type-checked.
  Fold it into `packages/components/` only after that refactor lands.
- Scripts under `tools/scripts/` compute `REPO_ROOT = resolve(import.meta.dir, "../..")`
  (two levels up). Keep that if scripts move depth changes.

### Testing Strategy
[Explain your testing approach and requirements]

### Git Workflow
[Describe your branching strategy and commit conventions]

## Domain Context
[Add domain-specific knowledge that AI assistants need to understand]

## Important Constraints
[List any technical, business, or regulatory constraints]

## External Dependencies
[Document key external services, APIs, or systems]
