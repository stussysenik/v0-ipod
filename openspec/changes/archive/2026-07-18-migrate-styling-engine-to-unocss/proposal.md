# Change: Migrate the styling engine to UnoCSS and stand up a Shadow-DOM design system

## Why
The repository's styling is **Tailwind v3 + shadcn/ui** (CSS-variable tokens, `cva` in 7 files). UnoCSS is installed and configured (`uno.config.ts`) but **inert** — `@unocss/postcss` is commented out, no webpack plugin is wired, and nothing imports a generated UnoCSS stylesheet. So the project carries two atomic-CSS systems while only one runs.

The deciding constraint is the design-system direction: the embeddable artifact is a **Lit custom element using Shadow DOM** (`packages/ipod-wc`, styled today with a hand-written constructable stylesheet). **Tailwind generates one global stylesheet that cannot cross a Shadow DOM boundary** — utility classes silently do nothing inside a shadow root without per-component build-time extraction hacks and a per-instance re-parse cost. Upgrading to Tailwind v4 does not fix this; v4 keeps the global-sheet model.

**UnoCSS has a first-class `shadow-dom` mode** (`@unocss-placeholder` injected into a Lit `static styles` block, plus `part-[…]` for `::part`). It is preset-driven (`presetWind` is Tailwind-class-compatible, so existing className strings and `cva` survive), so it can serve both the React app and the Lit design system from one engine. That makes UnoCSS the architecturally correct engine for a Lit/Shadow-DOM design system, not a preference.

## What Changes
- Wire UnoCSS into the build **additively, alongside Tailwind** (no big-bang), via the existing webpack build pipeline.
- Reproduce the shadcn CSS-variable **token theme** (background, foreground, border, ring, …) and the `animate-*` utilities (currently from `tailwindcss-animate`) as UnoCSS theme + shortcuts/rules.
- Verify visual parity **surface-by-surface** with both engines live (Tailwind stays as the safety net until parity is proven).
- Stand up the **Shadow-DOM design system**: the Lit `<ipod-classic>` and future DS primitives consume UnoCSS utilities via `shadow-dom` mode.
- **Only then** remove Tailwind: delete `tailwind.config.ts`, `tailwindcss`, `tailwindcss-animate`, `tailwind-merge` (keep `clsx` in `cn()`), and the dead `@unocss/*` duplication is resolved into one live engine.
- Confirm **oxc/oxlint stays the default lint gate**; no ESLint twin re-introduced.

## Out of Scope (explicitly)
- **WebGPU / 3D renderer changes** — orthogonal to styling; the WebGL renderer is sufficient for a single hero model. Revisit only with a measured GPU bottleneck.
- **Rust toolchain for CSS** — UnoCSS is TypeScript; this change deliberately trades the Tailwind-v4 Oxide (Rust) engine for Shadow-DOM alignment. The Rust story stays oxc/oxlint + SWC.
- **`vanilla-extract` removal** — the `.css.ts` typed-CSS files are orthogonal and stay.
- **Export/encoder WASM** — separate measure-first question.
- Visual redesign — this is an engine migration; screens must look identical.

## Impact
- Affected specs:
  - `styling-engine` (ADDED)
  - `shadow-dom-design-system` (ADDED)
- Affected code:
  - `next.config.mjs`, `postcss.config.mjs`, `uno.config.ts`
  - `app/globals.css`, `app/layout.tsx`
  - `package.json` (remove `tailwindcss`, `tailwindcss-animate`, `tailwind-merge`, `tailwind.config.ts`)
  - `lib/utils` / `cn()` helper and the 7 `cva` consumers
  - `packages/ipod-wc/src/ipod-classic.ts`, `packages/ipod-wc/src/stage-css.ts`
  - `components/ui/**`, `components/ipod/**` (parity verification only — no redesign)
