# Design Spec — `add-figma-atomic-foundations` (C1)

**Date:** 2026-04-14
**Status:** Ready — defaults accepted, ready for OpenSpec proposal scaffolding
**Target OpenSpec change-id:** `add-figma-atomic-foundations`
**Companion reference:** [`docs/superpowers/research/2026-04-14-design-engineering-environment.md`](../research/2026-04-14-design-engineering-environment.md) — read first for principles, personas, and sourced rationale.

---

## 1. Context

v0-ipod is in the **polishing crystal** phase: the experience has converged and the remaining work is high-fidelity polish against the real physical iPod as a reference. The canonical Figma file at `figma.com/design/UEUmBeQrbJd5gjbUennIg3/v0-ipod-design-system` currently contains one default page and zero content. The existing OpenSpec change `add-figma-devmode-bridge` wired up Storybook 8, Code Connect mappings (21 of them), a custom Figma plugin scaffold, and a Satori-based rasterized push pipeline. That pipeline produces **images**, not editable vector layers, which is incompatible with the direct-manipulation workflow the designer needs.

This spec covers the **foundations layer** of the design-engineering environment — the smallest slice that proves the model works end-to-end: real file structure, real Variables with real modes, real DTCG export, real code-side token consumption, real provenance, real physical-reference pane, and real team portability. It explicitly does NOT cover component generation, drift lint, motion tokens, or bidirectional authoring — those are C2–C5 in separate changes.

## 2. Why

- The `figma.config.json` still points at `PLACEHOLDER_FILE_KEY`. The real file cannot be reached by any tool until this is fixed.
- The runbook's Phase 1 push relies on Satori + Story.to.Design, which produces rasterized frames. The user has explicitly rejected images as the primary artifact.
- There is no provenance system. A designer cannot answer "who changed `stroke/hairline` from 1 to 1.5 three weeks ago?" without archaeology.
- Real-world physical dimensions are not tokenized. The iPod body's 103.5mm height is a magic number scattered across components instead of a single Variable.
- A new contributor cannot `git clone && bun install && bun run setup` into a working environment. The environment is not portable.
- The four personas (senior product designer, interaction designer, industrial/brand designer, design engineer) cannot work on their aspect in parallel without collision because tokens are not organized by aspect.

C1 resolves all six gaps in one coherent change.

## 3. Goals

1. **Real canonical file wired up.** `figma.config.json` points at the real fileKey. Plugin, MCP, and REST paths all reach the live file.
2. **Full page skeleton created.** All pages from section 4.5 of the research doc exist in the canonical file, with two-digit prefixes and separator pages.
3. **Three-tier Variable architecture populated.** Primitives, Semantic (with light/dark modes), and Component collections exist with seed values. Semantic bindings correctly reference Primitives.
4. **Dimensional Fidelity aspect lives.** `device/classic-5g/*` Variables exist for every dimension listed in the sticky notes (even if values are filled in after C1 merges — provisioned but not final).
5. **DTCG export pipeline works.** `bun run tokens:extract` reads Figma Variables and writes DTCG JSON. `bun run tokens:sync` reads DTCG JSON and writes Figma Variables. Round-trip is deterministic (no gratuitous reorderings).
6. **Style Dictionary build works.** `bun run tokens:build` reads DTCG and emits `tailwind.config.ts` extension + `app/globals.css` custom properties.
7. **Provenance sidecar is live.** Every Variable write from any direction stamps `design-tokens/.provenance.json` with `{ layer, author, timestamp, figmaNodeId, commitSha }`. A CLI reads it and answers "who set this when."
8. **Drawing-board escape hatch CLI exists.** `bun run design:back-to-figma <component>` marks a component as "in redesign," opens the Figma frame in the browser, suspends drift lint for that component until check-in.
9. **Physical reference pane MVP.** A Storybook decorator pins a placeholder reference image behind Hardware stories, with a draggable ruler that reads mm/px values from `device/scale/px-per-mm`.
10. **`bun run setup` is a portability gate.** On a clean checkout, `git clone && bun install && bun run setup` takes a new contributor from zero to working. CI runs this on a throwaway container every PR.

