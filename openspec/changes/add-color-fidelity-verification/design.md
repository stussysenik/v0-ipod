# Design: Color-fidelity verification

## Context

The repo has strong colour *machinery* and no colour *measurement*. This document
records (a) the literature the approach draws on, (b) what was evaluated and rejected,
and (c) the two genuinely hard technical decisions.

## Literature review — applied render & colour science

Curated against this project's actual constraints, not a general PBR survey. Each entry
states what it buys **here**.

### Adopted

**Khronos PBR Neutral Tone Mapper** (Khronos Group, 2024) — the specification behind
`THREE.NeutralToneMapping`, and the CPU port already living at
`lib/three-color-resolve.ts:30`. It was designed explicitly for *product configurators*:
its defining property is that colours below a linear threshold (start-compression
`0.8 - 0.04`, `three-color-resolve.ts:26`) pass through **unchanged**, so a picked hex
survives, while highlights above it roll off instead of clipping. This is the one paper
that speaks directly to this product's promise. Its value to this change is the
**boundary**: it defines exactly where fidelity stops being exact and starts being
compressed, which is what the tolerance table (Requirement 3) encodes. Note the current
renderer is `NoToneMapping`, so today that boundary is "everywhere, until it clips" —
the operator switch is `update-render-fidelity-launch-gate`'s job.

**CIEDE2000** (Sharma, Wu & Dalal, 2005, *Color Research & Application*) — the
colour-difference metric, already implemented at `lib/color-proximity.ts:122`. Adopted
here as the *unit of the fidelity claim*. Its practical virtue over ΔE76 is that it
corrects the blue-region and low-chroma non-uniformities that would otherwise make a
near-black iPod finish look "far" from itself. The paper also publishes the 34-pair
reference test vector set, which is what makes the implementation verifiable rather than
plausible — that is the basis of task §1.

**IEC 61966-2-1 (sRGB transfer function)** — already implemented three times in this
repo (`three-color-resolve.ts:56`, and as luminance linearization in
`color-manifest.ts:293` / `studio-control-tokens.ts:67`). Cited here only to name the
single normative definition the consolidation (§4) collapses toward.

**Google Filament — Physically Based Rendering materials documentation** (Romain Guy &
Mathias Agopian) — the best free applied-PBR reference; the practical companion to the
Frostbite paper below. Relevant to this repo mostly as *validation of existing choices*:
the clearcoat-over-substrate model it describes is already what
`lib/finish-material-table.ts:94-100` encodes for face/ring/wheel, and the back cap and
edge band already run the full metal path. Kept in the review as the reference to consult
when `update-render-fidelity-launch-gate` tunes material response — not as new work here.

### Evaluated and deferred

**AgX** (Troy Sobotka; available as `THREE.AgXToneMapping`) — the natural alternative to
Neutral. Better highlight desaturation and a more filmic response, at the cost of
*measurably more* albedo shift than Neutral, which is precisely the property this product
cannot afford. Deferred, not rejected: once the tolerance table exists, an A/B is cheap
because lighting is already a pure function of the dials, so a tone-mapping dial is a
small, testable addition. **The tolerance table is the prerequisite** — running that A/B
today would be taste-versus-taste with no instrument to settle it. That ordering is the
main reason this change comes first.

**"Moving Frostbite to Physically Based Rendering"** (Lagarde & de Rousiers, SIGGRAPH
2014) — the canonical applied treatment of physical light units and IBL correctness.
Deferred because it answers a question this project has not yet asked: the lighting dials
are currently unitless 0–1, and giving them physical meaning (lux/EV) is a much larger
redesign than the launch gate needs. Worth revisiting only if the shaped-light
compositions work reveals that unitless dials cannot express what the poses need.

**Björn Ottosson — OKLab / okhsl / oklrab posts** (2020–2021) — the perceptual model
underneath the OKLCH palettes already shipping via the manifest. Read for the boundary it
clarifies: OKLab lightness and WCAG relative luminance are *different questions*, and
`isDarkChrome` correctly asks the WCAG one. Informative for §4's requirement that each
luminance model stay separately named rather than merged.

### Rejected

