# Change: Add atomic foundations layer for the design-engineering environment (C1)

## Why

v0-ipod is in the **polishing crystal** phase — the experience has converged and the remaining work is high-fidelity polish against the physical iPod. The canonical Figma file at `figma.com/design/UEUmBeQrbJd5gjbUennIg3/v0-ipod-design-system` is currently empty, and the existing `add-figma-devmode-bridge` change produces rasterized frames via Satori instead of editable vector layers. Real-world dimensions (iPod body height, wheel diameter, bezel width) are magic numbers scattered across components rather than first-class tokens. There is no provenance — nobody can answer "who changed `stroke/hairline` from 1 to 1.5 three weeks ago?" A new contributor cannot `git clone && bun install && bun run setup` into a working environment. Four designer personas (Senior Product Designer, Interaction Designer, Industrial/Brand Designer, Design Engineer) cannot work in parallel without colliding because tokens are not organized by aspect.

This change is the **smallest slice that proves the model end-to-end**: real file structure, real Variables with real modes, real DTCG round-trip, real code-side token consumption, real provenance, real physical-reference pane, and real team portability. Component generation, drift lint, motion tokens, and bidirectional authoring are explicitly deferred to C2–C5.

Companion docs: `docs/superpowers/research/2026-04-14-design-engineering-environment.md` (team reference) and `docs/superpowers/specs/2026-04-14-figma-atomic-foundations-design.md` (detailed design spec, committed in `b971caa`).

## What Changes

- **Figma foundations bootstrap.** Populate the canonical Figma file with the full page skeleton (Cover, Changelog, How to Use, Foundations/*, Primitives/*, Atoms/*, Molecules/*, Hardware/*, UI/*, Templates/*, Pages/*, Playground, Docs/*, Archive) and three-tier Variable collections (Primitives, Semantic with light/dark modes, Component empty-for-C2) via an idempotent `scripts/figma-bootstrap.ts` that is safe to re-run.
- **DTCG token pipeline.** `bun run tokens:extract` pulls Figma Variables into W3C DTCG JSON. `bun run tokens:sync` writes DTCG JSON back into Figma Variables. `bun run tokens:build` runs Style Dictionary to emit `tailwind.config.ts` extension + `app/globals.css` custom properties. Round-trip is deterministic.
- **Token provenance sidecar.** Every token write from any direction stamps `design-tokens/.provenance.json` with `{ layer, author, timestamp, figmaNodeId, commitSha, source }` and appends to `.provenance-history.jsonl`. `bun run provenance:show <token-path>` prints the history. JSON Schema validated in CI.
- **Dimensional fidelity.** Committed `design-tokens/device-reference.json` captures real-world mm for the canonical iPod Classic 5G (body, wheel, screen, bezel). Build derives `device/*` Figma Variables and CSS custom properties. Unresolved `[STICKY:...]` measurements emit warnings, not errors. Components that reference unresolved stickies render `NaN` so the gap surfaces loudly.
- **Drawing-board escape hatch.** `bun run design:back-to-figma <component>` marks a component as "in redesign," opens the Figma frame in the browser, writes `.design-holds.json`, and suspends drift lint (when C3 adds it). `--done` clears the hold and validates provenance was stamped.
- **Physical reference pane.** A Storybook decorator pins a reference image behind Hardware stories at matching mm scale, with a draggable ruler that reads `<X.X>mm (<Y>px)` from `device/*` tokens. Keyboard: `R` toggles image, `L` toggles rulers.
- **Portability gate.** `bun run setup` is idempotent, covers `bun install → .env.local → figma.config.json validation → figma:check-token → tokens:extract → tokens:build → figma/plugin build → storybook:build`. CI runs `bun run setup` on a throwaway container every PR and fails the build if the sequence does not produce a working environment.
- **Defaults accepted.** All six open questions in the design spec §14 resolved with defaults: iPod Classic 5G canonical, sidecar-plus-JSONL provenance, both plugin-button and node-script bootstrap surface, warn-not-block sticky policy, "Phase 0 — Foundations bootstrap" runbook insertion.

## Impact

- **Affected specs (ADDED capabilities):** `figma-foundations-bootstrap`, `design-token-dtcg-pipeline`, `design-token-provenance`, `dimensional-fidelity`, `drawing-board-escape-hatch`, `physical-reference-pane`, `environment-portability-gate`
- **Relationship to `add-figma-devmode-bridge`:** Not superseded. Narrowed with an addendum. Phase 1 (Storybook + Code Connect + Satori raster push) is kept as a transitional bootstrap. Phase 1.3 (manual file bootstrap) is replaced by this change's `figma-bootstrap` script. Phase 1.7 (token extract) is replaced by this change's DTCG pipeline. Phases 2 and 3 are kept and will be extended by C2–C5.
- **Affected code:**
  - New: `scripts/figma-bootstrap.ts`, `scripts/setup.ts`, `scripts/tokens-extract.ts`, `scripts/tokens-sync.ts`, `scripts/tokens-build.ts`, `scripts/provenance-show.ts`, `scripts/provenance-stamp.ts`, `scripts/design-back-to-figma.ts`
  - New: `design-tokens/tokens.json`, `design-tokens/device-reference.json`, `design-tokens/.provenance.json`, `design-tokens/.provenance-history.jsonl`, `design-tokens/.schema/provenance.schema.json`, `design-tokens/.schema/device-reference.schema.json`
  - New: `stories/decorators/physical-reference.tsx`
  - Modified: `figma.config.json` (real fileKey), `app/globals.css` (tokens-driven), `tailwind.config.ts` (tokens-driven), `figma/plugin/` (provenance stamping), `package.json` scripts, `README.md` (getting started pointer)
- **Affected docs:** `docs/figma/runbook.md` (new Phase 0 section), `docs/figma/file-manifest.md` (replaced), new `docs/figma/provenance.md`, new `docs/figma/dimensional-fidelity.md`, updated `ENGINEERING_SETUP.md`
- **Affected CI:** New portability job in `.github/workflows/figma-bridge.yml`, token-freshness check, provenance-integrity check, Storybook build check.
- **Phased delivery:** C1 is a single-change proposal. C2–C5 (component generation, drift lint, motion tokens, bidirectional authoring) are separate future changes.
- **Rollback:** Fully additive. Every deliverable can be independently reverted. Bootstrap script is idempotent and does not delete pre-existing Figma content. No data loss risk.
