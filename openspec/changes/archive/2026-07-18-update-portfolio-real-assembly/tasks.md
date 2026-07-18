# Tasks

> Approved scope: ship BOTH routes — flat 2D `/portfolio` and 3D `/3d-portfolio` — sharing one
> feed-driven screen + wheel + adapter. Only the device shell differs per route.

## 1. Audit & reconcile (no new device yet)

- [x] 1.1 Confirmed: `usePortfolioOs` + `IpodPortfolioStage` were orphaned (imported nowhere in production). `IpodFeedBrowser` used by `/portfolio` (repointed) + `whitelabel-demo` (kept). Safe to refit the stage, retire the OS as a data source.
- [x] 1.2 Audited `content/senik.feed.json`: menu = Works[12]/Writing[8]/Labs[6]/About/Contact[5], 27 works. 10 works have sparse bodies (mostly labs/AR) — case study renders gracefully on whatever fields exist (cover/summary/body/links all optional).

## 2. Feed→screen adapter (pure, tested first)

- [x] 2.1 `lib/portfolio/feed-screen.ts`: `deriveScreen(state, model)` → `{ title, isMenu, rows, cursor, openWork }`; `seekToNav(direction)` → next/prev. No React, no DOM.
- [x] 2.2 `lib/portfolio/feed-screen.test.ts` (unit project): root menu projection, hint glyphs, drilled-submenu title, work-open content, seek mapping. 5/5 green.

## 3. Shared feed-driven screen + wheel (written once)

- [x] 3.1 `components/ipod/portfolio/portfolio-feed-screen.tsx`: reuses `IpodDisplay` + the exact list/`SELECTED_BG`/`Pane` visual language; generic feed renderers (menu list + scrolling work case study with cover/meta/summary/body/links). No hardcoded switch.
- [x] 3.2 `components/ipod/portfolio/use-portfolio-feed.ts`: composes `loadFeed` + `useFeedNav`; exposes the wheel handler set (`onSeek`→`seekToNav`, center→select, menu→back, ±buttons). Keyboard parity via `useFeedNav.onKeyDown`. Shell-agnostic.

## 4. Compose the two routes (shell is the only difference)

- [x] 4.1 `/portfolio` (flat 2D): `components/ipod/scenes/portfolio-feed-stage.tsx` mounts `IpodDevice` (factory Noir preset) hosting the shared screen + wheel; focusable wrapper owns the keyboard. `app/portfolio/page.tsx` repointed; `IpodFeedBrowser` kept for `/whitelabel`.
- [x] 4.2 `/3d-portfolio` (3D): refit `ipod-portfolio-stage.tsx` to feed-driven (same screen + wheel through `ThreeDIpod`, orbit lock, identity); new `app/3d-portfolio/page.tsx`. SSR-safe dynamic import.

## 5. Scrolling case studies under keep-out law

- [x] 5.1 Open work scrolls WITHIN the device screen (faithful iPod) on both routes — wheel is the vertical axis, drill-in/back the depth axis. This satisfies the spec's "scrolls within the device screen" path and avoids any overlay. (A docked keep-out rail for a larger expanded surface is a deliberate future enhancement — NOT shipped this pass; noted to avoid the `.work-surface` z-index-overlay anti-pattern.)
- [x] 5.2 Verified at 390 + 1280 on both routes: no overlap, no horizontal overflow, case study scrolls inside the screen without clipping the device.

## 6. Retire / clean up (digital gardener)

- [x] 6.1 `usePortfolioOs` / `PortfolioScreen` / `lib/portfolio/data.ts` are now orphaned but LEFT IN PLACE intentionally: they are the rich source content the feed was authored from and are harmless (tree-shaken from the routes). Deleting risks losing reference content with no upside this pass. The bespoke `.ipod-device` CSS stays — still used by `IpodFeedBrowser` on `/whitelabel`.

## 7. Gates (web verification LAST)

- [x] 7.1 `pnpm type-check` green · `pnpm lint` 0 errors (66 pre-existing warnings, none in new files) · `pnpm test` 401/401 green · `pnpm build` green (`/portfolio` + `/3d-portfolio` both prerendered static).
- [x] 7.2 Browser-verified at 390 + 1280 on BOTH routes: real chassis + wheel render; menu boots correctly; works open and case studies scroll in-screen; no overlap, no horizontal overflow, no console errors. (Nit: original 3D stage's bottom hint/shot pills slightly overlap at 390 — pre-existing chrome, not introduced here.)
- [x] 7.3 `/whitelabel` unchanged — still renders via `IpodFeedBrowser` (build prerendered it; no code touched).
