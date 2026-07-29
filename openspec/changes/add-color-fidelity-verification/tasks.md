# Tasks

Ordered so each step is independently verifiable and the metric lands before anything
depends on it. Land §1 before §2 — a tolerance measured with an unverified ΔE is not a
measurement.

## 1. Verify the colour-difference metric

- [x] 1.1 Create `lib/color-proximity.test.ts` — the module has no direct coverage today
- [x] 1.2 Assert `deltaECIEDE2000` against the published Sharma–Wu–Dalal reference pairs
      (the 34-pair set that exercises the blue-region and low-chroma corrections)
      — all 34 pass to 4 decimals via a new Lab-level `deltaE2000Lab` entry point
- [x] 1.3 Assert identity (ΔE00 of a colour against itself is 0) and symmetry
      (ΔE00(a,b) === ΔE00(b,a)) across the manifest finish set
- [x] 1.4 Cover the Lab chain (`rgbToLab`, `hexToLab`) against independently computed
      reference values — an error here is indistinguishable from an error in the formula
- [x] 1.5 Red/green proof: perturb a constant in `deltaECIEDE2000`, confirm the suite goes
      red, restore

## 2. Measure the current envelope (produces the numbers §3 encodes)

- [x] 2.1 Port the `RESOLVE_FRAG` linear→sRGB math (`lib/three-color-resolve.ts:97-114`) to
      a CPU reference function, mirroring the technique `three-color-resolve.test.ts`
      already uses to pin the tone-map port
- [x] 2.2 Run every manifest finish through that reference; record actual ΔE00 per finish
- [x] 2.3 Repeat with `neutralToneMap` applied, to capture the envelope the launch gate's
      operator switch will move the product into
- [x] 2.4 Report both tables in the change before pinning thresholds — thresholds are
      derived from measurement, not chosen in advance

## 3. Publish the fidelity envelope as data

- [x] 3.1 Add a tolerance table module under `lib/` keyed by luminance band, with the
      measured values from §2 and an explicit accepted/compressed marker per band
- [x] 3.2 Record the dark-albedo deviation explicitly (Neutral's measured ΔE≤9 on dark
      albedo) with a stated verdict — accepted compression or tracked defect
- [x] 3.3 Unit-test the table itself: bands are exhaustive, non-overlapping, and every
      manifest finish resolves to exactly one band

## 4. Wire the parity gate

- [x] 4.1 Assert each manifest finish round-trips within its published band tolerance
- [x] 4.2 Negative test: with the transfer function removed, and again with it applied
      twice, the gate fails (this is the regression the gate exists to catch)
- [x] 4.3 Assert the capture path routes through `ColorResolvePass` rather than a raw
      read-back — a structural check, since the pixel math is covered by §4.1
- [x] 4.4 Confirm the whole suite runs in the `unit` project (node env, `lib/**/*.test.ts`)
      with no browser and no visible canvas dependency

## 5. Consolidate the luminance authority

- [x] 5.1 Collapse the duplicate `relativeLuminance` implementations
      (`lib/color-manifest.ts:293`, `lib/studio-control-tokens.ts:67`) to one, keeping the
      model `lib/shared-ui-tokens.ts:63` already defers to
- [x] 5.2 Leave the render linearization (`lib/three-color-resolve.ts:56`) separately named
      — it answers a different question and must not be merged into the contrast model
- [x] 5.3 Document at each site which physical question it answers
- [x] 5.4 Confirm no behaviour change: `finish-material-table`, `shared-ui-tokens`,
      `studio-control-tokens`, and `color-manifest` suites stay green

## 6. Validation

- [x] 6.1 `openspec validate add-color-fidelity-verification --strict --no-interactive`
- [x] 6.2 `pnpm test:unit` green, including the new suites
- [x] 6.3 `oxlint` 0 errors, `tsc --noEmit` 0 errors
- [x] 6.4 Report the measured envelope tables in the change so the launch-gate reviewer can
      rule on the dark-albedo verdict

## Notes for whoever picks this up

