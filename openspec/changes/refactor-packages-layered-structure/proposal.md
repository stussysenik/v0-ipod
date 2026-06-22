# Change: Layer-driven (Rails-inspired) package structure

## Why

The monorepo migration moved code into `apps/web` + `packages/*`, but `@ipod/lib`
is a 38-file grab bag: export pipelines, xstate machines, the iPod-state reducer,
color utilities, presets, storage, time/marquee helpers, and feature flags all sit
side by side with no obvious home. New code has nowhere predictable to go, and deep
subpath imports (`@ipod/lib/ipod-state/model`, `@ipod/lib/export/animated-export`,
`@ipod/lib/utils`) leak that disorganization across ~150 call sites.

Rails' "convention over configuration" answers this with one canonical folder per
technical role — `models`, `controllers`, `services`, `serializers`, `helpers`.
Adopting that opinionatedness gives every file a single obvious home and makes the
clutter self-correcting: contributors know where a thing lives before they look.

## What Changes

- Establish a repo-wide **layer-driven convention** mapping each package to a Rails
  role, documented as the authoritative `package-architecture` capability.
- **Split `@ipod/lib`** (the grab bag) into role folders:
  - `domain/` — models / pure entity data (revisions, presets, assets, color manifest)
  - `state/` — xstate machines + the iPod-state reducer (the "controllers")
  - `services/` — side-effecting work (export pipeline, storage, delivery, flags)
  - `serializers/` — snapshot/manifest transforms
  - `support/` — genuine cross-cutting utilities (time, marquee, utils, color-proximity)
- Map the remaining packages to their layer in the same mental model:
  `components` = views, `hooks` = helpers, `types` = domain contracts,
  `tokens` = design assets, `config` = initializers. These already align; the change
  documents the convention and tidies only where a file is misfiled.
- **Resolve known duplication** surfaced by the move (e.g. `lib/export-scene.ts` vs
  `lib/export/export-scene.ts`).
- **BREAKING (internal only):** deep import specifiers change
  (`@ipod/lib/ipod-state/model` → `@ipod/lib/state/ipod-state/model`). A single
  mechanical codemod pass updates every call site; `@ipod/lib/*` alias resolution is
  unchanged.

## Impact

- Affected specs: `package-architecture` (new capability)
- Affected code:
  - `packages/lib/**` (file moves into layer folders)
  - ~150 import sites across `packages/**` and `apps/web/**` (specifier rewrites)
  - `tsconfig.base.json` paths, `vitest.config.ts` alias (verify; no remap needed)
  - Any tooling that globs `packages/lib/**` (e.g. vitest `include` for `*.test.ts`)
- Non-breaking for the public app surface — no runtime or behavioral change.
- Sequencing: coordinate with in-flight `refactor-ipod-supporting-component-taxonomy`
  so `packages/components` internal moves don't collide.
