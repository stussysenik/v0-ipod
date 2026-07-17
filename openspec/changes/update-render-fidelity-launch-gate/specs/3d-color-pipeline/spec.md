# 3d-color-pipeline

Scope boundary: this capability owns the *device render* color path — manifest →
materials → live canvas → export. UI chrome tokens (`studio-control-tokens`,
`studio-themes`) are owned by `adopt-studio-control-language` /
`refactor-studio-controls-deterministic` and are out of scope here.

## ADDED Requirements

### Requirement: The canvas SHALL render through a neutral-preserving display transform

The renderer SHALL replace `NoToneMapping` with the Khronos PBR Neutral transform
(`THREE.NeutralToneMapping`), so highlights roll off filmically instead of clipping,
while below the compression threshold (linear peak < 0.76) the transform is identity
minus a shared black-level offset (≤0.04 linear, tapering to 0 at true black) — which
preserves hue and channel order and leaves user-chosen colors perceptually intact
wherever they have radiance headroom above that floor.

> Measured (research charter Q2): applied to *raw albedo* the ≤0.04 linear offset is a
> large *perceptual* shift on dark finishes (6G black `#1b1818` → ΔE ≈ 4.6; charcoal
> `#2D2F34` → ΔE ≈ 9.3) and a small one on mid/light finishes (silver → ΔE ≈ 1.7,
> product-red → ≈ 0). That darkening is correct *radiance* behaviour, not a
> regression: a tonemapper acts on final pixel radiance, and black plastic reading as
> a distinct surface is delivered by specular separation (finish table), while the
> exact picked hex is read off `toneMapped={false}` swatches — never off the albedo.

#### Scenario: Chosen hex survives the transform where it has headroom

- **WHEN** a manifest finish whose linear peak is at or above 0.5 but below the
  compression threshold is put through the CPU port of the Neutral formula
- **THEN** it maps within ΔE2000 ≤ 2 (the imperceptibility bound) of the picked hex,
  asserted by vitest across those finishes

#### Scenario: Hue survives and the black lift is bounded, for every finish below threshold

- **WHEN** any manifest finish with linear peak below the compression threshold —
  including the dark finishes — is put through the transform
- **THEN** all three channels shift by one shared offset in `[0, 0.04]` (so pairwise
  channel deltas, i.e. hue, are invariant), and true black is unchanged, asserted by
  vitest across the full manifest

#### Scenario: Highlights roll off instead of clipping

- **WHEN** a specular highlight exceeds the compression threshold
- **THEN** it compresses toward white smoothly (no hard clip plateau), and light
  intensities are rebalanced so the default rig reads correctly under the new
  transform

### Requirement: Device render color SHALL resolve from a single authority

Every color rendered on the device SHALL derive from the color manifest through
one resolve path (finish parts, screen chrome, stage, export plate) — no hardcoded
hex in material definitions outside it — so live view and export cannot disagree by
construction.

#### Scenario: No orphan hex in the render path

- **WHEN** the device materials and export plate are audited (grep/ast-grep)
- **THEN** every rendered color traces to the manifest or a derivation of it, and a
  test guards the resolve path's coverage

#### Scenario: Live/export parity through the same transform

- **WHEN** a finish is exported
- **THEN** the export pipeline applies the same Neutral transform + sRGB encode as
  the live canvas (extending `three-color-resolve`), verified by the existing export
  continuity tests plus a transform-parity unit test
