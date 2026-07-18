# Change: Color-fidelity verification — make "the hex survives to the pixel" a measured claim

## Why

`3d-product-fidelity` already requires that an exported surface colour match the live
view "no tone-curve darkening or lift". That requirement has **no instrument**. It is
qualitative prose, and nothing in the repo tests it:

- **No test asserts an exported pixel equals a token colour.** The two export-adjacent
  E2E specs are statistical only — `tests/3d-clip-verify.spec.ts:180-184` measures the
  *fraction* of blown/crushed pixels (`blackClip < 0.16`, `whiteClip < 0.25`), and
  `tests/3d-export-continuity.spec.ts` frame-diffs to prove the screen animates. Neither
  compares a rendered pixel to an expected hex. The only value-level colour test,
  `lib/three-color-resolve.test.ts:135`, is a **CPU round-trip** through `neutralToneMap`
  that never touches a real render or an exported PNG.
- **The measuring instrument already exists and is itself untested.** A full CIEDE2000
  implementation sits at `lib/color-proximity.ts:122` (`deltaECIEDE2000`), alongside
  `rgbToLab:105` / `hexToLab:109`. There is no `lib/color-proximity.test.ts` — the ΔE
  authority the whole product's colour claims would rest on has zero direct coverage.
- **Three independent implementations of the same physics.** Relative luminance is
  hand-rolled twice (`lib/color-manifest.ts:293`, `lib/studio-control-tokens.ts:67`) and
  sRGB linearization a third time (`lib/three-color-resolve.ts:56`). `lib/shared-ui-tokens.ts:63`
  deliberately defers to `studio-control-tokens` so there is "one luminance model, not
  two" — that discipline is correct and is silently violated one module over.

This matters because the render *is* the portfolio artifact. The product's central colour
promise — pick any hex, get that hex, in the live view and in the file you share — is
currently an assertion in a comment (`three-d-ipod.tsx:2686-2691`) and in spec prose,
defended by nothing executable. When `update-render-fidelity-launch-gate` swaps
`NoToneMapping` for Khronos Neutral, that promise changes shape in a way no existing
test can detect: Neutral passes colours below linear 0.76 through unchanged and rolls off
above it, so the fidelity claim becomes *conditional on luminance* and needs a measured
boundary, not a slogan.

This change adds the instrument. It ships no new render features.

## What Changes

- **Promote ΔE2000 to a tested, first-class colour-difference authority.** Direct unit
  coverage for `deltaECIEDE2000` and the Lab conversion chain against published CIEDE2000
  reference pairs (the Sharma–Wu–Dalal test vectors), so every downstream tolerance claim
  rests on a verified metric rather than an unexercised one.
- **Add an executable export-parity gate.** A test that renders known token finishes,
  reads back the exported pixels through the real `ColorResolvePass`
  (`lib/three-color-resolve.ts:118`) path, and asserts ΔE2000 between the exported pixel
  and the source token hex stays under a stated threshold — per finish, on flat-lit
  surfaces where albedo governs. This converts `3d-product-fidelity`'s "Export colour
  matches live colour" scenario from prose into a number that can go red.
- **State the fidelity envelope as data, not adjective.** A published per-luminance-band
  tolerance table: which colours are guaranteed exact, which are guaranteed within a
  stated ΔE, and where the operator legitimately compresses. This is what makes the
  coming Neutral switch reviewable — Neutral was already measured at
  ΔE≤9 on dark albedo, and today nothing records whether that is acceptable or a defect.
- **Consolidate to one luminance/transfer authority.** Collapse the duplicate
  `relativeLuminance` implementations behind the single model `shared-ui-tokens` already
  defers to, keeping the WCAG contrast model and the render-linearization model explicitly
  separate and each named — one function per physical question, not three near-copies.

## Non-Goals

- **No tone-mapping operator change.** Swapping `NoToneMapping` → `THREE.NeutralToneMapping`
  is owned by `update-render-fidelity-launch-gate` and is deliberately left there. This
  change supplies the measurement that gate's colour work should be graded against; if the
  two land together, this one lands first.
- **No new materials, clearcoat work, or lighting features.** Clearcoat is already applied
  across face, ring, wheel, back cap, edge band, and glass (`lib/finish-material-table.ts:94-100`);
  material response is `update-render-fidelity-launch-gate`'s territory.
- **No AgX, ACES, or OCIO adoption.** See `design.md` — evaluated and deferred/rejected
  with reasons.
- **No APCA migration.** The WCAG contrast model in `lib/studio-control-tokens.ts` is the
  right weight for a binary dark/light chrome decision.
- **No browser-driven visual verification.** Per the project's testing cadence, the gate
  is a headless pixel read-back, not a screenshot review.

## Impact

- Affected specs: `color-fidelity-verification` (new)
- Affected code: `lib/color-proximity.ts` (+ new `lib/color-proximity.test.ts`),
  `lib/three-color-resolve.ts` (parity harness seam), `lib/color-manifest.ts` and
  `lib/studio-control-tokens.ts` (luminance consolidation), new fidelity-envelope module
  + test under `lib/`
- Verification: `vitest --project unit` (`vitest.config.ts:26-32` globs `lib/**/*.test.ts`).
  The export-parity read-back needs a WebGL context; see `design.md` for the headless
  strategy and its fallback, noting a measured environment limitation — Playwright cannot see
  the canvas in this environment, so this must not be built as a Playwright spec.
- Open question for review: `3d-product-fidelity` requires materials be "albedo-dominant
  (low metalness and low environment-reflection intensity)", but the back cap and edge band
  ship `metalness={1.0}` (`three-d-ipod.tsx:1431`, `:1441`) — deliberately, as anodized
  steel. Spec and code contradict. Resolving it is out of scope here but should be settled
  before the launch gate archives; `design.md` records the options.
