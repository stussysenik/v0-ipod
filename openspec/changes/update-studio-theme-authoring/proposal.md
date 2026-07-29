# Change: A saved theme is an editable record, not a snapshot

## Why

Three defects, one cause: `StudioTheme` describes a look but does not behave like a document.

**1. The rig does not survive a save — this contradicts a ratified requirement.**
`3d-studio-presentation` → "Savable Studio Themes" requires that applying a saved theme
returns "all seven surface colors **and the rig**" to the saved values. `saveCurrentTheme`
stores `rigName` only (`components/ipod/scenes/ipod-3d-color-cockpit.tsx:358`), and
`rigForTheme` re-clones the pristine preset out of `RIG_PRESETS`
(`lib/studio-themes.ts:72`). Tune the lighting, save the theme, re-apply it: the seven
colours return and the tuning is gone, with no notice. The accepted scenario reads "changes
colors, then applies" — it exercises the colour path and never the rig path, so the gate has
been passing on the case that works. That is this project's recurring defect shape, already
written down: *a gate that checks only the passing case is not a gate.*

**2. No theme is the default.** `StudioTheme` carries no field naming which look boots. Noir
arrives on first load by coincidence — `createInitialIpodWorkbenchModel` happens to hold the
same seven values that the `NOIR_THEME` record holds. Two independent sources of one fact,
with no link between them. Edit either and the accepted scenario "fresh visitor sees the noir
hero look" begins passing for the wrong reason, or fails for an invisible one.

**3. A theme cannot be edited.** The shelf offers apply, save-new, delete. Changing one colour
in a saved theme means apply → tweak → save-new → delete-old, and the survivor is named
"Theme 04". Labels are auto-assigned by `nextThemeLabel` and there is no way to change one.
The most common intent — *change one colour in a look I already like* — is the one path the
surface does not have.

The module doc-comment defends rig-by-name: "persisting a full rig copy inside every theme
would fork the truth". That reasoning is correct for a **preset** rig and has no answer for a
**tuned** one. Name plus sparse overrides keeps both properties — the preset remains the single
definition of itself, and the deviation from it becomes the theme's own data.

## What Changes

- **`StudioTheme.rig` becomes `{ name, overrides }`** — the preset name plus only those fields
  that deviate from it. A theme saved on an untouched preset stores an empty `overrides` and
  behaves exactly as it does today, so the existing Noir record is unchanged in meaning.
- **A single `defaultThemeId` pointer**, stored beside the theme list rather than as an
  `isDefault` boolean on each record. A boolean per record admits a state where two records
  claim the default and one where none does; a pointer cannot express either. Boot resolves
  the default theme and applies it, so `3d-studio-presentation`'s Noir scenario is satisfied
  by a link instead of a coincidence.
- **Rename and save-over-existing.** The delete affordance is unchanged.
- **The shelf marks which theme is the default** and offers a command to set it.
- **Migration on read.** A persisted v1 theme with a bare `rigName: string` reads as
  `{ name: rigName, overrides: {} }`. No stored data is lost and no write is required to
  upgrade.

## Impact

- Affected specs: `3d-studio-presentation` — "Savable Studio Themes" is MODIFIED (the rig
  clause gains the tuned case, and the record gains identity and editing); "Noir Factory
  Default Presentation" is MODIFIED (the default becomes a resolved pointer rather than a
  coincidence). One requirement is ADDED for theme editing.
- Affected code: `lib/studio-themes.ts`, `lib/studio-lighting-config.ts` (a diff/merge pair
  against a preset), `components/ipod/scenes/ipod-3d-color-cockpit.tsx` (shelf UI),
  `lib/ipod-state/storage.ts` (boot resolution).
- Depends on: nothing. It touches no module that `add-customizer-decision-log` rewrites.
- Relationship to the arc: **not on it.** This is a defect against a ratified requirement plus
  the authoring affordances around it, which by the priority rule in `CLAUDE.md` outranks act
  work without joining it.
- **Moves pixels.** The shelf gains a default marker and a rename affordance, so it gates on
  the owner's review before it is called done.
