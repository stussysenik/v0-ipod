# Tasks — update-studio-theme-authoring

Read `proposal.md` before starting. The defect in §1 is a **spec violation**, not a feature
gap: `openspec/specs/3d-studio-presentation/spec.md` already requires that applying a theme
returns the rig to its saved values. Task 1 reproduces it before anything is designed.

Two rules carry through this change:

- **The preset stays the single definition of itself.** A theme records deviations from a
  preset, never a copy of one. If a task tempts you to store a whole rig, re-read
  `lib/studio-themes.ts:9-14` — the reasoning there is right, it is only incomplete.
- **One pointer, not many booleans.** The default is a single stored id. Any design where each
  theme carries `isDefault` admits two-defaults and zero-defaults states, and both will happen.

- [x] 1. **Red first.** Failing test in `lib/studio-themes.test.ts`: take a rig preset, mutate
      one field away from it, build a theme from that rig, apply the theme, assert the mutated
      field survives. It must fail against today's `rigForTheme` before any fix lands. Name the
      spec clause it violates in the docstring.
- [x] 2. Rig deviation pair in `lib/studio-lighting-config.ts`:
  - [x] 2.1 `diffFromPreset(config, presetName)` → a sparse object holding only fields that
        differ from the named preset. Identical config ⇒ `{}`.
  - [x] 2.2 `applyOverrides(presetName, overrides)` → a full `StudioLightingConfig`. Unknown
        preset falls back to `DESIGNER_DARK_RIG`, matching `rigForTheme`'s existing contract.
  - [x] 2.3 Round-trip property test: `applyOverrides(name, diffFromPreset(c, name))` deep-equals
        `c`, over randomised configs. This is the invariant the whole change rests on.
  - [x] 2.4 Pin the empty case explicitly: a config equal to its preset produces `{}`, so an
        untouched theme keeps tracking future revisions of that preset (spec scenario 3).
- [x] 3. Model change in `lib/studio-themes.ts`:
  - [x] 3.1 `StudioTheme.rig: { name: string; overrides: Partial<StudioLightingConfig> }`,
        replacing `rigName: string`. Keep it a discriminated-free plain record — it is data.
  - [x] 3.2 `rigForTheme` reads through `applyOverrides`. Its signature does not change, so
        every caller keeps compiling.
  - [x] 3.3 `sanitizeTheme` migrates on read: a v1 record with `rigName: string` and no `rig`
        yields `{ name: rigName, overrides: {} }`. A record with neither yields Designer Dark.
        Test both, plus a malformed `overrides` (must degrade to `{}`, never throw).
- [x] 4. Default-theme pointer:
  - [x] 4.1 `STUDIO_DEFAULT_THEME_STORAGE_KEY`, holding one theme id.
  - [x] 4.2 `resolveDefaultTheme(themes, id)` — pure. Returns the named theme, or `NOIR_THEME`
        when the id is absent, empty, or dangling. Test the dangling case; it is spec'd.
  - [x] 4.3 Deleting the default theme leaves the pointer dangling rather than rewriting it,
        so resolution has exactly one place that heals. Test that delete-then-boot yields Noir.
- [x] 5. **Close the coincidence.** Boot resolves the default theme and applies its actions,
      rather than relying on `createInitialIpodWorkbenchModel` independently holding the same
      seven values. Test: mutate `NOIR_THEME`'s case colour in a fixture and assert the booted
      model follows it — today that test would pass while the two sources silently diverge.
- [x] 6. Editing operations in `lib/studio-themes.ts`, all pure, all tested before any UI:
  - [x] 6.1 `renameTheme(themes, id, label)` — preserves position and identity. Rejects
        built-ins. Rejects an empty label.
  - [x] 6.2 `overwriteTheme(themes, id, colors, rig)` — preserves id, label and position.
        Rejects built-ins.
  - [x] 6.3 Test that renaming or overwriting the default theme leaves it the default. This is
        the whole reason identity is preserved rather than delete-and-recreate.