## 4. Non-goals (deferred to C2–C5)

- Generating real Figma components for the 21 in-scope atoms/molecules/organisms. (C2)
- Frozen-by-default Hardware components with edit guards. (C2)
- Drift lint comparing Figma frames against Storybook screenshots. (C3)
- Motion tokens bound to Framer Motion config. (C4)
- Material tokens as first-class Styles. (C4)
- Interaction Designer timeline scrubber / spring playground. (C4)
- Bidirectional authoring (designer-driven writes propagating to code). (C5)
- Conflict detection and locking. (C5)
- Superseding `add-figma-devmode-bridge`'s Satori raster push. (C2 addendum — for now, the raster push coexists as a transitional bootstrap.)

## 5. Principles (from research doc — summary)

Load-bearing principles this spec honors. See research doc §2 for full text.

1. Figma owns visual truth.
2. Code owns execution.
3. Storybook is the mirror.
4. Atomic Design is the language.
5. The triangle is sacred (Figma ↔ code ↔ Storybook).
6. Parametric shapes, not freeform vectors.
7. One-way per property.
8. Drawing board escape hatch.
9. Provenance is mandatory.
10. Real-world mm are canonical, pixels are derived.
11. Frozen by default for Hardware components.

## 6. Architecture

### 6.1 Figma file structure

Page skeleton from research doc §4.5, reproduced here for spec authority:

```
00  Cover
01  Changelog
02  How to Use
─────────────────────────────
03  Foundations / Color
04  Foundations / Type
05  Foundations / Spacing & Radius
06  Foundations / Elevation & Motion
07  Foundations / Materials
08  Foundations / Dimensions
09  Primitives / Icons
10  Primitives / Logos & Marks
─────────────────────────────
11  Atoms / Controls
12  Atoms / Text
13  Atoms / Indicators
─────────────────────────────
14  Molecules / Form Fields
15  Molecules / Menu Items
16  Molecules / Status Rows
─────────────────────────────
17  Hardware / Shell
18  Hardware / Wheel
19  Hardware / Screen
─────────────────────────────
20  UI / Navigation
21  UI / Lists
22  UI / Now Playing
23  UI / Controls HUD
─────────────────────────────
24  Templates / Device + Screen
25  Templates / Menu Flow
26  Templates / Now Playing Flow
─────────────────────────────
27  Pages / Hero Scenes
28  Pages / Marketing Stills
─────────────────────────────
90  Playground
98  Docs / Principles
99  Docs / Contribution
─────────────────────────────
99  Archive
```

C1 creates every page. Component and Template pages are created empty — they get populated in C2+. `00 Cover` gets a minimal version stamp + status pill + maintainer handle [STICKY:maintainers]. `01 Changelog` gets its first entry: "C1: foundations seeded, 2026-04-14." `02 How to Use` gets a three-step onboarding callout.

### 6.2 Aspect layers (parallel axis to atomic layers)

Aspects organize tokens by concern. Any contributor can work one aspect without touching the others.

| Aspect | Scope | Variable family | Example |
|---|---|---|---|
| Color | Hue, tint, contrast, theming | `color/*`, `surface/*`, `text/*`, `border/*` | `surface/raised` |
| Type | Font family, size, weight, line-height, letter-spacing | `type/*` | `type/body/size` |
| Space | Padding, margin, gap | `space/*` | `space/inline/sm` |
| Radius | Corner geometry per-corner | `radius/*` | `radius/lg` |
| Stroke | Stroke weight per-side | `stroke/*` | `stroke/hairline` |
| Elevation | Shadow + blur | `elevation/*` (as Styles) | `elevation/raised` |
| Material | Gradient + noise + highlight curve | `material/*` (as Styles + Variables) | `material/aluminum-brushed` |
| Motion | Easing, duration, spring | `motion/*` (provisioned in C1, wired in C4) | `motion/spring/menu` |
| Dimensional Fidelity | Real-world mm, scale, derived px | `device/*` | `device/classic-5g/body/height-mm` |
| Accessibility | Contrast ratios, focus ring specs, reduced motion | `a11y/*` | `a11y/focus-ring/width` |
| State | Hover, active, disabled, selected overlays | `state/*` | `state/hover/opacity` |

