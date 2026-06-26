## 1. Feed authoring

- [x] 1.1 Inventoried portfolio content via `lib/portfolio/data.ts` (the already-ported `sveltekit-portfolio-forever` source of truth)
- [x] 1.2 `content/senik.feed.json` mapped to `IpodFeed` (27 works: 12 projects, 6 labs, 8 writings, about), Senik theme tokens (Noir `#000` + blue `#0048FF`)
- [x] 1.3 `lib/portfolio/senik-feed.test.ts` (co-located, unit project) — feed validates via `loadFeed`; slugs unique; count > 15; known slugs resolve (3/3)

## 2. Route

- [x] 2.1 Rebuilt `app/portfolio/page.tsx` to mount the shared renderer (`IpodFeedBrowser`) with `senik.feed.json` (old `IpodPortfolioStage` left intact, not deleted)
- [x] 2.2 Each slug → link-bio preview (on-screen) → IA-C case study expand (work surface)

## 3. Gates (web verification LAST)

- [x] 3.1 `pnpm test` green (399/399) · `pnpm type-check` green · `pnpm lint` 0 errors · `pnpm build` green (`/portfolio` prerendered)
- [x] 3.2 Browser-verified (Playwright; chrome-devtools MCP profile was busy) — `/portfolio` at 320/390/768/1280: clean, navigable, no overlap, no horizontal overflow, screen registered inside device, no console errors
