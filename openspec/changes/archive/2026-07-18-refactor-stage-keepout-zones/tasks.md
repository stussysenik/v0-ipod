> Status note (honest scope): the keep-out **architecture** is built and proven on the
> new feed-driven surfaces (`/portfolio`, `/whitelabel`, the Lit `<ipod-classic>`),
> which are now the canonical keep-out stage. The **legacy `/3d` studio retrofit**
> (migrating the existing 946-line `ipod-3d-stage.tsx` + 1123-line workbench +
> `panels/*` into the grid, plus the 3D-silhouette keep-out) is NOT done — it is a
> large, separate surgery on tightly-coupled WebGL/studio code. Items below are marked
> against what actually shipped.

## 1. Geometry foundation (no UI change)

- [x] 1.1 Add `lib/layout/keepout.ts` with pure helpers: `rectsOverlap(a, b)`, `computeStageLayout(stage, opts)` (device keep-out rect + disjoint rail zones), `railLayoutMode` narrow-container predicate
- [x] 1.2 Write co-located `lib/layout/keepout.test.ts` (Vitest `unit` project): overlap detection, keep-out/rail disjointness invariant, width-locked device, reflow predicate — red first
- [x] 1.3 `pnpm test:unit` green for the new module (12/12; full suite 399/399)

## 2. Container-query stage scaffold

- [x] 2.1 Added stage container contexts in `app/globals.css` (`.keepout-stage`: `container-type: inline-size`, locked `aspect-ratio`, named grid zones for device + rails) — the JS-free mirror of `keepout.ts`
- [~] 2.2 New feed stage wraps the device in the center keep-out cell (`ipod-feed-browser.tsx` + Lit element). **Legacy `/3d` stage + workbench NOT wrapped.**
- [x] 2.3 New stage device sizing is `cqi`/`cqb`-based (no `vw`/`vh`/viewport `clamp()`); browser-verified no rescale on viewport-height change
- [x] 2.4 Single `@container` rail breakpoint at 560px (columns → rows reflow), matching `keepout.ts` DEFAULTS

## 3. Bind screen content to the device

- [x] 3.1 Screen DOM (`.ipod-screen`) renders *inside* the device subtree in both renderers — browser-verified "screen rect contained within device rect" at 320/390/768/1280
- [x] 3.2 No detached 2D overlay; screen inherits the device box (structure verified in-browser). **Legacy `components/ipod/display/*` not migrated** (the `/3d` route still uses them).

## 4. Dock the rails

- [~] 4.1–4.4 Rail **zones** exist as exclusive grid cells (reflow below at <560px), so docking is structural. The new feed browser has no studio controls to dock, so rails render empty. **Migrating the existing `/3d` angle pill, orbit pad (`ipod-3d-touch-controls.tsx`), shots bar (`ipod-3d-studio-shots.tsx`), `PanelSystem` (`panels/*`), and command palette into the rails — and retiring the floating-panel model — is NOT done.**

## 5. Gates (in order — web verification LAST)

- [x] 5.1 `pnpm test` — full suite green (399/399)
- [x] 5.2 `pnpm type-check` (tsc) green
- [x] 5.3 `pnpm lint` (oxlint) — 0 errors
- [x] 5.4 `pnpm build` succeeds (`/portfolio` + `/whitelabel` prerendered)
- [~] 5.5 Browser verification at 320/390/768/1280 (Playwright; chrome-devtools MCP profile was busy): zero overlap, no horizontal scroll, screen registered to device, navigable — **verified on the keep-out surfaces (`/portfolio`, `/whitelabel`); `/3d` NOT re-verified** (legacy layout unchanged; "shots bar fully visible" applies to the un-migrated `/3d`).