- **Ordering matters against `update-render-fidelity-launch-gate`.** That change swaps
  `NoToneMapping` → `THREE.NeutralToneMapping`. This change should land **first** so the
  swap is graded against a measured baseline instead of an impression. If they land
  together, §2.2 and §2.3 give the before/after directly.
- **Do not build this as a Playwright spec.** Playwright cannot see the WebGL canvas in
  this environment — that is why the existing export E2E specs are statistical rather than
  value-comparing. The gate is a node-environment pixel-math test by design.
- **The ΔE2000 implementation already exists** at `lib/color-proximity.ts:122`. Do not
  write a new one; verify the one that ships.
- **Unresolved and deliberately out of scope:** `3d-product-fidelity` requires
  "albedo-dominant (low metalness…)" while the back cap and edge band ship
  `metalness={1.0}` by design. See `design.md` → Open question. Needs a ruling before the
  launch gate archives.

---

## Measured results (recorded so a new session need not re-derive them)

Reproduce any of this with `pnpm fidelity:measure` (exhaustive, ~2 min) or
`pnpm fidelity:measure:quick`. The script self-checks the published table and exits 1 on drift.

### Envelope, all 16,777,216 sRGB colours

| L* band | max ΔE00 · NoToneMapping | max ΔE00 · Neutral | worst colour (Neutral) | published Neutral tolerance |
| --- | ---: | ---: | --- | ---: |
| 0–10 | 0.0000 | 6.1220 | `#1a1a2a` | 6.5 |
| 10–20 | 0.0000 | 11.2889 | `#302e41` | 11.5 |
| 20–30 | 0.0000 | 11.4575 | `#313143` | 11.75 |
| 30–50 | 0.0000 | 10.0915 | `#4c4357` | 10.5 |
| 50–70 | 0.0000 | 6.2517 | `#bc5a49` | 6.5 |
| 70–90 | 0.0000 | 4.2187 | `#ff8d4f` | 4.5 |
| 90–100 | 0.0000 | 3.3959 | `#d2e4ff` | 3.5 |

**Under the shipped `NoToneMapping`, fidelity is exact — ΔE00 = 0 everywhere, not merely
"within 1.0".** The sRGB decode/encode pair is an exact inverse at 8-bit precision (verified
over all 256 channel codes; the chain is channel-independent, so that proves the full cube).
Any nonzero reading is therefore a defect, never a tolerance question. `design.md` D2 proposed
ΔE00 ≤ 1.0 as the budget; measurement says the honest number is 0.

The error under Neutral peaks in the **middle-dark**, not at the darkest end. Neutral subtracts
a linear black offset of at most 0.04; near true black the offset itself tapers (`x − 6.25x²`),
and at high lightness 0.04 linear is negligible in L*. In between, the full offset lands where
L* is still steep in linear light.

### §3.2 ruling — the dark-albedo deviation

Two claims were being conflated. Separated, both have clean answers:

1. **Albedo → rendered pixel** under Neutral deviates up to ΔE00 11.46. **Accepted
   compression.** A tone-mapped render is not supposed to return the albedo; that is what the
   operator is for. Neutral preserves channel *differences* below its threshold, so hue
   survives and only the shadow floor moves.
2. **Live pixel → exported pixel** must be exact, and today is — but only because both paths
   have the operator off. **Tracked, and now gated** (`resolveMatchesRenderer`).

`3d-product-fidelity`'s "Export colour matches live colour — no tone-curve darkening or lift"
should be read as claim 2, not claim 1. As albedo-parity it becomes false the moment any
operator is enabled, for any operator.

### The latent defect this change surfaced

three r182 `getParameters`:

```js
let toneMapping = NoToneMapping;
if ( material.toneMapped ) {
  if ( currentRenderTarget === null || currentRenderTarget.isXRRenderTarget === true ) {
    toneMapping = renderer.toneMapping;   // live canvas only
  }
}
```

