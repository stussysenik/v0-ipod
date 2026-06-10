# Design — /3d Export Reliability + Authentic Look

## Evidence base (measured live, 2026-06-10)

| Experiment | Result |
|---|---|
| 60s export, stride 15 (~300ms between bakes) | 94–113 / 120 bakes blank |
| 20s export, stride 5 (~100ms between bakes), ×2 runs | 0 / 120 blank |
| 20s export with stride forced to 15 | 25 / 32 blank → **interval is the trigger** |
| flushSync(UPDATE_CURRENT_TIME) disabled | still 113/120 blank → React commit race **refuted** |
| 3D transforms flattened + CSS animations killed during bake | still 102/120 blank → foreignObject-3D hypothesis **refuted** |
| Blank-probe + 1 immediate warm retry | **94/94 repaired, 0/120 final blanks** |

Conclusion: Chromium's foreignObject rasterization goes cold after long
main-thread/GPU-saturating stretches; an immediate warm retry always painted.
Do not "fix" by tightening the bake stride (that re-creates the screen-freeze
bug 78ebe51 solved); guard the bake instead.

## Decisions

### D1 — Bake guard, not bake rewrite (landed)
`rasterizeWithBlankRetry(rasterize, probeBlank, opts)` in
`lib/screen-bake-guard.ts`: DI-style pure policy (unit-testable in node),
DOM probe (`probeDataUrlBlank`) samples the central 48×32 of a 64×64
downsample — excludes status bar/footer which paint even on blank bakes.
Threshold 40 (real content ≈ 3000 variance, blanks = 0; false positives only
cost a retry, never corrupt output). On exhausted budget → `null` → caller
holds last good texture. Rejected alternative: canvas-2D screen compositor
(deterministic but duplicates the iPod OS design in a second renderer —
fidelity drift risk; revisit only if the guard ever proves insufficient).

### D2 — Lighting / material decoupling
Problem: "lights off" flips the polished steel back gray→black. Physically a
metal with `metalness: 1.0` is black without an environment; productwise the
user is right: a *technical flat view* must present albedo. Decision: the
technical-flat rig swaps materials to a flat-shaded presentation set
(MeshBasicMaterial clones carrying each surface's albedo) rather than zeroing
lights on PBR materials. PBR rigs (Apple, Designer Dark) keep physical
behavior. Invariant: **a rig change must never read as a material change**.
`deriveOwnedRig` stays (it shapes light *energy*), but add a regression test:
rendered mean hue/lightness of each surface under every rig stays within a
perceptual tolerance of its albedo.

### D3 — Authentic finishes as the default combinations
Source of truth: `scripts/color-manifest.json` `authenticFinishes` (10
generations, with wheelVariant light/dark + material notes) → typed exports in
`lib/color-manifest.ts`. COMBINATIONS strip lists exactly these; current
fantasy looks (Bondi/Crimson/…) are removed from defaults (they may return
later behind a "concept" group, not default). Material parameters per finish:
anodized aluminum (clearcoat 0.08, roughness ~0.52 + brushed map, metalness
~0.08–0.1, envMapIntensity 0.18–0.28), polished steel back (metalness 1.0,
roughness ≥ STEEL_ROUGHNESS_FLOOR 0.13), 5G-era polycarbonate (dielectric,
higher clearcoat, no brush). Port the moonbit silver-assembly wheel-gradient
constants (`origin/moonbit-version:ipod/color.mbt`) as TS data.

### D4 — Outline removal + Cartoon toggle
The black bezel "outline" look reads cartoon-ish in the realistic render.
Realism mode: contour comes from *light* (rim/edge highlights), never from
painted dark lines. New decoupled `cartoon` boolean in studio state (its own
reducer key, own history entries, own URL/persistence field): when on, apply
the full cel treatment (outlines + flattened shading, Jet Set Radio energy) —
one extra dimension of possibility, fully separated.

### D5 — Light as the outliner
- Key: oval softbox (Lightformer `form: "ring"`/scaled circle) front-center —
  the principal reflection on the face, replacing the big rectangular field.
- Rim pair grazing the chassis edges so the silhouette is drawn by light
  ("detail light"), tuned per case luminance (dark case → brighter, tighter
  rims; light case → deeper dark panel) — extends `studio-owned-finish.ts`
  invariants I2/I4.
- High-contrast dark-device rig: black must read black with specular bite,
  not washed gray.
- Color purity: neutral surfaces must not pick up hue from warm/cool lights —
  clamp light saturation contribution on near-neutral albedos (test: render
  black/silver under every rig, assert chroma of sampled body pixels < ε in
  OKLCH).

### D6 — OKLCH everywhere derivation happens
`deriveWheelColors` / related-shade strips move from RGB/HSL math to OKLCH
(`culori` or hand-rolled ~40-line conversion; no heavy dep). Perceptually even
lightness ladders; chroma-preserving shades for saturated cases; correct
handling of near-black (no banding to pure black).

### D7 — XState central machine (port from feat/architecture-evolution)
Export lifecycle becomes a first-class machine:
`idle → preparing → rendering(progress) → encoding → saving → idle | error`.
Guards: single concurrent export; cancellation; veil state derived from
machine state (no ad-hoc `exportState` string unions). The branch's
`lib/xstate/central-machine.ts` (377 lines) is the starting point; cherry-pick
machine + store, NOT its workbench rewrite (conflicts with newer cockpits).
UnoCSS/vanilla-extract adoption rides the same cherry-pick **only for the /3d
cockpit surfaces** — repo stays Tailwind elsewhere; do not convert existing
styles wholesale.

### D8 — History tree (simple)
`lib/studio-history.ts`: append-only nodes
`{ id, parentId, timestamp, action, snapshotHash }` recorded from the studio
reducer via middleware; branching occurs naturally when dispatching after an
undo (undo-tree semantics). Persist last N=500 nodes to localStorage;
PocketBase sync optional later. UI: minimal — undo/redo + a flat "recent
states" list; no graph visualization yet (keep it useful and simple).

### D9 — Song clock contract
`clipSongSecond` already maps clip progress → song seconds cycling modulo song
duration; the spec pins it: for ANY clip length, the rendered screen's
elapsed-time label at clip end equals `baseTime + durationSec` (mod song),
and the continuity e2e asserts screen motion in every third of the clip.

## Risks

- Warm-retry guard is empirical, not a Chromium contract — mitigated by
  hold-last-good (worst case: a briefly frozen screen, never a dead one).
- Technical-flat material swap must restore PBR materials exactly
  (reuse the capture `restore()` pattern with a registry, not ad-hoc fields).
- XState port touches the stage's hot path — land behind the machine with the
  existing e2e suite green before deleting the old state strings.
