## 1. Navigation model

- [x] 1.1 `lib/nav/machine.ts` — focus/drill/back/select over the feed menu tree (pure, testable); added a `focus` action for pointer parity
- [x] 1.2 `lib/nav/machine.test.ts` (co-located, unit project per repo convention) — drill+back restores focus; select resolves a work by slug (10/10)

## 2. Preview & expand UI

- [x] 2.1 `components/ipod/browser/slug-preview.tsx` — link-bio preview (cover/title/summary), renders standalone
- [x] 2.2 `components/ipod/browser/work-surface.tsx` — IA-C expand surface, respects keep-out zone (spans the grid, outside the device cell), return affordance
- [x] 2.3 Wire wheel/keyboard/touch to the nav model (`use-feed-nav.ts` + `ipod-feed-browser.tsx`: arrows/enter/escape + wheel buttons + row click/hover)

## 3. Gates

- [x] 3.1 `pnpm test` green (399/399) · `pnpm type-check` green · `pnpm lint` 0 errors · browser-verified navigable at 320/390/768/1280