The export renders to a plain `WebGLRenderTarget`, so it **always** gets `NoToneMapping`.
`update-render-fidelity-launch-gate` swapping the renderer to Neutral without also setting
`RESOLVE_TONE_MAPPING` would silently diverge exports from the screen by up to ΔE00 11.46.
`ColorResolvePass` now takes the operator as a parameter (default `"none"` = today's exact
behaviour, zero behaviour change) and `resolveMatchesRenderer` fails on any mismatch.

### Defects found and fixed along the way

| what | evidence | where |
| --- | --- | --- |
| `captureFrame` read the linear target raw — the "exports ~2.2 gamma dark" bug, still live on the interaction-recording path (`lib/export/effect-pipeline.ts`) | structural gate | `three-d-ipod.tsx` |
| CIEDE2000 mean-hue branch non-conformant to Sharma eq. 14 | measured max error 1.9e-4 ΔE over 400k Lab pairs — real but far below any threshold | `color-proximity.ts` |
| Lab companding used rounded 0.008856 / 7.787 | only `#111111` moved, by 1.4e-5 ΔE — principled, not impactful | `color-proximity.ts` |
| `deriveWheelColors` amplified chroma: holding HSL `s` across a lightness move preserves a *ratio*, not a pigment | `#F5F5F0` wheel drifted ΔE00-undertone **4.86 → 0.04** after moving the rebuild into Lab | `color-manifest.ts` |
| Wheel labels illegible on every light case | authentic Silver measured **1.82:1** against the manifest's own 3:1 AA-large floor → now solved, 3.05:1 | `color-manifest.ts` |
| Presets mixed invented colours into an attested set; two borrowed Apple product names ("Bondi" = 1998 iMac G3, "Graphite" = Power Mac G4), neither ever an iPod finish | — | `case-color-presets.ts`, cockpit |
| Manifest coherence rule compared cross-generation parts (5G shell vs 6G wheel colorway) under a metric that folds in intended lightness | same-generation reads 2.27, not 3.28 | `color-manifest.json` |

Metric mutation score: **23/24** caught (24 constants perturbed one at a time). The single
survivor — WCAG's 0.03928 knee vs IEC's 0.04045 — is a proven equivalence, not a gap: no 8-bit
code falls between them (10/255 = 0.03922, 11/255 = 0.04314), which is what made the
`relativeLuminance` consolidation a provable no-op.

---

## 7. Follow-ups — resolved, with what each one measured

Read `lib/color-fidelity.ts` and `lib/color-verdict.ts` module docs first — they carry the
reasoning, so this file does not repeat it. Every number below is reproducible from the
repo; nothing here needs re-deriving.

- [x] 7.1 **Stale hand-tuned wheel override — dropped, not restated.** The comment was
      wrong twice over. Its number was stale (`#242020`; the derivation gives `#232020`) and
      its claim — "one step too close to the case" — is contradicted by the hardware. The
      attested 6G black wheel sits ΔE00 **2.27** from its case; the derivation lands at
      **2.51**, i.e. it reproduces the real separation. The override `#313030` sat at
      **7.58**, 3.3× the authentic gap, and was ΔE00 5.29 from the measured 6G wheel
      colorway while the derivation was 2.22 from it. The hand-tune was further from the
      hardware than the maths it was correcting. `ringColor`/`centerColor` are gone from
      `FinishAsset` entirely — with no finish overriding, an optional override field is dead
      surface that invites the next hand-tune.