C1 populates Color, Type, Space, Radius, Stroke, Elevation, Dimensional Fidelity, Accessibility, State. Material and Motion are **provisioned** (collections created, example Variable stubs) but filled in fully in C4.

### 6.3 Token model (Variables vs Styles vs Components)

Per research doc §5. The rules in summary:

- Numbers and hex → Variables.
- Gradients and multi-layer effects → Styles.
- Shapes you drag → Components.
- Bind each corner radius individually — never the shorthand.
- Never bind gradient stops — Figma API dead-end, known limitation.
- Light/dark modes live on the Semantic collection only.

### 6.4 Provenance model

Sidecar file: `design-tokens/.provenance.json`.

```json
{
  "schemaVersion": "1.0.0",
  "entries": [
    {
      "tokenPath": "color.surface.raised",
      "layer": "figma",
      "author": "senik456@gmail.com",
      "authorHandle": "senik",
      "timestamp": "2026-04-14T14:22:11Z",
      "figmaNodeId": "VariableID:123:456",
      "figmaFileKey": "UEUmBeQrbJd5gjbUennIg3",
      "commitSha": "a025f03",
      "source": "plugin-write",
      "note": null
    },
    {
      "tokenPath": "device.classic-5g.body.height-mm",
      "layer": "code",
      "author": "senik456@gmail.com",
      "authorHandle": "senik",
      "timestamp": "2026-04-14T15:01:44Z",
      "figmaNodeId": "VariableID:123:789",
      "figmaFileKey": "UEUmBeQrbJd5gjbUennIg3",
      "commitSha": "a025f03",
      "source": "tokens-sync",
      "note": "Initial seed from Apple spec sheet [STICKY:reference-spec-sheet]"
    }
  ]
}
```

Every token write appends or updates the relevant entry. A CLI command `bun run provenance show <token-path>` prints the history.

**Rules:**
- Provenance is **append-only** in practice — the CLI updates `timestamp`, `commitSha`, `source`, and `note` but preserves the full history in a `.provenance-history.jsonl` log for durable audit.
- Provenance is never hand-edited.
- Every plugin and CLI write must stamp provenance. If it does not, the write fails.

### 6.5 Dimensional Fidelity model

Committed file: `design-tokens/device-reference.json`.

```json
{
  "schemaVersion": "1.0.0",
  "canonical": "classic-5g",
  "devices": {
    "classic-5g": {
      "label": "iPod Classic 5th Generation (2005)",
      "source": "[STICKY:reference-spec-sheet]",
      "dimensions": {
        "body": {
          "heightMm": "[STICKY:body-height-mm]",
          "widthMm": "[STICKY:body-width-mm]",
          "depthMm": "[STICKY:body-depth-mm]",
          "cornerRadiusMm": "[STICKY:body-corner-radius-mm]"
        },
        "wheel": {
          "outerDiameterMm": "[STICKY:wheel-diameter-mm]",
          "innerRingDiameterMm": "[STICKY:wheel-inner-ring-diameter-mm]",
          "centerButtonDiameterMm": "[STICKY:wheel-center-button-diameter-mm]"
        },
        "screen": {
          "diagonalIn": "[STICKY:screen-diagonal-in]",
          "resolutionWpx": "[STICKY:screen-resolution-w-px]",
          "resolutionHpx": "[STICKY:screen-resolution-h-px]",
          "bezelWidthMm": "[STICKY:bezel-width-mm]"
        }
      },
      "scale": {
        "targetPxPerMm": "[STICKY:target-scale-px-per-mm]"
      },
      "referencePhotos": [
        "[STICKY:reference-photos]"
      ],
      "frozen": true
    }
  }
}
```

