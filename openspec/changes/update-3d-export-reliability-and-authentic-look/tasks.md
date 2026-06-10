# Tasks — update-3d-export-reliability-and-authentic-look

## 0. Landed in the proposing session (2026-06-10)

- [x] 0.1 Root-cause blank exports (evidence table in design.md)
- [x] 0.2 `lib/screen-bake-guard.ts` — blank probe + warm-retry policy
- [x] 0.3 Unit tests `lib/screen-bake-guard.test.ts` (11 tests, green)
- [x] 0.4 Wire guard into `bakeNodeOnto` (hold-last-good on persistent blank)
- [x] 0.5 Verify live: 60s export, 0/120 blank bakes (was 94–113/120)
- [x] 0.6 Playwright `outputDir` → OS tmp (kills dev rebuild-loop → 500 → blank page)

## 1. Branch consolidation (do FIRST in the next session)

- [x] 1.1 Merge `feat/3d-owned-finish` → `main` (fast-forward; main has no extra commits)
- [x] 1.2 Delete merged branch pointers: `feat/3d-studio-control-suite`,
      `feat/3d-studio-marquee-light-lock`, `feature/ipod-3d-focus` (already in main)
- [x] 1.3 From `feat/architecture-evolution` cherry-pick ONLY:
      `lib/xstate/central-machine.ts`, `lib/xstate/store.tsx`, `uno.config.ts`,
      `unocss.d.ts`, `components/ipod/export/export-progress-overlay.tsx`,
      `lib/export/effect-pipeline.ts` (review each; do NOT take the workbench rewrite)
      — review verdicts: `export-progress-overlay.tsx` taken (idle stage typed, `as any`
      removed); central-machine + store taken as the adapted export machine in 2.1/2.2
      (verbatim port doesn't compile against main's model layout and would duplicate
      `ipodWorkbenchReducer`); `effect-pipeline.ts` REJECTED (depends on ten
      `export-utils` helpers that only exist in the branch's workbench rewrite + the
      `effect` dep; /3d export path already covered by `three-clip-recorder`);
      `uno.config.ts`/`unocss.d.ts` REJECTED for now (no cockpit conversion is tasked
      in this change; inert config + a global attributify type augmentation would
      weaken TSX prop checking repo-wide; branch remains on origin for later adoption)
- [x] 1.4 Extract material constants from `origin/moonbit-version:ipod/color.mbt`
      into `lib/color-manifest.ts` (never merge that branch — unrelated history)
      — wheel colorway bands + dark/mid/light gradient sets landed as typed data;
      finish material classes (polycarbonate vs anodized) added per generation
- [x] 1.5 Push consolidated `main`; subsequent work branches off main

## 2. 3d-export-reliability

- [x] 2.1 TDD: machine spec test first — `lib/xstate/export-machine.test.ts`
      (idle→preparing→rendering→encoding→saving→idle; error path; re-entrancy guard)
      — 6 tests incl. stale-callback immunity after RESET
- [x] 2.2 Port/adapt XState central machine; drive `Ipod3DExportState` veil from it
      — landed as `lib/xstate/export-machine.ts` (setup() pattern matching
      color-machine); veil + dock derive from the snapshot via exportJobOf/exportProgressOf
- [x] 2.3 Replace `exportState` string unions in `ipod-3d-stage.tsx` with machine state
      — useActorRef/useSelector; PREPARED/PROGRESS/ENCODED/SAVED/FAIL/RESET sent at
      pipeline milestones; RESET in finally guarantees the veil can never wedge
- [x] 2.4 Keep song-clock contract: screen elapsed label cycles the FULL clip
      duration (unit: `clipSongSecond` end-of-clip property test) — property test over
      10 durations × 4 base times × 3 song lengths
- [x] 2.5 e2e: extend `tests/3d-export-continuity.spec.ts` with a blank-screen
      assertion (per-frame screen-region variance > threshold for sampled frames)
      — 12 sampled frames, screen-region luma spread ≈192 vs floor 40; plus a
      console guard that hold-last-good never fired
