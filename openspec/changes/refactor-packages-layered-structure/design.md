## Context

`@ipod/lib` resolves via `tsconfig.base.json` (`"@ipod/lib/*": ["packages/lib/*"]`)
and a mirrored alias in `vitest.config.ts`. There is **no barrel** — every consumer
imports the exact file (`@ipod/lib/color-manifest`, `@ipod/lib/ipod-state/update`).
So a file's location *is* its public import path, and reorganizing files rewrites
import specifiers everywhere. Roughly 150 specifier occurrences reference `@ipod/lib`
subpaths today.

The other packages already map cleanly to a Rails layer; `lib` is the only true grab
bag. This change is therefore ~90% about `lib` plus a written convention the rest of
the repo conforms to.

## Goals / Non-Goals

- Goals
  - One canonical folder per technical role; a new file's home is unambiguous.
  - Deterministic, reviewable migration (mechanical specifier rewrite, no logic edits).
  - A documented convention future packages/files must follow.
- Non-Goals
  - No runtime/behavioral changes. Pure structural refactor.
  - No internal restructuring of `packages/components` beyond fixing misfiled files
    (owned by `refactor-ipod-supporting-component-taxonomy`).
  - No change to the `@ipod/*` alias scheme or package boundaries themselves.

## Decisions

### Decision: Layer taxonomy for `@ipod/lib`

| Layer | Rails analog | Holds | Files (current → target) |
|-------|--------------|-------|--------------------------|
| `domain/` | `app/models` | Pure entity data, no side effects | `ipod-revision-data.ts`, `ipod-classic-presets.ts`, `ipod-assets.ts`, `color-manifest.ts` |
| `state/` | controllers | Orchestration: xstate machines + iPod-state reducer | `xstate/*`, `ipod-state/*` |
| `services/` | `app/services` | Side-effecting work | `export/*`, `export-delivery.ts`, `gif-export.ts`, `three-export.ts`, `storage.ts`, `feature-flags.ts`, `export-utils.ts` |
| `serializers/` | `app/serializers` | Snapshot/manifest transforms | `song-snapshots.ts` |
| `support/` | `lib/`, helpers | Cross-cutting pure utilities | `time-utils.ts`, `marquee.ts`, `utils.ts`, `color-proximity.ts`, `shared-ui-tokens.ts`, `design-system.ts` |

Repo-level mapping (documented, minimal moves):

| Package | Layer role |
|---------|-----------|
| `@ipod/components` | views |
| `@ipod/hooks` | helpers (view-adjacent) |
| `@ipod/types` | domain contracts |
| `@ipod/tokens` | design assets |
| `@ipod/config` | initializers / build config |

- Alternatives considered: **domain-driven feature folders** (export/, theming/,
  ipod-device/ each self-contained). Rejected per stakeholder preference for classic
  Rails layering, and because the heavy export code is a single cohesive subsystem
  that maps naturally to one `services/export` folder rather than being scattered.

### Decision: Migration via mechanical specifier rewrite, no compat shims

`git mv` files into layer folders, then rewrite each old specifier to its new path
across `packages/**` and `apps/web/**`. No back-compat barrels or duplicate path
aliases — they would re-introduce two ways to import the same thing (the clutter we
are removing) and risk tree-shaking regressions in the export worker.

- Alternatives considered:
  - **Layer barrels** (`@ipod/lib/services`) — ergonomic and very Rails-like, but a
    barrel that pulls in `export-encoder.worker.ts` and heavy export deps hurts
    bundle splitting. Deferred: may add thin barrels for `domain/`/`support/` later.
  - **tsconfig path remap keeping old specifiers working** — leaves dead aliases and
    defeats the "single obvious home" goal.

### Decision: Resolve duplication during the move

`packages/lib/export-scene.ts` and `packages/lib/export/export-scene.ts` both exist.
Reconcile to one canonical `services/export/export-scene.ts`; diff them first and, if
they diverge, treat as a bug to flag rather than silently picking one.

## Risks / Trade-offs

- **Wide diff (~150 import sites).** → Mechanical, scriptable rewrite from an explicit
  old→new mapping; reviewer checks the mapping table, not 150 lines individually.
- **Tooling globs by path.** `vitest.config.ts` includes `packages/lib/**/*.test.ts`
  (recursive — still matches) and aliases `@scripts`; verify both after the move.
  → Covered by a task; run the full unit + type-check suite as the gate.
- **Collision with in-flight component taxonomy change.** → Scope this change to
  `lib` moves + convention docs; do not move files inside `packages/components`.
- **Worker resolution.** `export-encoder.worker.ts` path changes; verify the worker
  still resolves under both Next and vitest. → Explicit verification task.

## Migration Plan

1. Land the convention doc (capability spec) first so the target is unambiguous.
2. `git mv` files per the mapping table (preserves history); reconcile `export-scene`.
3. Run the specifier-rewrite codemod; verify zero remaining old specifiers via grep.
4. Verify resolution config (tsconfig paths, vitest alias) and tooling globs.
5. Gate: `pnpm` type-check + unit tests + a build, all green.
- Rollback: single squashable refactor commit; revert reverts cleanly (no logic touched).

## Open Questions

- Should `design-system.ts` / `shared-ui-tokens.ts` live in `support/` or move into
  `@ipod/tokens`? Proposed: keep in `support/` now (they are code, not token JSON);
  revisit if `@ipod/tokens` grows a code surface.
- Do `@ipod/hooks` and `@ipod/types` warrant their own internal layering, or is a flat
  package acceptable given their small size? Proposed: leave flat until they grow.
