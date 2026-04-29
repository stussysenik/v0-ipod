# Design — add-figma-atomic-foundations

## Context

This change operationalizes the **polishing crystal** phase of v0-ipod. The project has passed prototyping; the remaining work is high-fidelity polish against the real physical iPod as a reference artifact. The design-engineering environment must optimize for fidelity verification, not rapid iteration — every pixel the user sees needs a traceable provenance back to either a real measurement, a Figma Variable, or a design decision.

The existing `add-figma-devmode-bridge` change shipped Storybook 8, Code Connect mappings for 21 components, and a Satori-based raster push pipeline. That pipeline produces images, not editable vector layers, which is incompatible with the direct-manipulation workflow the designer needs for polish work. Rather than tearing it out, this change **narrows** it: the raster push coexists as a transitional bootstrap, and the foundations layer is built alongside as an additive layer.

**Stakeholders:** Senior Product Designer (system authorship), Interaction Designer (states, transitions), Industrial/Brand Designer (materials, silhouette), Design Engineer (binding code to Figma). Each persona works on a different **aspect** (color, type, space, dimensional fidelity, motion, material, accessibility, state) in parallel without colliding, because tokens are organized by aspect in addition to the canonical atomic hierarchy.

**Constraints:**
- Figma Plugin API is the authority for Variables — MCP is read-only for our purposes (confirmed in research doc §6).
- Gradient stops cannot be bound to Variables (known API limitation, research doc §5). Materials live as Styles.
- The canonical iPod Classic 5G reference measurements are not yet confirmed; the environment must ship before they are finalized.
- Every new contributor must reach a working environment in under five minutes from a clean clone.
- No existing Storybook stories may regress visually after tokens drive `globals.css`.

## Goals / Non-Goals

**Goals**
- Prove the full vertical slice (Figma file structure → Variables → DTCG → code consumption → provenance → Storybook reference) works end-to-end in a single coherent change.
- Organize tokens by aspect so personas can work independently.
- Make physical measurements first-class tokens, not magic numbers.
- Make the environment portable (clean checkout → working dev loop in one command).
- Ship unresolved measurements as warnings, not blockers.
- Preserve every path of escape for the designer: drawing-board mode, physical reference pane, provenance-backed undo.

**Non-Goals (deferred to later changes)**
- Component generation for the 21 in-scope atoms/molecules/organisms (C2).
- Frozen-by-default Hardware components with edit guards (C2).
- Drift lint comparing Figma against Storybook screenshots (C3).
- Motion tokens bound to Framer Motion config (C4).
- Material tokens as first-class Styles (C4).
- Interaction Designer timeline scrubber / spring playground (C4).
- Bidirectional authoring where designer-driven writes propagate to code at HMR speed (C5).
- Conflict detection and locking (C5).
- Superseding the `add-figma-devmode-bridge` raster push (C2 addendum — for now both coexist).

## Decisions

**Decision 1: Three-tier Variable architecture (Primitives / Semantic / Component).**
Primitives are raw values (colors, spacing units, radii, stroke weights, type scale steps). Semantic binds Primitives to roles (surface, text, border, focus) and is the only collection that carries light/dark modes. Component is empty in C1 and reserved for C2 component-scoped overrides.
*Alternatives:* Two-tier (Primitive + Semantic) was considered and rejected — Component is needed later to keep per-component overrides out of Semantic.

**Decision 2: Aspect layers as a parallel axis to atomic layers.**
In addition to the canonical atomic hierarchy (Primitives → Atoms → Molecules → Organisms → Templates → Pages), tokens are organized by aspect (Color, Type, Space, Radius, Stroke, Elevation, Material, Motion, Dimensional Fidelity, Accessibility, State). Any contributor can work one aspect without touching the others.
*Rationale:* Four personas need parallel work without collision. Single-axis (atomic-only) organization forces serialization on the token edit step. Aspect axis eliminates the collision.

**Decision 3: Sidecar JSON + JSONL log for provenance, not git-native.**
`design-tokens/.provenance.json` holds the latest entry per token path; `design-tokens/.provenance-history.jsonl` appends every write. Every plugin and CLI write must stamp provenance or the write fails.
*Alternatives considered:* Git-native (every token write is a git commit with a structured message) was rejected for C1 on simplicity grounds. It requires clean git state, complicates partial-work scenarios, and couples provenance to commit granularity. The sidecar can be promoted to git-native in C5 if audit requirements grow.

**Decision 4: Real-world mm are canonical, pixels are derived.**
`design-tokens/device-reference.json` captures iPod Classic 5G dimensions in mm. A derived formula Variable `device/classic-5g/body/height-px` computes `body.heightMm * scale.targetPxPerMm` and becomes a CSS `calc()` expression in code.
*Rationale:* The user explicitly wants fidelity verification against the real physical iPod. Pixel-first tokenization makes it impossible to answer "is the wheel 28mm or 30mm?" without measurement archaeology.

