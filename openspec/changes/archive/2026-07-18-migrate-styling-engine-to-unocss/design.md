# Design: Styling-engine migration to UnoCSS + Shadow-DOM design system

## Context
- **Today (verified):** Tailwind v3.4 is the live PostCSS plugin; `app/globals.css` uses `@tailwind`/`@apply`; tokens follow the shadcn CSS-variable convention; `cva` is used in 7 component files. UnoCSS is configured (`presetUno`, attributify, icons, typography, `transformerDirectives`) but **not wired** — `@unocss/postcss` is commented out and no generated sheet is imported. `vanilla-extract` `.css.ts` files coexist for typed CSS.
- **Build:** `next build --webpack` is forced by `@vanilla-extract/next-plugin` + `@unocss/webpack` (both webpack-bound). Turbopack is unavailable; that is fine and unchanged here.
- **Embed:** `packages/ipod-wc` is a Lit element rendering into Shadow DOM via a hand-written `static styles = stageStyles` constructable stylesheet. It consumes the framework-neutral `lib/nav` + `lib/feed` cores and ships React-free.

## Goals / Non-Goals
- **Goal:** one atomic-CSS engine (UnoCSS) serving both the React app and the Shadow-DOM Lit design system, with zero visual regression and a reversible, surface-by-surface cutover.
- **Non-Goal:** visual redesign, renderer/WebGPU work, Rust-for-CSS, vanilla-extract removal, export WASM.

## Decision: UnoCSS, because of Shadow DOM
The Lit design system renders into Shadow DOM. A global utility stylesheet (Tailwind v3 *or* v4) cannot style content inside a shadow root. UnoCSS's `shadow-dom` mode generates per-component CSS injected directly into the Lit `static styles` block via `@unocss-placeholder`, and supports `part-[…]` for `::part`. `presetWind` keeps utility-class and `cva` syntax compatible, so the React surfaces migrate with minimal churn. One engine, both worlds.

## Alternatives considered
| Option | Verdict | Reason |
|---|---|---|
| Stay on Tailwind v3 | Rejected | Global sheet cannot style the Lit Shadow-DOM design system; blocks the stated DS direction. |
| Upgrade to Tailwind v4 (Oxide/Rust) | Rejected **for this goal** | Faster Rust engine, but still a global-sheet model — does **not** solve Shadow DOM. The Rust win does not serve the DS requirement. |
| Genuine UnoCSS migration | **Chosen** | Native `shadow-dom` mode; preset-compatible with existing classes + `cva`; one engine for app + embed. |

## Key trade-off (accepted, eyes open)
UnoCSS is TypeScript, not Rust. This change **drops the Tailwind-v4 Oxide (Rust) engine option**. The project's Rust footprint remains `oxlint` + SWC. This is deliberate: Shadow-DOM/Lit alignment outranks a CSS-engine Rust flex for this product.

## Migration strategy — additive coexistence, not big-bang
1. UnoCSS runs **alongside** Tailwind during migration (distinct class extraction; both stylesheets present).
2. Token theme + `animate-*` reproduced in `uno.config.ts`.
3. Each surface verified for **pixel parity** (visual check + Lighthouse a11y ≥0.95 / CLS ≤0.1 gates + Playwright) before it is considered migrated.
4. Tailwind is removed **last**, only after parity holds repo-wide. Until then it is the rollback safety net.

This follows the incremental-implementation discipline: thin vertical slice → verify → expand. It directly de-risks regressing a UI the owner is satisfied with.

## Risks & mitigations
- **Visual drift on a liked UI** → mandatory per-surface visual QA; both engines live until parity; CI gates (Lighthouse/Playwright) block merge.
- **shadcn token classes (`bg-background`) unresolved in Uno** → reproduce as Uno theme colors + shortcuts; verify on the panels/editors that use them.
- **`tailwind-merge` removal changes `cn()` conflict-dedup behavior** → audit the 9 `cn()`/`twMerge` sites; keep `clsx`; only drop Tailwind-aware merge where class conflicts are not relied upon.
- **`tailwindcss-animate` has no drop-in** → reproduce the specific `animate-*` utilities actually used as Uno rules/shortcuts; do not pull a broad animation dependency speculatively.

## Verification
- `pnpm build` green on webpack pipeline with UnoCSS wired.
- Visual parity confirmed on iPod screens, panels, editors, portfolio, and the Lit embed.
- Lit `<ipod-classic>` styled via UnoCSS `shadow-dom` mode (utilities resolve inside the shadow root).
- Lighthouse + Playwright gates pass; `oxlint` remains the lint default; no Tailwind references remain.