- [x] 2.6 e2e: two consecutive exports in one session both download (Chrome
      multi-download policy needs a user gesture per export — verify via Playwright)
      — verified green: both rounds download and the machine returns to idle
- [x] 2.7 Run `pnpm test:exports` + continuity green on main — continuity 2/2 passed (1.1m)

## 3. 3d-authentic-finish

- [ ] 3.1 Type + export `authenticFinishes` from `scripts/color-manifest.json`
      into `lib/color-manifest.ts` (incl. wheelVariant, material class per finish)
- [ ] 3.2 TDD: finish→material mapping unit tests (aluminum vs polycarbonate vs steel
      params per generation)
- [ ] 3.3 COMBINATIONS strip = authentic lineup only (Silver/Black 6G·7G, White/Black
      5G, U2, PRODUCT(RED), Charcoal 7G); remove fantasy looks from defaults
- [ ] 3.4 Edges color: constrain to case color family (derive via OKLCH from case;
      free override stays in Edges control, but presets never ship white-on-black)
- [ ] 3.5 Remove black outline from realistic render path
- [ ] 3.6 Add decoupled `cartoon` toggle (own state key, own persistence): cel-shade
      treatment (outlines + flattened ramp) — full Jet-Set-Radio commitment when on
- [ ] 3.7 OKLCH shade derivation for related-shade strips + wheel derivation
      (replace HSL math; property test: monotonic perceptual lightness ladder)
- [ ] 3.8 Visual verify on FlowDeck/simulator: Black 6G, Silver 6G, White 5G, RED

## 4. 3d-lighting-determinism

- [ ] 4.1 TDD: albedo-invariance test — sampled body pixels keep hue/lightness within
      tolerance across rig switches (lights on/off/dark) for black + silver + steel back
- [ ] 4.2 Technical-flat rig presents albedo via flat-material swap (restore registry),
      not zeroed PBR lights — steel back must stay gray with lights off
- [ ] 4.3 Oval front softbox as principal face reflection (replace rectangular field)
- [ ] 4.4 Contour rim pair grazing chassis edges; intensity derived from case
      luminance (extend `studio-owned-finish.ts` invariants, unit-test the derivation)
- [ ] 4.5 High-contrast dark rig for black devices (black reads black, specular bite)
- [ ] 4.6 Color-purity clamp: near-neutral albedos pick up < ε OKLCH chroma from
      warm/cool lights (unit + rendered sample test)
- [ ] 4.7 Export WYSIWYG check: same rig → still/clip pixels match live (existing
      ColorResolvePass path) after lighting changes

## 5. 3d-screen-fidelity

- [ ] 5.1 Battery glyph: authentic 3D gradient treatment (gloss highlight, body
      gradient, capsule depth) matching real iPod OS — update `screen-battery.tsx`
      + stories
- [ ] 5.2 Control wiring audit: every Color cockpit control provably drives its
      surface (Storybook/interaction test or e2e: set hex → assert material color)
- [ ] 5.3 Marquee/title/album text fidelity pass against reference photos

## 6. 3d-state-history

- [ ] 6.1 TDD: `lib/studio-history.test.ts` — append, branch-on-dispatch-after-undo,
      bounded persistence (N=500), provenance fields
- [ ] 6.2 `lib/studio-history.ts` + reducer middleware recording every studio dispatch
- [ ] 6.3 Minimal UI: undo/redo + recent-states list in the Studio cockpit
- [ ] 6.4 Persist to localStorage; (optional, later) PocketBase sync

## 7. Wrap-up

- [ ] 7.1 `openspec validate update-3d-export-reliability-and-authentic-look --strict --no-interactive`
- [ ] 7.2 Full suite: `pnpm validate && pnpm test`
- [ ] 7.3 Archive change after deployment (`openspec archive <id>`)
