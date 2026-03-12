## Context
Exports are missing artwork in some cases, text wrapping needs determinism, and users want text-only animation restored. GIF export also needs an exact preview/record fallback because client-side encoding can be unreliable. Mobile palette controls need better reachability and a creative curated palette.

## Goals / Non-Goals
- Goals: deterministic export of artwork and wrapped text, text-only animation, GIF export option, exact GIF preview/record fallback, shared framing presets, reachable palette UI, curated inspiration palette.
- Non-goals: reworking the overall 3D view or adding video exports.

## Decisions
- Use a shared marquee/text animation component for title/artist/album, with timestamps locked.
- Add a GIF export path by capturing multiple frames and encoding on the client.
- Reuse captured GIF frames for preview playback and manual recording fallback so preview and export stay aligned.
- Move outer framing/padding into a shared export-scene preset module used by PNG export, GIF export, and GIF preview.
- Use an in-app preview modal plus a clean popup window for manual recording fallback.
- Add a Playwright Chromium lab budget that measures preview-control visual response through CDP-backed performance marks.
- Improve mobile palette layout with section anchors and sticky header shortcuts.