The build step reads this file and emits Figma Variables under the `device/*` family plus CSS custom properties (`--device-body-height-mm`, etc.). A derived formula variable `device/classic-5g/body/height-px` computes `body.heightMm * scale.targetPxPerMm` and becomes a CSS `calc()` expression in code.

Sticky-noted values are safe to leave unresolved until the user fills them in — they are loaded as `null` and the build emits warnings (not errors). Components that reference them show `NaN` in Storybook until resolved, which is the intended failure mode: it surfaces the unresolved reference loudly.

### 6.6 Drawing-board escape hatch

CLI command: `bun run design:back-to-figma <component-name>`

Behavior:
1. Validate that the component exists in `components/ipod/` or `components/ui/`.
2. Look up the Figma node id for the corresponding component from `figma/code-connect/*.figma.tsx` and `docs/figma/frame-manifest.json`.
3. Write an entry to `.design-holds.json`: `{ componentName, figmaNodeId, openedAt, reason }`.
4. Open the Figma frame URL in the default browser.
5. Print a receipt: `✓ <component> is now in drawing-board mode. Drift lint will skip this component until you check it back in with 'bun run design:back-to-figma <component> --done'.`

The `--done` flag clears the hold, validates that provenance has been updated for whichever tokens changed, and re-enables drift lint for that component.

C3's drift lint honors the hold — holds suspend drift checks, not provenance stamping.

### 6.7 Physical reference pane (Storybook MVP)

Storybook decorator: `stories/decorators/physical-reference.tsx`.

Behavior (MVP):
- Accepts a prop `{ device: 'classic-5g', photo: string, show?: boolean }`.
- Renders a transparent overlay container that holds the reference photo at matching mm scale, using `device/classic-5g/scale/target-px-per-mm` to size the image so each rendered mm of the reference photo equals each rendered mm of the story.
- Provides a draggable ruler (horizontal and vertical) that reads out `"<X.X>mm (<Y>px)"` at the cursor position.
- Keyboard: `R` toggles the reference photo visibility, `L` toggles the rulers.

C1 MVP renders a placeholder SVG reference until `[STICKY:reference-photos]` is filled in. Stories under `stories/hardware/*` wrap in the decorator; everything else opts out.

### 6.8 `bun run setup` — portability gate

Script: `scripts/setup.ts`.

Steps, each idempotent:
1. `bun install` (no-op if already installed).
2. Verify `.env.local` exists; copy from `.env.example` if not and prompt for `FIGMA_TOKEN`.
3. Verify `figma.config.json` has a real fileKey (not `PLACEHOLDER_FILE_KEY`). If placeholder, fail with a clear message pointing at the README.
4. `bun run figma:check-token` — verifies the token reaches the live file.
5. `bun run tokens:extract` — pulls current Variables into `design-tokens/tokens.json`.
6. `bun run tokens:build` — emits CSS vars and Tailwind extension.
7. `cd figma/plugin && bun run build` — compiles the custom plugin (scaffolded in devmode-bridge, extended here).
8. `bun run storybook:build` — smoke-test the preview.
9. Print a green checkmark summary.

Any failure prints a one-line remedy pointing at the runbook. The script is what CI runs on every PR in a throwaway container.

## 7. Deliverables

### 7.1 Figma file changes

Executed via the custom plugin + MCP `use_figma` Plugin API writes. One scripted run, committed as a reproducible `scripts/figma-bootstrap.ts` so re-running it on a new file yields the same result (idempotent creates, not deletes).

- [ ] All pages from §6.1 created with two-digit prefixes.
- [ ] `00 Cover` populated with version stamp, status pill, maintainer handle placeholder.
- [ ] `01 Changelog` populated with first entry.
- [ ] `02 How to Use` populated with three-step onboarding.
- [ ] `Primitives` Variable collection populated (color ramp, space scale, radius scale, stroke scale, type scale — seed values, no modes).
- [ ] `Semantic` Variable collection populated (surface/text/border roles, referencing Primitives, with **Light** and **Dark** modes).
- [ ] `Component` Variable collection created (empty — filled in C2).
- [ ] `Elevation` Styles created.
- [ ] `Device` Variable collection created with `device/classic-5g/*` stubs reading from `device-reference.json`.
- [ ] `Motion` and `Material` collections provisioned (stubs only).
- [ ] `Foundations / Dimensions` page populated with a swatch frame showing every `device/*` Variable rendered as labeled swatches.

