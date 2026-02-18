# iPod Snapshot

A mobile-first iPod Classic snapshot studio with editable metadata, album art upload, color theming, and export.

## Current Scope

- Flat/focus experience and metadata editing are fully supported.
- Mobile interaction reliability (tap to edit, touch seek, uploader, export, color picker) is prioritized.
- 3D realism iteration is deferred to a later pass.

## Features

- Editable title, artist, album, rating, and track numbers
- Editable elapsed/remaining time with proportional progress behavior
- Album artwork upload from local files
- Theme panel with iPod-inspired case presets + background presets
- Native custom color picker (case/background) with recent-color persistence in `localStorage`
- 2D export flow with blob + fallback download paths

## Run Locally

```bash
npm install
npm run dev
# http://localhost:4000
```

## Test

```bash
npx playwright test tests/editable-track-number.spec.ts tests/interactions.spec.ts tests/mobile-usability.spec.ts --reporter=line
```

## Troubleshooting

- If UI appears unstyled, verify you are on the active dev port (`http://localhost:4000`) and reload.
- If a previous session cached stale assets, hard refresh once and retry.
- If export does not save immediately on some browsers, retry once from the export button (fallback chain is enabled).

## Naming

- App branding metadata and manifest are set to **iPod Snapshot**.
- Repository remote can be renamed later on GitHub to `ipod-snapshot` without code changes.
