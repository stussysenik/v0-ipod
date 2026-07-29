# Change: The community gallery — the iPods people owned, brought back

## Why

Acts 4 and 5 of the anniversary arc (`add-customizer-decision-log/design.md` §0): *the
document travels*, and *the community is the gallery*.

The product is good on its own and that is precisely the problem — it currently ends at the
edge of one browser tab. A person builds the exact iPod they carried in 2007, and then there
is nowhere for it to go but a PNG. `portable-state.ts` can already encode a complete look into
a link, so the transport exists; what is missing is anywhere to **put** one, and any way to
find someone else's.

For the 25th anniversary (23 October 2026) that gap is the whole opportunity. The interesting
artifact is not one beautiful render — it is a wall of them, each one somebody's actual
device, forkable by the next person.

Two constraints arrive with it, both from the Apple lens (`design.md` §1) and both hard:

- **"Is it the real colour?"** This repo's existing law is that a name asserting hardware must
  read its hex from `authenticFinishes`. A public gallery is exactly where that law would
  quietly break — a custom teal captioned "Product Red" is a false claim about a real product.
  Provenance has to be structural, not a caption.
- **"Is it honest about what it is?"** This is a tribute, not a product. No Apple marks, no
  implied endorsement, no storefront. This is the one place in the arc where the Apple lens
  *constrains* the build instead of expanding it, and it is a gate, not a preference.

## What Changes

- **A local library first.** Saved states persist locally via the existing
  `proof-cache-idb.ts`, alongside the export shelf. Publishing is a separate, explicit act —
  nothing leaves the device implicitly.
- **A published state** is the existing portable payload + its decision log + a proof frame.
  All three already exist; this change gives them an address.
- **Fork, not copy.** Opening a published state yields its decision log, so continuing from
  someone else's work records the fork point structurally. Credit is a property of the data,
  not a social convention.
- **Provenance badge.** Every published state declares, per part, whether its colour is an
  attested hardware finish or a house/custom colour, derived from the existing
  `authenticFinishes` ÷ `case-color-presets` split rather than from what the publisher typed.
- **Gallery browse** — recent, and forked-from — reachable on mobile, since a shared link
  opens in someone's hand first.

## What this change explicitly does not add

- No "Template" type. A template is a published state whose decision log happens to be worth
  continuing; inventing a second entity for it would duplicate the codec and the provenance
  rules. See `design.md` §3.
- No accounts, follows, likes, or feeds. The unit is a state and its lineage.
- No moderation queue beyond report-and-hide. See `design.md` §4 for why the scope stops there.

## Impact

- Affected specs: `community-state-gallery` (ADDED).
- Affected code: `lib/customizer/library.ts` (new), `lib/pocketbase.ts` (extend the existing
  gated client), `lib/ipod-state/portable-state.ts`, `lib/color-manifest.ts` +
  `lib/case-color-presets.ts` (read-only, for the provenance derivation), new gallery route.
- **Depends on `add-customizer-decision-log`** — fork lineage and provenance both read the log.
- Backend posture inherits the existing rule at `lib/pocketbase.ts`: unconfigured in
  production means the feature is **disabled**, never aimed at a default host. That lesson
  was paid for once already — an unset URL previously fired requests at the visitor's own
  laptop on every page load.
- Publishing is outward-facing and irreversible in the way anything public is. The publish
  flow gates on explicit confirmation, and this change gates on the owner's review.