### 7.2 Code changes

- [ ] `figma.config.json` fileKey updated to `UEUmBeQrbJd5gjbUennIg3`.
- [ ] `design-tokens/` directory structure:
  - `design-tokens/tokens.json` — DTCG source of truth.
  - `design-tokens/device-reference.json` — dimensional fidelity source.
  - `design-tokens/.provenance.json` — provenance sidecar.
  - `design-tokens/.provenance-history.jsonl` — append-only log.
- [ ] `scripts/` additions:
  - `scripts/figma-bootstrap.ts` — idempotent file structure creator.
  - `scripts/setup.ts` — portability gate.
  - `scripts/tokens-extract.ts` — Figma → DTCG (extends existing `extract-tokens.ts` if compatible, else new).
  - `scripts/tokens-sync.ts` — DTCG → Figma (extends existing `sync-tokens.ts`).
  - `scripts/tokens-build.ts` — DTCG → Tailwind + CSS vars via Style Dictionary.
  - `scripts/provenance-show.ts` — CLI to query provenance by token path.
  - `scripts/provenance-stamp.ts` — internal helper used by any write path.
  - `scripts/design-back-to-figma.ts` — drawing-board escape hatch.
- [ ] `app/globals.css` — read CSS custom properties from the tokens build output (replaces current hand-authored values for the aspects C1 covers).
- [ ] `tailwind.config.ts` — extend theme from tokens build output.
- [ ] `stories/decorators/physical-reference.tsx` — Storybook decorator for Hardware stories.
- [ ] `stories/hardware/*.stories.tsx` — wrap Hardware stories in the decorator.
- [ ] `figma/plugin/` — extend the existing scaffold with provenance stamping on every write.
- [ ] `package.json` scripts — `setup`, `tokens:extract`, `tokens:sync`, `tokens:build`, `provenance:show`, `design:back-to-figma`, `figma:bootstrap`.
- [ ] `README.md` — "Getting started" section that tells new contributors to run `bun run setup`.

### 7.3 Documentation changes

- [ ] `docs/figma/runbook.md` — add a new Phase 0 titled "Foundations bootstrap (C1)" above the existing Phase 1, describing the `figma-bootstrap` + `tokens:extract` + `tokens:build` sequence.
- [ ] `docs/figma/file-manifest.md` — replace with the final page skeleton from §6.1.
- [ ] `docs/figma/provenance.md` — new file. Explains the provenance model, the CLI commands, and the rules.
- [ ] `docs/figma/dimensional-fidelity.md` — new file. Explains the `device-reference.json` schema, the mm-to-px derivation, and the frozen-by-default rule (enforced in C2).
- [ ] `ENGINEERING_SETUP.md` — updated setup steps.

### 7.4 CI changes

- [ ] `.github/workflows/figma-bridge.yml` — add a job that runs `bun run setup` on a throwaway container and fails if it does not produce a working environment end-to-end.
- [ ] Token freshness check — verify that `design-tokens/tokens.json` matches the output of `tokens:extract` (no drift).
- [ ] Provenance integrity check — verify every entry in `design-tokens/tokens.json` has a matching provenance entry.
- [ ] Storybook build check — runs on every PR.

## 8. Data schemas (schemaVersion 1.0.0 for all)

### 8.1 DTCG tokens.json

Standard W3C DTCG format with project-specific extensions for Dimensional Fidelity:

