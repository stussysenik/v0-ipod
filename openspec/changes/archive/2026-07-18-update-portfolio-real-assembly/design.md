# Design: /portfolio Real Assembly

## Context

`/portfolio` regressed to a bespoke CSS device during the white-label refactor. The reusable atoms
that `/` and `/3d` use are solid and must be reused verbatim:

- `components/ipod/device/ipod-device.tsx` — `IpodDevice({ preset, skinColor, screen, wheel, viewMode })`.
- `components/ipod/controls/ipod-click-wheel.tsx` — `IpodClickWheel({ preset, onSeek, onCenterClick, onMenuPress, ... })`. Rotation is real pointer-angle scrubbing.
- `components/ipod/portfolio/portfolio-screen.tsx` — `PortfolioScreen({ preset, frame, rows })`; a pure projection with a scrolling `ListView` and a `ContentView`.
- The keep-out stage (`lib/layout/keepout.ts` + globals.css) — device owns its cell; everything else docks in disjoint rails.

The data layers are also solid and canonical:

- `content/senik.feed.json` (27 works) validated by `lib/feed/load.ts`.
- `lib/nav/machine.ts` — pure reducer over the feed; `NavState = { stack: NavFrame[], view }`.

The friction: `PortfolioScreen.ContentView` is a **hardcoded `switch (frame.screen)`** over
`lib/portfolio/os.ts` screen IDs (`work`, `writing`, `bio`, `hire-track`, …). It is NOT feed-driven.
So "reuse the real assembly" and "single canonical feed source" collide at the content-projection layer.

## Decision 1 — Both forms: flat 2D `/portfolio` AND 3D `/3d-portfolio` (RESOLVED)

Approved scope: ship **both**. One shared feed-driven screen + wheel + adapter, composed two ways:

- **`/portfolio`** → flat 2D real assembly (`IpodDevice` + `IpodClickWheel` + the device screen)
  inside the keep-out stage. Light, prerenderable, "million users" default; composes cleanly with
  the keep-out rail case studies (Decision 3).
- **`/3d-portfolio`** → 3D real assembly (`ThreeDIpod` hosting the same screen + wheel), matching
  `/3d`'s drama. Reuses the orphaned `IpodPortfolioStage` composition, but rewired to the feed-driven
  screen + adapter (NOT the old `usePortfolioOs`).

The win: the device *shell* is the only difference. `screen` and `wheel` React nodes are identical
across both routes; the feed-driven screen and the adapter are written once and reused. This is the
maximal-reuse reading of "reuse the solved assembly" — the assembly atoms are shared; the two routes
are just two shell compositions.

Trade-off: two routes to QA instead of one. Mitigated because they share the screen/adapter/tests;
only the shell wrapper and route file differ per form.

## Decision 2 — Screen content: feed-driven (recommended) vs. reuse hardcoded PortfolioScreen

**Recommendation: feed-driven projection.** Render the on-screen list and case-study content
generically from feed `Work`/menu data, preserving `PortfolioScreen`'s scroll mechanics and visual
language but replacing the hardcoded `ContentView` switch with generic renderers (`work`, `writing`,
`about`, link list).

- Keeps ONE canonical source (`senik.feed.json`). The old `lib/portfolio/os.ts` data model is retired
  as the `/portfolio` source, not maintained in parallel.
- Standardized paradigm: the same feed that drives `/whitelabel` and the Lit embeddable drives
  `/portfolio` — white-label promise intact.
- Reuses the expensive, solved parts of `PortfolioScreen` (frame, status bar, scrolling `ListView`,
  cursor-follow). Only the per-item content layer changes from N hardcoded cases to ~3 generic ones.

Trade-off: the rich hand-authored screens in the old `ContentView` (e.g. bespoke "Hire / Tracks /
Proof" layouts) are replaced by generic feed renderers. Those bespoke layouts are recoverable later by
enriching the feed schema (e.g. typed `body` blocks) — a feed-schema change, not a renderer fork.

Rejected alternative — reuse hardcoded `PortfolioScreen` + `usePortfolioOs` wholesale: smallest diff
to restore fidelity, but it keeps a second data source forever, diverges from white-label, and
contradicts the user's "single source of truth / standardized paradigm" directive.

## Decision 3 — Case studies: keep-out law, never z-index over the device

A selected work expands into a scrolling case-study surface. Per `refactor-stage-keepout-zones`, it
must live in an exclusive docked rail or scroll within the device screen — it must NOT z-index over
the device cell ("don't z-index out of your abstraction").

- **Narrow (rows mode, < 560px):** case-study content scrolls **within the device screen** (faithful
  iPod), with the expanded surface docked in a rail **below** the device. Vertical axis = wheel scrub.
- **Wide (columns mode, ≥ 560px):** the expanded case-study surface docks in a **side rail** beside
  the device. Horizontal axis = device ↔ surface; vertical = scroll within each.

This is the "vertically / horizontally" pointer study: the wheel owns the vertical scrub on the
device; the keep-out grid owns the horizontal device↔surface relationship. No overlap, no overflow
(validated by `rectsOverlap`).

## Decision 4 — Data binding: thin feed→screen adapter

Bind the real assembly to the nav machine with a thin adapter that exposes the small interface the
screen + wheel already consume:

```
seek(direction)  -> dispatch prev/next      (wheel rotation)
select()         -> dispatch select          (center button / Enter)
back()           -> dispatch back            (MENU / Backspace)
frame, rows      <- derived from NavState (current NavFrame nodes + focus; open Work)
```

Keep the nav machine pure and unit-tested; the adapter is the only new logic and is itself
unit-tested (feed in → frame/rows out; actions map to reducer transitions). No business logic in the
presentation layer.

## Risks

- **Feed body richness.** `senik.feed.json` works carry `summary`/`body`/`links`/`cover`; if some
  bodies are thin, case studies read sparse. Mitigation: audit feed bodies as task 1; enrich where
  needed (content-only, no schema change).
- **Retiring `usePortfolioOs`.** Ensure nothing else imports it before removal; otherwise refit, do
  not duplicate.
- **Keep-out integration with a flat device.** The existing `keepout-stage` CSS was built for the
  feed-browser device; verify it hosts `IpodDevice` (real dimensions from preset) without overflow.
