# Change: /portfolio as a Feed Surface (matches portfolio-forever)

## Why

`/portfolio` should be a real, working portfolio — "as clean as stussysenik.com/works" — driven by the same feed and rendered through the same embeddable element. Its content matches the finished `sveltekit-portfolio-forever` so the iPod becomes a live, embeddable portfolio: each work a slug with its own visual, navigable by the wheel.

## What Changes

- Author `senik.feed.json` mapping the `sveltekit-portfolio-forever` works/assets into the `IpodFeed` schema (real slugs + functionality).
- Rebuild `/portfolio` to mount `<ipod-classic>` (or the shared React renderer) with `senik.feed.json` and Senik's theme tokens.
- Each work slug resolves to its link-bio-grade preview and expands (IA C) into the full case study.
- Responsive via the keep-out stage (container queries) — correct on mobile and all breakpoints.

## Impact

- Affected specs: `portfolio-surface` (new capability)
- Depends on: `add-lit-ipod-embeddable` (or shared renderer), `add-ipod-content-feed`, `add-ipod-browser-navigation`, `refactor-stage-keepout-zones`
- Affected code: `app/portfolio/page.tsx`, `content/senik.feed.json`, `tests/portfolio.spec.ts`