```json
{
  "$schema": "https://design-tokens.github.io/community-group/format/",
  "color": {
    "primitive": { "blue": { "500": { "$value": "#0969DA", "$type": "color" } } },
    "semantic": { "surface": { "raised": { "$value": "{color.primitive.white.000}", "$type": "color", "$extensions": { "com.figma.modes": ["light", "dark"] } } } }
  },
  "space": { "inline": { "sm": { "$value": "4", "$type": "dimension" } } },
  "radius": { "lg": { "$value": "12", "$type": "dimension" } },
  "device": {
    "classic-5g": {
      "body": {
        "height-mm": { "$value": "{device.classic-5g.body.height-mm.source}", "$type": "dimension", "$extensions": { "com.v0-ipod.unit": "mm", "com.v0-ipod.frozen": true } }
      }
    }
  }
}
```

### 8.2 Provenance schema

See §6.4. Enforced by `scripts/provenance-stamp.ts`. JSON Schema committed to `design-tokens/.schema/provenance.schema.json` and validated in CI.

### 8.3 Device reference schema

See §6.5. Committed to `design-tokens/.schema/device-reference.schema.json` and validated in CI.

## 9. Interfaces

### 9.1 CLI commands (`package.json` scripts)

| Command | Purpose |
|---|---|
| `bun run setup` | Portability gate — zero to working |
| `bun run figma:bootstrap` | Idempotent Figma file structure creator |
| `bun run tokens:extract` | Figma Variables → DTCG |
| `bun run tokens:sync` | DTCG → Figma Variables |
| `bun run tokens:build` | DTCG → Tailwind + CSS vars |
| `bun run provenance:show <token-path>` | History for a token |
| `bun run design:back-to-figma <component>` | Enter drawing-board mode |
| `bun run design:back-to-figma <component> --done` | Exit drawing-board mode |

### 9.2 Plugin UI (extends existing scaffold)

- Status indicator: connected / disconnected / error.
- "Bootstrap file" button — runs `figma-bootstrap` against the current file.
- "Sync from DTCG" button — reads `design-tokens/tokens.json` and writes Variables.
- "Show provenance" button — pulls the provenance log for the currently selected Variable.

## 10. Success criteria

1. `bun run setup` on a clean checkout brings a new machine from zero to a working environment with no manual intervention other than filling in `FIGMA_TOKEN`.
2. `bun run figma:bootstrap` on the live file creates all pages from §6.1 and populates the Cover, Changelog, How to Use, Foundations, and Primitives content.
3. `bun run tokens:extract && bun run tokens:build` produces a `tailwind.config.ts` extension and `app/globals.css` block that, when imported, renders the app visually identical to the current state (no regression).
4. `bun run provenance:show color.surface.raised` returns a non-empty history.
5. `bun run design:back-to-figma click-wheel` creates a hold entry and opens the Figma frame in the browser.
6. Every Hardware Storybook story wraps in the physical-reference decorator and the ruler reads `<mm> (<px>)` at the cursor (with placeholder values until sticky notes are resolved).
7. CI's portability job passes on a throwaway container.
8. Existing Storybook stories still render identically (no regression from the tokens build).

## 11. Sticky notes — user-supplied

See research doc §14 for the full list. Relevant to C1 specifically:

- [STICKY:device-model] Canonical device model (default: iPod Classic 5G). Confirm or override.
- [STICKY:body-height-mm], [STICKY:body-width-mm], [STICKY:body-depth-mm], [STICKY:body-corner-radius-mm] — body dimensions.
- [STICKY:wheel-diameter-mm], [STICKY:wheel-inner-ring-diameter-mm], [STICKY:wheel-center-button-diameter-mm] — click wheel dimensions.
- [STICKY:screen-diagonal-in], [STICKY:screen-resolution-w-px], [STICKY:screen-resolution-h-px], [STICKY:bezel-width-mm] — screen dimensions.
- [STICKY:target-scale-px-per-mm] — render scale factor.
- [STICKY:reference-photos] — reference photo paths or URLs.
- [STICKY:reference-spec-sheet] — source of the real-world dimensions.
- [STICKY:maintainers] — who maintains this file and these specs.
- [STICKY:license] — license for committed reference material.

