# Tasks

Ordered so each step is independently verifiable and the metric lands before anything
depends on it. Land §1 before §2 — a tolerance measured with an unverified ΔE is not a
measurement.

## 1. Verify the colour-difference metric

- [ ] 1.1 Create `lib/color-proximity.test.ts` — the module has no direct coverage today
- [ ] 1.2 Assert `deltaECIEDE2000` against the published Sharma–Wu–Dalal reference pairs
      (the 34-pair set that exercises the blue-region and low-chroma corrections)
- [ ] 1.3 Assert identity (ΔE00 of a colour against itself is 0) and symmetry
      (ΔE00(a,b) === ΔE00(b,a)) across the manifest finish set
- [ ] 1.4 Cover the Lab chain (`rgbToLab`, `hexToLab`) against independently computed
      reference values — an error here is indistinguishable from an error in the formula
- [ ] 1.5 Red/green proof: perturb a constant in `deltaECIEDE2000`, confirm the suite goes
      red, restore

## 2. Measure the current envelope (produces the numbers §3 encodes)

- [ ] 2.1 Port the `RESOLVE_FRAG` linear→sRGB math (`lib/three-color-resolve.ts:97-114`) to
      a CPU reference function, mirroring the technique `three-color-resolve.test.ts`
      already uses to pin the tone-map port
- [ ] 2.2 Run every manifest finish through that reference; record actual ΔE00 per finish
- [ ] 2.3 Repeat with `neutralToneMap` applied, to capture the envelope the launch gate's
      operator switch will move the product into
- [ ] 2.4 Report both tables in the change before pinning thresholds — thresholds are
      derived from measurement, not chosen in advance

## 3. Publish the fidelity envelope as data

- [ ] 3.1 Add a tolerance table module under `lib/` keyed by luminance band, with the
      measured values from §2 and an explicit accepted/compressed marker per band
- [ ] 3.2 Record the dark-albedo deviation explicitly (Neutral's measured ΔE≤9 on dark
      albedo) with a stated verdict — accepted compression or tracked defect
- [ ] 3.3 Unit-test the table itself: bands are exhaustive, non-overlapping, and every
      manifest finish resolves to exactly one band

## 4. Wire the parity gate

- [ ] 4.1 Assert each manifest finish round-trips within its published band tolerance
- [ ] 4.2 Negative test: with the transfer function removed, and again with it applied
      twice, the gate fails (this is the regression the gate exists to catch)
- [ ] 4.3 Assert the capture path routes through `ColorResolvePass` rather than a raw
      read-back — a structural check, since the pixel math is covered by §4.1
- [ ] 4.4 Confirm the whole suite runs in the `unit` project (node env, `lib/**/*.test.ts`)
      with no browser and no visible canvas dependency

## 5. Consolidate the luminance authority

- [ ] 5.1 Collapse the duplicate `relativeLuminance` implementations
      (`lib/color-manifest.ts:293`, `lib/studio-control-tokens.ts:67`) to one, keeping the
      model `lib/shared-ui-tokens.ts:63` already defers to
- [ ] 5.2 Leave the render linearization (`lib/three-color-resolve.ts:56`) separately named
      — it answers a different question and must not be merged into the contrast model
- [ ] 5.3 Document at each site which physical question it answers
- [ ] 5.4 Confirm no behaviour change: `finish-material-table`, `shared-ui-tokens`,
      `studio-control-tokens`, and `color-manifest` suites stay green

## 6. Validation

- [ ] 6.1 `openspec validate add-color-fidelity-verification --strict --no-interactive`
- [ ] 6.2 `pnpm test:unit` green, including the new suites
- [ ] 6.3 `oxlint` 0 errors, `tsc --noEmit` 0 errors
- [ ] 6.4 Report the measured envelope tables in the change so the launch-gate reviewer can
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