**Full ACES / OpenColorIO pipelines.** Film-production colour management: reference
rendering transforms, view transforms, per-display output transforms. It buys nothing
over Neutral or AgX for a single-product shell renderer targeting sRGB web output, and
costs real complexity in build, review, and mental model. Rejected on essentialism —
the machinery would exceed the problem by an order of magnitude.

**APCA (Accessible Perceptual Contrast Algorithm) replacing WCAG 2.x.** Genuinely better
perceptual contrast prediction, and a live candidate for WCAG 3. Rejected here because
the only consumer is `isDarkChrome` (`lib/shared-ui-tokens.ts:63`), which makes a *binary*
dark/light chrome decision. At a binary threshold the two models agree on essentially every
real case; adopting APCA would add a second contrast authority to a codebase whose stated
discipline is one luminance model. Revisit only if a continuous contrast requirement appears.

**Screenshot/visual-diff regression for colour.** The obvious alternative to a pixel
read-back gate, and rejected deliberately: it is slow, environment-fragile, and would
answer "did the image change" rather than "is this hex correct". It also cannot run in
this environment — Playwright cannot see the WebGL canvas here, which is why the export
E2E specs are statistical in the first place. A numeric read-back answers the actual
question and runs in the cheap channel.

## Decisions

### D1. Where the parity gate reads its pixels

**Options.** (a) Full headless WebGL render in the `unit` project via a real GL context;
(b) test the `ColorResolvePass` shader math on the CPU against known linear inputs;
(c) Playwright E2E driving the live app.

**Rejected (c)** outright — Playwright cannot see this repo's WebGL canvas in this
environment, an already-measured limitation; building the gate there would produce a
permanently red or permanently skipped test.

**Recommendation: (b) as the required gate, (a) as an optional deeper tier.** The
parity-critical transformation is a pure function — linear RGB in, sRGB-encoded bytes
out (`RESOLVE_FRAG`, `three-color-resolve.ts:97-114`). Porting that fragment's math to
a CPU reference and asserting it against the token set gives a fast, deterministic,
node-environment test that goes red on exactly the regression that matters (a dropped or
double-applied transfer function). It fits the existing `unit` project with no new
infrastructure. Its honest limit — it verifies the math, not that the shader is wired
into the capture path — is covered by the existing structural tests plus a single
assertion that `captureHighRes` calls the resolve pass. Option (a) remains open as a
follow-up if that gap ever bites; it should not block the metric landing.

**This mirrors the pattern the repo already validated** in `lib/three-color-resolve.test.ts`,
which pins the CPU port to three r182's GLSL as "the parity anchor". The same technique,
pointed at the resolve shader instead of the tone-map operator.

### D2. What ΔE threshold counts as a pass

Not a single number — a table keyed by luminance band, because the honest answer differs
by regime and a single global threshold would either be vacuous or permanently red.

- Under today's `NoToneMapping`, non-clipping albedo should round-trip at **ΔE00 ≤ 1.0**
  (below the ~1.0 just-noticeable-difference); any larger gap is a real transfer-function
  bug, not a perceptual nicety.
- Under Neutral, colours below the start-compression threshold keep that same budget,
  while above it the requirement becomes *monotonic roll-off*, not equality.
- Dark albedo carries the measured ΔE≤9 offset already recorded for Neutral. The table
  must state whether that is accepted or treated as a defect — **this is the decision the
  reviewer of the launch gate needs and currently cannot make**, and it is the single most
  valuable artifact this change produces.

Thresholds are proposed in the tasks, not fixed here; they get pinned to measured values
once §2 produces numbers, so the table records reality rather than aspiration.

## Open question (out of scope, needs a ruling)

`3d-product-fidelity` requires materials be "albedo-dominant (low metalness and low
environment-reflection intensity)", but the back cap and edge band ship `metalness={1.0}`
(`three-d-ipod.tsx:1431`, `:1441`) as deliberate anodized steel — and a separate
requirement in that same spec, "Edge color composes with finishes and lighting", explicitly
calls for "a real metal zone under the env-first rig". The spec contradicts itself and the
code. Options: (i) narrow the albedo-dominant requirement to the plastic zones it was
written for; (ii) restate it as a *per-zone* material contract. (ii) is likely right, but
it is a fidelity ruling, not a verification one, so it belongs to whoever lands the launch
gate. Recorded here so it is not lost.
