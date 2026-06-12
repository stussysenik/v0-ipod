# Change: Noir factory default, savable themes, and the recruiter-ready /portfolio hire surface

## Why

The studio's proven hero look — black `classic-2008-black` device under the
"Designer Dark" rig on the `#0048FF` stage — lives only in one browser's
localStorage. Every fresh visitor (including every recruiter) instead gets the
white Apple-rig default, which washes a black device out and undersells the
artifact. Meanwhile `stussysenik/portfolio-forever` (commits `c48465c`…`c384dfc`)
turned the canonical portfolio into a hiring-proof surface (HIRE.md manifest,
hiring tracks, proof pillars, updated CV) that `/portfolio` does not yet serve.

## What Changes

- **Noir factory default**: the persisted Designer Dark black look (case
  `#1b1818`, wheel `#313030`, center `#141212`, back/edge `#cfd3d7`, bezel
  `#0a0a0a`, stage `#0048FF`, rig "Designer Dark") becomes the first-load
  default of `/3d` and `/portfolio`. The black hardware preset carries explicit
  wheel overrides because derivation produces `#242020`, not the curated
  `#313030`.
- **Edge Noir rig**: a third rig preset that carves edges out of black-on-black
  (dual opposed rims, twin horizon softboxes, near-zero front fill) — the
  "powerful dark, edges highlighted" rig the Apple lights-on combo can't give.
- **Savable themes**: the color cockpit gains a Themes shelf — save the current
  full look (7 surfaces + rig), apply, delete; built-in undeletable "Noir"
  theme ships the canonical black.
- **/portfolio hire surface**: content refreshed from portfolio-forever
  (role, bios, languages, Product Hunt award, works feed, writings); new
  "Hire Me" menu (mission, five hiring tracks, four proof pillars, contact
  deep-links); "Taste" lists under Likes; noir device on the blue stage;
  mobile-first wheel with an orbit lock so the touch click-wheel works
  immediately on iPhone 15 Pro / SE class devices.

## Impact

- Affected specs: `3d-studio-presentation` (new), `portfolio-os` (new)
- Affected code: `lib/ipod-classic-presets.ts`, `lib/ipod-state/model.ts`,
  `lib/studio-lighting-config.ts`, `lib/studio-themes.ts` (new),
  `components/ipod/scenes/ipod-3d-color-cockpit.tsx`, `lib/portfolio/data.ts`,
  `lib/portfolio/os.ts`, `components/ipod/portfolio/portfolio-screen.tsx`,
  `components/ipod/scenes/ipod-portfolio-stage.tsx`, `app/portfolio/page.tsx`
- Out of scope (named for the roadmap, deliberately deferred): WebGPU/WASM
  renderer experiments, billboard/large-format art direction presets, leva
  keyframe theme animation (tracked in `add-3d-studio-control-suite`).
