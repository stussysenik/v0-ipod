# Change: Pair the colour registry with the lighting registry

## Why

Colour has named targets. Lighting has named rigs. **Nothing pairs them**, and that gap is
already recorded on the board as an unassigned line: *"Cross-registry rule: which rig suits
which finish."*

The consequence is felt directly by the person using `/3d`. To reach a look they dial seven
surface colours and twelve rig parameters free-hand, and the only feedback is the render.
Every measurement this project owns — `lib/color-verdict.ts`, `lib/color-fidelity.ts`,
`lib/color-proximity.ts`, the contrast floor in `lib/studio-control-tokens.ts`, a conformant
CIEDE2000, an exhaustive 16.7M-colour sweep — points one direction: **judging a look after
someone has already guessed at it.** Nothing points the other way.

That is the actual defect. The machinery to say *this pairing is wrong, and here is by how
much* exists and is silent until after the guess. A person dialling twenty parameters with a
silent judge cannot learn what their input does, which is exactly the reported symptom:
*"sometimes I don't know how I'm directly impacting it."*

Some pairings are not a matter of taste. A black case on a dark stage under a rig with no edge
light produces a silhouette that cannot be read — `3d-studio-presentation` already ratifies
"Edge Noir" for precisely this reason, but nothing connects the rule to the case colour that
needs it. A light case under a rig tuned for a dark one drives the wheel label below its
contrast floor. These are measurable failures, and they are reachable in two gestures today.

**This change inverts the machinery: the same functions that verify become the ones that
propose.** It does not judge beauty. It removes the pairings that are measurably wrong, so
what remains is a set the owner chooses from — and shows the reading moving while they
deviate, so the causal link between an input and its result is visible rather than inferred.

## What Changes

- Add `lib/look-pairing.ts`. A **Look** pairs a case finish with a named rig and carries a
  computed **reading**, never an assertion:
  - `finishDelta` — ΔE00 between the rendered case and the finish's attested hex
  - `labelContrast` — wheel-label contrast at both gradient ends, not the midpoint
  - `silhouette` — relative luminance separation between device edge and stage
- `scoreLook(finish, rig, stage)` — pure, returning the reading plus a pass/fail per floor.
  Every floor is stated as a number in `design.md` and cited where it comes from.
- A named Look set, **derived by sweeping the finish × rig product and keeping what passes.**
  The set is generated from the registries, not transcribed, so a new finish or rig extends it
  without an edit.
- A live reading on the surface: while any colour or rig control moves, the reading updates and
  states the direction of travel, not only the current value.
- A pairing that fails a floor is refused as a named Look and states its reading. It remains
  reachable by hand — the person may still want it — but it is never presented as a
  recommendation.

## Impact

- Affected specs: `finish-rig-pairing` (ADDED). `3d-studio-presentation` is untouched: its
  "Edge Noir" requirement states what that rig does, and this change states when it applies.
- Affected code: `lib/look-pairing.ts` (new), reading from `lib/color-manifest.ts`,
  `lib/case-color-presets.ts`, `lib/studio-lighting-config.ts`, `lib/color-verdict.ts`,
  `lib/color-engine.ts`. Surface work in `components/ipod/scenes/ipod-3d-color-cockpit.tsx`.
- Depends on: `add-color-fidelity-verification` reaching 100%. Its measurements are this
  change's inputs, and pairing against an unsettled metric would have to be redone.
- Relationship to the arc: serves act 1 (the object is faithful) by making the faithful
  pairings the reachable ones. It is not an act carrier.
- **Attestation rule applies unchanged.** A Look that pairs an attested finish is a factual
  claim about that finish only. The pairing itself is a measurement, never a heritage claim,
  and a house colour in a Look is labelled house.
- **Moves pixels**, and proposes what the owner sees first. Gates on the owner's review.
