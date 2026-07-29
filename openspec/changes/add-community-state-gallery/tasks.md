# Tasks — add-community-state-gallery

Read `design.md` §2 (provenance is derived) and §4 (the honesty line) before starting. Both
are gates, not preferences: §2 is this repo's attestation law applied where breaking it would
be least visible, and §4 is the only place in the arc where the Apple lens narrows the build.

**Do not start until `add-customizer-decision-log` has landed.** Fork lineage and provenance
both read the log; building against a placeholder would mean rebuilding both.

- [ ] 1. Local library first — `lib/customizer/library.ts` over the existing
      `proof-cache-idb.ts`. Save, list, open, fork, delete. Must work fully with **no backend
      configured**; verify by running with `NEXT_PUBLIC_POCKETBASE_URL` unset.
- [ ] 2. Provenance derivation — pure, in `lib/customizer/provenance.ts`:
  - [ ] 2.1 Per part: attested (exact match in `authenticFinishes`) / house (match in
        `case-color-presets.ts`) / custom.
  - [ ] 2.2 Test the **near-miss** explicitly: a value ~0.4 ΔE00 from an attested finish
        derives as *custom*, not as that finish. A gate that only checks the exact match is
        not a gate — the near-miss is the case that would actually ship a false claim.
  - [ ] 2.3 Test that a title naming a shipped finish cannot change the derived label.
  - [ ] 2.4 Recompute on display; never read a stored label. Test that correcting a manifest
        value changes a previously stored state's badge.
- [ ] 3. Publish flow:
  - [ ] 3.1 Explicit confirmation that enumerates what becomes public — including which parts
        are custom and whether artwork is included.
  - [ ] 3.2 Artwork omitted by default; the payload records the omission (`design.md` §4.4).
  - [ ] 3.3 Recipient renders a deliberate placeholder for omitted artwork, not a failed load.
- [ ] 4. Extend `lib/pocketbase.ts` for published states, **inheriting its existing posture
      verbatim**: unconfigured in production means disabled, never a default host. Re-read the
      module doc first — that rule was paid for by shipping requests at visitors' own laptops.
- [ ] 5. Lineage: store `forkedFrom`; render the chain on a state's page. An original's field
      is empty, never self-referential.
- [ ] 6. Gallery route — recent, and forked-from. Mobile first at 390×844: a shared link opens
      in someone's hand before it opens on a desktop.
- [ ] 7. Honesty audit against `design.md` §4, as a checklist in the PR, not a claim:
  - [ ] 7.1 No manufacturer marks, logos, or affiliation language on any gallery surface.
  - [ ] 7.2 No purchase, pricing, or ordering affordance anywhere.
  - [ ] 7.3 Report affordance present on every surface showing user-authored text.
  - [ ] 7.4 Upheld report removes the state from public serving.
- [ ] 8. Green tree: `pnpm test:unit`, `pnpm type-check`, `pnpm lint`, story coverage.
- [ ] 9. **Review gate.** Publishing is outward-facing. Demo the full loop — save, publish,
      open from another browser, fork, report — with the owner before it is reachable in
      production. Stop.
