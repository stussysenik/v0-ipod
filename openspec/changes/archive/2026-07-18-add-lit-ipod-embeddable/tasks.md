## 1. Framework-neutral core check

- [x] 1.1 Confirmed `lib/feed`, `lib/nav`, `lib/layout` have zero React/component imports (grep verified)

## 2. Lit element

- [x] 2.1 `packages/ipod-wc/` scaffold (Lit; `package.json`, `src/`, esbuild build → 87KB self-contained ESM bundle verified)
- [x] 2.2 `<ipod-classic>` element: `feed`/`theme`/`src` props, renders stage + nav from shared core (relative imports), container-query CSS in shadow root; no decorators (tsconfig has no experimentalDecorators), `declare` fields to avoid the Lit class-field pitfall
- [x] 2.3 Feed-swap reactivity (willUpdate re-inits nav); no viewport reads (container queries only); graceful validation error instead of throw

## 3. Whitelabel route + tests

- [x] 3.1 `app/whitelabel/page.tsx` mounts the REAL element (via `ipod-classic-embed.tsx`) with two themed feeds (Studio Noir / Sunset Co.) + a swap control
- [x] 3.2 `packages/ipod-wc/src/ipod-classic.test.ts` (new vitest `wc` jsdom project) — element upgrades, renders feed, re-renders on feed swap, surfaces validation errors (4/4)

## 4. Gates (web verification LAST)

- [x] 4.1 `pnpm test` green (399/399) · `pnpm type-check` green · `pnpm lint` 0 errors · `pnpm build` green (`/whitelabel` prerendered)
- [x] 4.2 Browser-verified (Playwright; chrome-devtools MCP profile was busy) — `/whitelabel` custom element at 320/390/768/1280: no overlap, no horizontal overflow, screen registered inside device, navigable, no console errors