- [x] 7.2 **Static wheel colorway labels — ruled house, and solved.** Split the colorway
      into what it is: the gradient, border and centre are measured mouldings and are
      untouched; the label is silkscreen chrome. `#8E8E93` is Apple's `systemGray` carried in
      from the iOS palette, sourced to no hardware anywhere in this repo, and it fails the
      floor the manifest sets for itself — **2.66:1** on `via`, **2.99:1** on `from`,
      **2.38:1** on `to`, against 3:1. It is therefore a house value, not a measured one, and
      it gets solved. Anchor and reading are both recorded (`WHEEL_LABEL_ANCHOR`) so the
      decision stays visible rather than becoming a bare constant.

      The item was scoped as dead data and was not. `IPOD_6G_COLORS` in
      `hooks/use-ipod-theme.tsx` was a hand-typed **fourth** copy of the colorway, it is
      rendered, and it had already drifted — dark border/centre `#2c2a2b`/`#3a3838` against
      the manifest's `#2C2C2E`/`#3A3A3C`. It now reads the tokens.

      **The larger defect underneath.** `solveWheelLabel` solved against `gradient.via`
      alone, so every light case passed at the midpoint and failed over the shadowed lower
      third — derived silver measured 3.09:1 at `via` and **2.79:1** at `to`. Every light
      shell in the repo was affected (measured worst per shell: silver 2.74, pearl 2.77,
      5G white 2.80, brass 2.95, moss 2.70). The floor now holds across all three stops.
      Costs 1–3 tone steps on light cases; **no dark case moves at all**, since white
      already clears every stop. A full-cube test pins the worst case at ≥ 3:1.

      The manifest's own gate had the same shape of hole: `contrastPairs` checked the dark
      wheel and only the dark wheel. Both bands are now gated (61/61).

- [x] 7.3 **Two sources for house colours — collapsed onto one.** The overlap was labels,
      not values: five of the six manifest entries were `HOUSE_PRESETS` hexes under
      different names. The sixth was the reason to act — a swatch called **"Silver"** at
      `#D9DADC`, ΔE00 **5.93** from the attested silver-6g, an Apple finish name on a colour
      Apple never shipped, sitting in a picker whose whole proposition is that it does not do
      that. `curatedFavorites.case` is deleted from the manifest; `CASE_CURATED_FAVORITES`
      is now derived from `HOUSE_PRESETS`, filtered to neutrals and ordered light to dark.
      The neutral threshold is not taste: the set is bimodal, neutrals topping out at
      C\* 5.86 (Gunmetal) and chromatics starting at 20.11 (Moss), so C\* ≤ 10 sits in the
      gap. `curatedFavorites.background` stays — backdrops are stage, not hardware, and have
      no attestation to claim.

- [x] 7.4 **Cross-generation surface tokens — made same-generation.** `shell.default`
      (`#1b1818`) is the **5G** black and its note claimed 6G, which that hex has never been.
      Note corrected, `shell.black6g` (`#1c1a1b`) added, and the undertone rule repointed at
      it. The rule now reads **1.42** against a 2.5 ceiling instead of 2.28 — the 0.86
      difference was a generation gap being scored as a pigment difference, which is what the
      old rationale had to apologise for in prose. `shell.default` stays as the default dark
      shell reference and says so.

- [x] 7.5 **Story coverage for `CaseColorReadout`.** Exported (it is pure in its props, so a
      story renders exactly what the cockpit renders) and pinned across all four grades:
      `exact` the attested 6G black, `strong` a lookalike one 8-bit code off Silver at ΔE00
      0.6 that still reports Custom, `workable` a house colour, `poor` the attested 1st–3rd
      Gen White — authentic and still the worst shell in the set to light, at 1.00× headroom.
      That last pairing is the one worth having on screen: authenticity and renderability are
      independent axes and the readout has to show a colour that is both real and bad.

      **The gate was broken and is now real.** `check-story-coverage` was failing on three
      pre-existing orphan stories, and the CI job invoking it (`pnpm figma:check-coverage`)
      referenced a script that did not exist in `package.json` — so the job could not have
      run. Script added, orphans classified (compositions, data showcases, authoring
      surfaces), gate green at 20 in-scope components.

