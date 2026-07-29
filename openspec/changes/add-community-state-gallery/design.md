# Design — the gallery, and the lines it must not cross

Read `add-customizer-decision-log/design.md` §0 (the arc) and §1 (the Apple lens) first. This
document only covers what is specific to making states public.

## 1. Local-first, publish opt-in

The library is local by default — the same IndexedDB the proof cache already uses. Publishing
is a separate, explicit act.

This is not caution for its own sake. It settles three things at once: the feature works with
no backend configured (matching the existing PocketBase posture, where unconfigured in
production means *disabled*); a person's unfinished drafts are never implicitly public; and
because decisions are keyed last-write-wins, a local library and a remote one merge by
**join** rather than by a merge algorithm we would have to design.

That last point is inherited from `customizer-decision-log`'s commutativity requirement, and
it is why the storage decision here is not load-bearing. If PocketBase is later replaced, the
sync semantics do not change.

## 2. Provenance is derived, never declared

The publisher does not get to say whether a colour is authentic. The system computes it, per
part, by asking the same question the manifest already answers: does this hex appear in
`authenticFinishes`?

- Matches an attested finish → labelled with that finish's name.
- Matches a house colour in `case-color-presets.ts` → labelled house.
- Neither → labelled custom.

A caption is free text and can lie; a derivation cannot. This matters more in a gallery than
anywhere else in the product, because a browsing visitor has no way to check. "A constant
whose name asserts a generation must read its hex from `authenticFinishes`" is already this
repo's law — publishing is simply where breaking it would be most costly and least visible.

**Near-misses are the real trap.** A colour 0.4 ΔE00 from Late 2007 Silver is not Late 2007
Silver, and rounding it up to "authentic" would be exactly the nudge-a-measured-value-to-pass
move the colour work exists to forbid. The comparison is exact-hex, and anything else reads
as custom with its measured distance shown. Change the check or rule it custom — never move
the value.

## 3. A template is not a new type

The obvious move is a `Template` entity distinct from a published state. Rejected.

A template *is* a published state whose decision log is worth continuing. Introducing a second
entity would fork the codec, duplicate the provenance derivation, and immediately raise the
question of which one a share link points at. Keeping one entity means "browse the gallery",
"open a share link", and "start from a template" are the same code path with different entry
points — and forking is already expressible, because the log records where you diverged.

This is the same discipline as §4 of the decision-log design: resist adding a structure when a
projection will do.

## 4. The honesty line

This is a tribute to a discontinued product, not a product. Four rules, and they are gates:

1. **No Apple marks or branding**, no logo, no implication of endorsement or affiliation.
   Referring to a finish by the name Apple shipped it under is description, and stays; dressing
   the gallery as an Apple property is not, and does not.
2. **No storefront.** Nothing about a published state may read as offered for sale.
3. **User content is user content.** Engraving text, track metadata, and titles are free-form
   and become public on publish. That needs a report-and-hide path — not a moderation queue,
   which this project has no capacity to staff, but a way for anything to be taken down.
4. **Uploaded artwork does not publish by default.** A user-supplied album cover is very
   likely someone else's copyright. The published payload omits raster artwork unless the
   publisher explicitly includes it, and **records that it was omitted** so a recipient sees a
   deliberate placeholder rather than a state that looks broken.

Rule 4 is the one most likely to be argued away as friction. It should not be: silently
republishing uploaded images to a public gallery is the single clearest way this feature could
harm someone, and the placeholder costs one render path.

## 5. What gets stored

| field | source | why |
| --- | --- | --- |
| payload | `encodePortableState` | already byte-stable, already versioned |
| log | `customizer-decision-log` | fork lineage and "how was this reached" |
| proof frame | `proof-cache` | the gallery tile, already content-addressed |
| provenance | derived (§2) | the badge; recomputed on read, never trusted from the record |
| forkedFrom | id of the opened state | lineage; null for an original |

Provenance is stored for query but **recomputed on display**. A record written before a
manifest correction must not keep asserting the old claim — the manifest is the authority, and
a cached badge would be a second, staler one.
