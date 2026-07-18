# Change: /portfolio Mounts the Real iPod Assembly

## Why

`/portfolio` should be as robust as `/` (the flat "2D" workbench) and `/3d` — same iPod, just fed
portfolio content. Today it is not. The `add-portfolio-feed-surface` change (task 2.1) deliberately
pointed `/portfolio` at the portable, framework-neutral `IpodFeedBrowser` so the Lit `<ipod-classic>`
embeddable could share one renderer. That was the right call for white-label, but it regressed
`/portfolio` to a **bespoke, low-fidelity device**: a `.ipod-device` CSS `<div>` with four emoji
transport buttons (⏮ ⏭ ⏯) and `onMouseEnter` list rows. Meanwhile the **solved physical assembly**
— `IpodDevice` (machined chamfer, specular sheen, gasket, hardware presets) and `IpodClickWheel`
(real rotational pointer-angle scrubbing, hardware-button callbacks, mechanical click audio) — already
ships on `/` and `/3d`, and an orphaned `IpodPortfolioStage` already composed it for portfolio use,
routed nowhere.

The assembly is solved. The portfolio re-skinned a worse device instead of mounting the real one and
adjusting only **content** and **interaction**. This change reunifies `/portfolio` onto the real
assembly without losing the one good thing the refactor delivered: a single, validated, white-label
data source (`senik.feed.json` + the pure nav machine).

## What Changes

- **Mount the real assembly on two routes.** `/portfolio` renders the **flat 2D** assembly
  (`IpodDevice` + `IpodClickWheel`); a new `/3d-portfolio` renders the **3D** assembly
  (`ThreeDIpod` hosting the same screen + wheel) — both the same component and typography design
  system as `/` and `/3d`, instead of the bespoke `.ipod-device` CSS surface. No new device; the
  screen + wheel + adapter are written once and reused across both shell compositions.
- **Faithful iPod interaction.** Wheel rotation drives `prev`/`next`, center drives `select`/drill-in,
  MENU drives `back`. No emoji transport buttons as the primary nav. Keyboard parity preserved.
- **One canonical data source.** Keep `senik.feed.json` + the pure `lib/nav/machine.ts` as the single
  source of truth. The on-screen content is a feed-driven projection — list screens and case-study
  screens render generically from `Work`/menu data, not a hardcoded per-screen switch.
- **Scrolling case studies, no z-index hacks.** A selected work expands into a scrolling case-study
  surface that respects the keep-out structural law (device owns its cell; the surface lives in a
  docked rail / scrolls within the screen) — it never z-indexes over the device cell.
- **`IpodFeedBrowser` stays the portable core** for `/whitelabel` and the Lit embeddable. Only
  `/portfolio` stops using it. Both promises (fidelity on `/portfolio`, portability for embeds) hold.

Decisions resolved at the approval gate (see `design.md`):
1. **Both forms ship** — flat 2D `/portfolio` and 3D `/3d-portfolio`, sharing one feed-driven screen
   + wheel + adapter; only the device shell differs.
2. **Feed-driven screen** — generic work/writing/about renderers, one canonical source, not the
   hardcoded `PortfolioScreen`/`usePortfolioOs` switch.

## Impact

- Affected specs: `portfolio-surface` (MODIFIED: renderer is the real assembly, not the bespoke CSS
  device; ADDED: faithful wheel interaction, scrolling case studies within keep-out law).
- Affected code: `app/portfolio/page.tsx`, a new feed-driven portfolio stage under
  `components/ipod/scenes/` or `components/ipod/portfolio/`, a feed→screen adapter under
  `lib/portfolio/`, reuse of `IpodDevice` / `IpodClickWheel` / keep-out stage. `IpodFeedBrowser`
  retained for `/whitelabel`. Orphaned `IpodPortfolioStage` + `usePortfolioOs` retired or refit.
- Depends on (all Complete): `add-ipod-content-feed`, `add-ipod-browser-navigation`,
  `refactor-stage-keepout-zones`, `add-portfolio-feed-surface`.
- QA parity with `/3d`: `pnpm test` · `pnpm type-check` · `pnpm lint` · `pnpm build`, plus
  browser verification at 320 / 390 / 768 / 1280.