- [x] 7.9 **False provenance on the named case constants** — found while measuring 7.1, and
      larger than anything on the original list. `IPOD_6G_BLACK` held `#1b1818`, which is
      `black-5g` **exactly** (ΔE00 0.00) and ΔE00 1.09 from the attested black-6g.
      `IPOD_6G_SILVER` held `#C8C9CB`, ΔE00 **2.51** from silver-6g and equal to no attested
      finish at all. Both names asserted a generation their values could not support, and the
      cockpit's two headline finishes were built on them — so the app's "Silver", presented
      as a preloaded authentic finish, graded as **Custom** in its own readout. The cockpit's
      silver *swatch* was a third value again, `#D6D8DA`, ΔE00 3.57 from the skin colour it
      applied: the chip did not show the colour it set.

      Both constants now read from `authenticFinishes` via `finishHex`, so a rename or
      removal is a load-time throw rather than a wrong pixel, and a test asserts the
      generation-named constants carry their generation's hex. `IPOD_6G_BLACK` is renamed
      `IPOD_5G_BLACK` — the value was always the 5G black and is pixel-identical. Dead
      duplicates removed (`IPOD_6G_BACKGROUND`, `WHEEL_DARK_*`, `WHEEL_LIGHT_*`).

      **This changes shipped pixels and needs the veto.** The silver shell moves ΔE00 2.51,
      from the tuned `#C8C9CB` to the attested `#C0C0C0`. See §7.7.

      **Recorded doubt, not acted on:** `silver-6g` is `#C0C0C0` — exactly the CSS `silver`
      keyword — and its manifest entry cites no source. `white-1g` `#FFFFFF`, `u2-special`
      `#111111` and `product-red` `#CC0000` have the same character. The attestation layer
      may contain values that were picked rather than measured. That is a data-provenance
      question for the manifest, not a reason to keep an unattested tuned value in front of
      it, and it should be settled before the launch gate claims "attested" as a fact.

- [ ] 7.6 **The AgX A/B, now that the instrument exists.** `design.md` deferred AgX
      explicitly *until the tolerance table existed*. It exists. Add `"agx"` to
      `DisplayTransform` and `TONE_MAP_GLSL`, port the operator, and run `fidelity:measure`
      to get its band table beside Neutral's. That converts a taste argument into two tables.
      Belongs to `update-render-fidelity-launch-gate`, not here.

- [ ] 7.7 **Visual verification — the only thing left that this session cannot do.**
      Everything above is measured, not seen. Three things changed on screen:
      the silver shell moved ΔE00 2.51 to the attested value (§7.9); the black finish's wheel
      lost its hand-tuned ring and is now derived, ΔE00 7.58 → 2.51 from the case, i.e.
      visibly closer to the shell; and wheel labels on every light case darkened 1–3 tone
      steps (§7.2). The cockpit's two swatch rows and Reading panel have also never been
      looked at.

- [x] 7.8 **Albedo-dominant vs `metalness={1.0}` — ruled: per-zone material contract.**
      The spec's own zones already partition cleanly, so the requirement is true everywhere
      it was written about and false only where a *different* requirement in the same spec
      demands metal. Measured from `finish-material-table.ts`: face `metalness: 0.08`
      (`envBase 0.22`), ring `0.0`, wheel `0.0`, glyphs `0.0` — every plastic and anodized
      zone is albedo-dominant as written. Only the back cap and edge band ship `1.0`
      (`three-d-ipod.tsx:1431`, `:1441`), with `envMapIntensity 0.85`, clearcoat 1.0 and
      `STEEL_ROUGHNESS_FLOOR` — a deliberate stainless treatment that the same spec's "Edge
      color composes with finishes and lighting" explicitly calls for as "a real metal zone
      under the env-first rig".

      The ruling costs nothing, which is why it is the right one: at `metalness = 1` three
      zeroes the diffuse term and `color` becomes the specular tint, so a `#000000` back
      reflects nothing and reads black, and a `#FFFFFF` back reads as a mirror-bright steel
      white. Both black-preservation scenarios in `3d-product-fidelity` survive metal
      unchanged — the module doc at `three-d-ipod.tsx:72` already states the mechanism ("kill
      the env and pure metal goes black"). Restate the requirement per zone: albedo-dominant
      for face, wheel, ring, centre and glyphs; env-dominant metal for back cap and edge
      band. Spec text belongs to `update-render-fidelity-launch-gate`; the ruling is settled
      here so that change does not have to re-derive it.
