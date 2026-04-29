# Canonical Figma File Manifest

The iPod project has exactly one canonical Figma file. Every tooling path — the
Phase 1 push, the token sync, the Phase 2 HMR plugin, the Code Connect
publisher — resolves to the same file key.

## Canonical File

| Field              | Value                                                |
| ------------------ | ---------------------------------------------------- |
| Name               | `iPod · Dev Mode Bridge`                             |
| File key           | _populated by operator at Phase 1 bootstrap_         |
| URL                | _populated by operator at Phase 1 bootstrap_         |
| Branch             | `main` (Figma's branching feature, not duplication)  |
| Owner contact      | `stussysenik` (repo owner)                           |
| Figma plan         | Professional (see `tooling-costs.md`)                |

Update the `FIGMA_FILE_KEY` export in `figma.config.json` **and** this manifest
when the file is first created. CI and the plugin both read the config file at
runtime, so the manifest is the operator-facing artifact and the config file is
the machine-facing one.

## Page Layout

Mirrors the Storybook navigation one-to-one. Exactly these pages, in this
order:

1. `Cover` — file intro, "Not in Figma" callout, link back to the repo.
2. `Tokens` — auto-generated swatches and typography driven from Variables.
3. `Primitives` — raw token values (`color.blue.500`, `space.4`, etc.).
4. `iPod / Shell` — `ipod-device-shell` frames.
5. `iPod / Screen` — `ipod-screen` frames.
6. `iPod / Wheel` — `click-wheel` frames.
7. `iPod / Now Playing` — full device composition.
8. `Controls` — `ui/*` primitives (buttons, checkbox, switch, theme toggle).
9. `Docs` — manifests, ownership, access instructions, changelog.

## Access Workflow

1. A new contributor reads this manifest and requests access via the listed
   owner contact.
2. The owner adds the contributor with `can edit` on the canonical file.
3. Dev Mode seats are granted separately; confirm before assigning.
4. Any plugin run that writes to the file must use the contributor's personal
   `FIGMA_TOKEN` — shared tokens are not permitted.

## Recovery Workflow

If the canonical file is ever deleted, corrupted, or loses variable state:

1. Stop all connected plugins (`bun run figma:dev` instances) to prevent
   competing writes.
2. Create a new empty file with the page layout above.
3. Run `bun run figma:push` to re-bootstrap vector frames from `storybook-static/`.
4. Run `bun run tokens:sync` to re-import Variables from
   `design-tokens/tokens.json`.
5. Update this manifest with the new file key and URL and commit.
6. Re-publish Code Connect (`bunx figma connect publish`).

See `runbook.md` for the full operator walkthrough.
