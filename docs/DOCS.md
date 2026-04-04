# iPod Snapshot Docs

## Interaction Architecture

Core interaction state lives in `components/ipod-classic.tsx`:
- View mode (`flat`, `focus`, `3d`)
- Theme panel visibility
- Case/background colors
- Export status lifecycle
- Song metadata reducer updates

Screen-level metadata behavior is composed in `components/ipod-screen.tsx` with focused child components for editability.

## Mobile-First Interaction Rules

- Text fields (`EditableText`, `EditableTime`) support single-tap edit on touch devices.
- Progress seek uses pointer events (`pointerdown/move/up/cancel`) for touch and mouse parity.
- Artwork upload uses a label-triggered input for reliable native photo/file picker behavior on mobile.
- File input is visually hidden via inline styles (not class-only), preventing `Choose File` artifacts if CSS fails.

## Theme + Color Picker Behavior

Theme presets include iPod-inspired case tones:
- White (5G)
- Black (5G/Classic)
- Silver (Classic)
- U2 Black/Red
- Mini Blue, Mini Green, Mini Pink
- Product Red

Background defaults stay in clean light neutral tones.

Custom colors:
- Native picker opens from toolbar actions.
- Theme panel closes when picker is invoked so the user can sample from album art or anywhere on screen.
- Recent custom colors are persisted:
  - `ipodSnapshotCaseCustomColors`
  - `ipodSnapshotBgCustomColors`

## Export Reliability

Export orchestration is in `lib/export-utils.ts`:
1. Preload/embed images
2. Capture blob via `html-to-image`
3. Attempt download via blob URL
4. Fallback to data URL export

Status updates map to toolbar action states (`preparing`, `sharing`, `success`, `error`) so controls recover predictably after export attempts.

## Service Worker / Cache Safety

`components/service-worker-cleanup.tsx` unregisters stale service workers and clears caches on app load to reduce stale-asset regressions.

## Regression Coverage

Playwright suites:
- `tests/editable-track-number.spec.ts`
- `tests/interactions.spec.ts`
- `tests/mobile-usability.spec.ts`

Coverage includes:
- Theme panel / view switching
- Upload flow
- Color persistence
- Remaining-time-first progress math
- Export control recovery
- Mobile tap and touch-seek behavior