**Decision 5: Sticky notes are warnings, not blockers.**
Unresolved `[STICKY:...]` markers (canonical measurements, reference photos, maintainer handles) emit warnings in the build, surface in the Storybook toolbar, and render as `NaN` in dependent stories — but do not fail CI.
*Rationale:* The environment must ship before the reference measurements are finalized, otherwise the user is blocked on fieldwork (calipers on a real iPod) before they can use the tooling that measures. C2 may promote specific stickies to blocking once the environment is proven.

**Decision 6: `bun run setup` is the portability gate.**
One command covers `bun install → .env.local scaffolding → figma.config.json validation → token verification → tokens:extract → tokens:build → plugin build → storybook:build`. CI runs it on a throwaway container every PR.
*Alternatives considered:* A `setup.sh` shell script was rejected because it would duplicate Bun's existing orchestration and add a second language.

**Decision 7: Idempotent bootstrap script, not manual file setup.**
`scripts/figma-bootstrap.ts` creates the full page skeleton and Variable collections via idempotent writes — safe to re-run, never deletes existing content. The same library powers a "Bootstrap file" button in the plugin UI so both the script and the button route through one code path.
*Alternatives considered:* A manual runbook step was rejected because it is not reproducible and does not survive a new team member joining mid-project.

**Decision 8: Storybook decorator for the physical reference pane.**
The reference photo overlay and draggable ruler live as a Storybook decorator (`stories/decorators/physical-reference.tsx`) that wraps Hardware stories. Non-hardware stories opt out.
*Alternatives considered:* A standalone comparison app was rejected — Storybook is the existing mirror surface, and the decorator keeps the reference tool adjacent to the story it measures.

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|---|---|---|
| Idempotent bootstrap creates duplicates if keyed incorrectly | Figma file gets junk pages | Use `plugin-data` on created nodes to tag them with a deterministic key; re-runs update-not-create |
| Provenance stamping slows token writes | Designer friction | Provenance stamping is synchronous but file I/O only (<5ms); no network |
| DTCG round-trip introduces gratuitous reorderings | Spurious git diffs | Deterministic key ordering in the writer; round-trip test in CI verifies zero-delta on a no-op cycle |
| `NaN` in Storybook for unresolved stickies breaks visual tests | Flaky CI | Storybook build succeeds; only affected stories render `NaN`. Visual-diff CI skips hardware stories until stickies resolved |
| Figma Variable ID instability across runs | Broken bindings | Bootstrap script writes a `design-tokens/figma-id-map.json` manifest that maps stable token paths to Figma Variable IDs; subsequent runs read this before creating |
| Portability gate passes locally but fails in CI | Broken PRs | The CI job uses the same `bun run setup` script on a clean container — no fork between local and CI |
| Designer edits a Variable outside the plugin (direct Figma UI) | Provenance missed | Plugin polls for Variable changes on a 2s interval and stamps provenance retroactively with `source: "ui-write"` |
| Drawing-board hold never gets cleared | Component stuck out of drift lint forever | Hold expires after 14 days with a nag in the plugin UI |

## Migration Plan

**Forward migration**
1. Apply this change. Run `bun run setup` — verifies the environment.
2. Run `bun run figma:bootstrap` against the canonical file. Creates page skeleton and Variable collections.
3. Run `bun run tokens:extract` — pulls Variables into `design-tokens/tokens.json`.
4. Run `bun run tokens:build` — emits `app/globals.css` custom properties and `tailwind.config.ts` extension.
5. Verify Storybook renders identically to the current state (visual regression gate).
6. Resolve `[STICKY:...]` measurements post-merge as they become available.

**Rollback**
- Revert the merge commit. `figma.config.json` reverts to `PLACEHOLDER_FILE_KEY`, `app/globals.css` reverts to hand-authored values, `tailwind.config.ts` reverts.
- The Figma file retains the pages created by the bootstrap — they are empty scaffolds and can be left in place or deleted manually. No data loss.
- The drawing-board CLI is opt-in — no component enters drawing-board mode automatically, so there is nothing to reverse.
- CI portability job can be removed independently from the workflow.

Because the change is additive and does not delete any existing Figma content or code, rollback carries no data-loss risk.

## Open Questions

None blocking. All six open questions from the design spec §14 resolved with defaults (device model, `design-tokens/` ownership, provenance shape, bootstrap surface, sticky policy, runbook numbering). Sticky-note measurements are intentionally unresolved and will be filled in post-merge.