C1 **does not block on these**. The build treats unresolved sticky notes as warnings, emits `NaN` in dependent Storybook output, and surfaces them loudly in Storybook's toolbar so the user can fill them in after merge. This is by design: the environment must ship before the reference measurements are final.

## 12. Rollback plan

C1 is additive. Every deliverable can be independently reverted:

- **Revert Figma file changes:** the bootstrap script is idempotent and does not delete pre-existing content. Rolling back means leaving the created pages in place (they are empty scaffolds) or manually deleting them from the Figma file.
- **Revert code changes:** standard `git revert` on the C1 merge commit. `figma.config.json` reverts to `PLACEHOLDER_FILE_KEY`, CSS and Tailwind revert to hand-authored values.
- **Revert CI changes:** remove the portability job from the workflow.
- **Disable the drawing-board CLI:** the script is opt-in. No component enters drawing-board mode automatically.

Because C1 does not modify existing components and does not delete anything, rollback carries no data loss risk.

## 13. Relationship to `add-figma-devmode-bridge`

The existing change is not superseded, it is **narrowed** with an addendum:

- Phase 1 (Storybook + Code Connect + Satori raster push) is **kept** as a transitional bootstrap for the C1-to-C2 interim. The raster push continues to work against the live file for components C1 does not yet create natively.
- Phase 1.3 "Bootstrap the canonical Figma file" is **replaced** by C1's `figma-bootstrap` script, which is scripted and idempotent where the old step was manual.
- Phase 1.7 "Token extract + sync" is **replaced** by C1's `tokens:extract` / `tokens:sync` / `tokens:build` pipeline.
- Phase 2 (HMR bridge) and Phase 3 (token round-trip) are **kept** and will be extended by C2–C5.
- The narrowing is recorded as a MODIFIED delta in the C1 OpenSpec proposal, referencing the affected spec sections of the devmode-bridge change.

## 14. Resolved decisions (defaults accepted 2026-04-14)

The six open questions below were resolved by accepting all defaults. They are folded into the OpenSpec proposal as-is and can be revisited in C2+ if any turn out to be wrong in practice.

1. **Device model.** ✅ iPod Classic 5G (2005, 30/60GB, 2.5" LCD) is the canonical reference for C1. Other models deferred to a follow-up change.
2. **Existing `design-tokens/` directory.** ✅ A `design-tokens/` directory is already present as untracked work in the tree. C1 owns its contents and schema — existing scratch contents will be reconciled during implementation, not during proposal scaffolding.
3. **Provenance storage shape.** ✅ Sidecar `design-tokens/.provenance.json` + append-only `design-tokens/.provenance-history.jsonl`. Git-native alternative rejected for C1 on simplicity grounds; revisit in C5 if audit requirements grow.
4. **Figma-bootstrap surface.** ✅ Both a node script (`scripts/figma-bootstrap.ts`) and a "Bootstrap file" button in the plugin UI. The button calls the same underlying library so the two paths cannot diverge.
5. **Sticky-note resolution cadence.** ✅ Warn, do not block. Unresolved `[STICKY:...]` markers surface as warnings in build + Storybook toolbar but do not fail CI in C1. C2 may promote specific stickies to blocking once the environment is proven.
6. **Runbook phase numbering.** ✅ Insert "Phase 0 — Foundations bootstrap (C1)" above the existing Phase 1 in `docs/figma/runbook.md`. Existing phase numbers are preserved.

---

## 15. Self-review notes (filled in during brainstorming spec-review gate)

- **Placeholders:** intentional and clearly marked as `[STICKY:...]`. Not a drafting error — a design decision to unblock the environment ahead of the reference data.
- **Internal consistency:** the aspect layers in §6.2 match the research doc's aspect list; the file structure in §6.1 matches research doc §4.5; the provenance schema in §6.4 matches the description in §3 principle 9. No contradictions.
- **Scope:** focused on foundations only. C2–C5 are explicitly non-goals.
- **Ambiguity:** six numbered open questions in §14 flag the places where a second interpretation exists. Not hidden.

---

**End of C1 design spec.**