- [x] 7. Shelf UI in `ipod-3d-color-cockpit.tsx`:
  - [x] 7.1 `saveCurrentTheme` captures `diffFromPreset(liveRig, lightingName)`. This requires
        the live rig **value**, not only its name — the component currently receives only
        `lightingName` (line 308). Thread the config through; do not re-read it from storage.
  - [x] 7.2 The default theme is marked in the shelf. A mark, not a sentence — the row already
        carries three swatch dots and a label.
  - [x] 7.3 Commands: "Set default", "Rename", "Save over". Each ≤2 words, each a command
        label, per the voice rule. Icons carry text labels.
  - [x] 7.4 Built-in rows offer none of the three, matching the delete affordance's rule.
- [x] 8. Gates:
  - [x] 8.1 `pnpm vitest run --project unit` green, including the task-1 test now passing.
  - [x] 8.2 `pnpm validate` exits 0.
  - [x] 8.3 `openspec validate update-studio-theme-authoring --strict --no-interactive`.
- [ ] 9. **USER:** visual review of the Themes shelf — it gains a default marker and three row
      commands. State what moved, then stop.

## Decisions on the record

Read these before changing the deviation pair; each cost a measurement or a
rejected alternative.

- **Deviation granularity is the top level**, not the leaf path. Tuning
  `key.intensity` records the whole `key` spec. A leaf diff needs a nested
  partial type and a merge that can half-apply a `position` triple; the property
  that actually matters — an untouched field keeps tracking its preset — holds at
  either granularity. `RigOverrides = Partial<StudioLightingConfig>`, as spec'd.
- **`castShadow: undefined` is why the empty case needed its own test.**
  `sanitizeSpot` writes the key explicitly when neither the stored value nor the
  fallback is a boolean, so a config that has been through storage carries keys a
  preset literal does not. A naive key-count equality reads that as a deviation,
  which would pin every reloaded theme's rig and silently end preset tracking —
  the empty case would have held only until the first reload. `sameValue` treats
  defined-valued keys only. Pinned by "still records nothing after the config has
  been through storage".
- **`applyOverrides` merges through `sanitizeLightingConfig`** rather than
  spreading raw. Overrides arrive straight off localStorage, so the merge has to
  be total: a malformed field heals instead of throwing, and every intensity
  lands inside the clamps that keep a NoToneMapping render off pure white. This
  is also what makes `sanitizeThemeRig` a one-liner — apply, then re-diff drops
  exactly what the sanitizer had to repair.
- **Delete leaves the default pointer dangling on purpose.** Resolution heals in
  exactly one place (`resolveDefaultTheme`). Two places that heal are two places
  that can disagree about what the default became.
- **The shelf marks what boot RESOLVES, not what the pointer holds.** A dangling
  pointer boots Noir, so the shelf marks Noir. Marking the raw pointer would
  reintroduce the same class of disagreement this change removes.
- **Chips became 24px rows.** A saved theme now carries five actions (apply, set
  default, rename, save over, delete) and each has to read as a word, not a
  glyph. The three edit commands sit in an overlay that is transparent at rest,
  so the label keeps the full row width until the pointer or the keyboard
  arrives — and stays tab-reachable either way.
- **Rename focuses via a callback ref, not `autoFocus`.** The input mounts in
  response to the Rename command, so taking focus finishes the gesture rather
  than seizing it on load; `jsx-a11y(no-autofocus)` is correct about the
  attribute and wrong about this case, so the attribute goes rather than the rule.

## Measurements

- `pnpm vitest run --project unit` — 929/929 across 59 files (was 901/901; +28).
- `npx tsc --noEmit` — 0 errors.
- `oxlint` over the four touched source files — 0 warnings, 0 errors.
- `pnpm validate` — exit 0.
- `openspec validate update-studio-theme-authoring --strict` — valid.
- The `vitest` storybook project cannot run here: Playwright's chromium
  headless shell is not installed (`pnpm exec playwright install`). Pre-existing
  environment gap, untouched by this change.
