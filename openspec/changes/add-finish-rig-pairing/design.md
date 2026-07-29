# Design — add-finish-rig-pairing

## D1. What this change claims, and what it does not

It does not judge beauty. It removes pairings that are **measurably wrong**, so what remains is
a set the owner chooses from. Every claim it makes is a reading with a floor attached, and
every floor has a source.

The distinction matters because the alternative — a curated list of "good" combinations —
would be a taste assertion wearing the costume of a measurement, in a repo whose central rule
is that attestation is a factual claim.

## D2. The three metrics

| Metric | Question | Owning module |
|---|---|---|
| `finishDelta` | How far does the *lit* case drift from the finish's attested hex? | `lib/color-proximity.ts` (CIEDE2000) |
| `labelContrast` | Is the wheel label legible at **both** gradient ends? | `lib/color-verdict.ts` |
| `silhouette` | Is the device edge separable from the stage? | `lib/color-engine.ts` (relative luminance) |

Each is computed by the module that already owns it. This change adds no metric. It adds the
product sweep and the floors.

## D3. The floors — one inherited, two to be measured

**`labelContrast` ≥ 3.** Inherited, not invented. WCAG AA-large, declared at
`lib/color-manifest.ts:256`. Measured at both ends of the label gradient, verdict takes the
worse end — the midpoint-only check is a defect this project has already shipped once and
written down.

**`finishDelta` — to be measured, not chosen.** Under `NoToneMapping` the render is exact
(ΔE00 = 0 across the gamut; recorded in the board's CARRY). Under a rig, the lit case is
*supposed* to differ from the flat attested hex — that is what lighting does. So the floor is
not "how close to zero" but "how far is too far before the finish stops reading as itself",
and that number does not exist yet.

Derive it the same way the fidelity envelope was derived: sweep the finish × rig product,
record the ΔE00 distribution, and read the floor off the distribution. **Do not pick a
round number and check that things pass it.** The rule this repo already paid for: never nudge
a measured value to make a check pass — and its corollary, never invent a threshold to make a
set look full.

**`silhouette` — to be measured.** No constant exists. `3d-studio-presentation` ratifies
"Edge Noir" on the grounds that "device edges render visibly brighter than the stage", which
is a qualitative statement of exactly this metric. Derive the floor from the pairings that
requirement was written about: the black-case-on-dark-stage cases it names must pass, and the
unlit black-on-dark case it was written to exclude must fail. A floor that admits the excluded
case is wrong regardless of what the distribution says.

## D4. Why the set is swept rather than written

A transcribed list is a copy, and a copy drifts from its source. Sweeping the registry product
means a finish added to the manifest, or a rig added to `RIG_PRESETS`, is scored on the next
run with no edit anywhere. This is the same reasoning that makes `PRELOADED_FINISHES` derive
from the manifest rather than restating it.

The sweep is small — the finish count times the rig count — so it runs in the test suite
rather than as a separate script.

## D5. Live reading, and why direction is part of it

A value that only shows its current state answers *what is true*. It does not answer *what did
I just do*. The reported symptom is the second question, so the reading carries the
pre-gesture value and the delta from it.

This is the same structure the colour cockpit already uses for the case swatch — `previousCase`
held in component state, "a fact about this editing session, not about the device"
(`ipod-3d-color-cockpit.tsx:322-325`). Extend that pattern; do not invent a second one.

## D6. Open question for the owner

Whether a refused pairing is *hidden* from the named set or *shown greyed with its reading*.
Hiding is cleaner. Showing teaches the constraint, which is the point of a live reading. The
spec requires only that a refused pairing is not recommended and stays reachable by hand;
either presentation satisfies it. This is a pixel decision and gates on review.
