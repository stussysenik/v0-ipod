## 1. Fold loose source dirs

- [x] 1.1 `services/mineru` → `apps/mineru`
- [x] 1.2 `design-tokens/tokens.json` → `packages/tokens/`; repoint token scripts
- [x] 1.3 `tests/` → `apps/web/tests/`; repoint Playwright `testDir` + package.json paths
- [x] 1.4 `demo.gif`, `repro.sh`, `.repos.txt`, `ipod-config.yaml` → `docs/`

## 2. Consolidate dev tooling under tools/

- [x] 2.1 `scripts/` → `tools/scripts/` (run-next/type-check already going to apps/web/scripts)
- [x] 2.2 `plugins/` → `tools/plugins/`
- [x] 2.3 `figma/` + `figma.config.json` → `tools/`
- [x] 2.4 Fix `REPO_ROOT` depth (`..` → `../..`) and figma/figma.config paths in `tools/scripts/*`
- [x] 2.5 Repoint `@scripts/*` (tsconfig.base, vitest), tsconfig include, `cursor:harness`, oxlint ignore

## 3. Convention

- [x] 3.1 Document the 6-bucket top-level rule + "configs stay at root" rationale in `project.md`

## 4. Validation

- [x] 4.1 Type-check passes
- [x] 4.2 Unit tests (7/8; marquee failure pre-existing, reproduced on prior tree)
- [x] 4.3 Production build succeeds
- [x] 4.4 Playwright discovers all e2e at new `apps/web/tests` (`--list`: 32 tests)
- [x] 4.5 Runtime smoke of moved scripts (`check-code-connect-parity`: "21 mappings in parity")
- [ ] 4.6 `openspec validate --strict --no-interactive` — CLI not installed; delta format verified manually

## 5. Deferred / out of scope

- [x] 5.1 `stories/` left top-level (stale imports entangled with component-taxonomy refactor)
- [x] 5.2 No `config/` dir — root configs are auto-discovered/ship-critical/pinned
- [x] 5.3 Flagged (not actioned) the in-flight migration's unstaged deletions of `app/`, `components/`, `lib/`, `hooks/`
