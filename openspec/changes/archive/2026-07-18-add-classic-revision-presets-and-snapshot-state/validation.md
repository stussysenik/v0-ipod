# Validation Notes

## Automated
- `npx playwright test tests/export-preview.spec.ts tests/interactions.spec.ts tests/fidelity-regressions.spec.ts --project=chromium`
- `npx playwright test tests/mobile-usability.spec.ts --project=mobile`
- filtered `npm run type-check -- --pretty false` review for the touched files in this change
- `openspec validate add-classic-revision-presets-and-snapshot-state --strict --no-interactive`

## Manual Visual Sweep
Manual screenshots were generated for each supported preset in both direct `Now Playing` mode and authentic `iPod OS` menu mode.

### `classic-2007`
- Reads as the heaviest front face of the three
- Screen block is slightly larger than the late thin preset
- Wheel still occupies a large share of the lower body without collapsing into the screen

### `classic-2008`
- Intermediate preset reads calmer than 2007
- Gray shell helps avoid hybridizing it with the white 2009 attempt
- Menu state remains consistent with the direct-state geometry

### `classic-2009`
- Cleanest and tightest of the three supported revisions
- Smallest screen block and largest screen-to-wheel breathing room
- Wheel/shadow stack is quieter and less glowy than the earlier implementation

## Gate Outcome
- Export state fidelity is covered by automated tests and verified manually against active preset changes
- Remaining work after this change is no longer architecture or export parity; it is deeper historical fidelity polish if the project wants a still stricter frame match
