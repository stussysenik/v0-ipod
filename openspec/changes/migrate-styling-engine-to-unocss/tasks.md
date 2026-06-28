# Tasks

## 1. Wire UnoCSS additively (Tailwind stays)
- [x] 1.1 Add `@unocss/webpack` to a `webpack()` function in `next.config.mjs` (webpack pipeline is already in use).
- [x] 1.2 Select presets in `uno.config.ts`: `presetWind3` (Tailwind-compatible) + attributify + icons + typography; keep `transformerDirectives` + `transformerVariantGroup`.
- [x] 1.3 Import the generated UnoCSS entry (`uno.css` / virtual module) + `@unocss/reset` in `app/layout.tsx`, ordered so Tailwind still wins until cutover.
- [x] 1.4 Verify `pnpm build` succeeds with **both** engines present (no visual change expected yet).

## 2. Reproduce tokens and animations in UnoCSS
- [x] 2.1 Map the shadcn CSS-variable tokens (background, foreground, border, ring, muted, accent, destructive, …) into `uno.config.ts` theme colors + shortcuts.
- [x] 2.2 Reproduce the specific `animate-*` utilities actually used (audit usage first) as Uno rules/shortcuts; do not add a broad animation dependency.
- [x] 2.3 Confirm `@apply` directives in `app/globals.css` resolve via `transformerDirectives`.

## 3. Verify parity surface-by-surface (both engines live)
- [x] 3.1 Migrate + visually verify the iPod screen surfaces (`components/ipod/display/**`).
- [x] 3.2 Migrate + verify the panels/editors that use token classes and `cva` (`components/ipod/panels/**`, `components/ipod/editors/**`, `components/ui/**`).
- [x] 3.3 Migrate + verify the portfolio + browser surfaces.
- [x] 3.4 For each surface, confirm Lighthouse a11y ≥0.95 and CLS ≤0.1 gates pass.

## 4. Stand up the Shadow-DOM design system
- [x] 4.1 Configure a `shadow-dom` UnoCSS context for `packages/ipod-wc`.
- [x] 4.2 Add `@unocss-placeholder` to the Lit element's `static styles` and migrate `stage-css.ts` hand-written rules to UnoCSS utilities where it reduces duplication (keep bespoke geometry CSS as-is).
- [x] 4.3 Verify utilities resolve inside the shadow root and the embed stays encapsulated on a foreign host page.
- [x] 4.4 Confirm the embed still ships React-free and imports only `lib/nav` + `lib/feed`.

## 5. Remove Tailwind (only after repo-wide parity)
- [x] 5.1 Audit the 9 `cn()`/`twMerge` sites; replace `tailwind-merge` with `clsx`-only `cn()` where class-conflict dedup is not relied upon.
- [x] 5.2 Delete `tailwind.config.ts`; remove `tailwindcss`, `tailwindcss-animate`, `tailwind-merge` from `package.json`; swap `tailwindcss` out of `postcss.config.mjs`.
- [x] 5.3 Remove the now-redundant `@unocss/*` duplication so one engine remains; ensure `@unocss/postcss` vs webpack-plugin path is singular.
- [x] 5.4 Grep the repo for residual `@tailwind`, `tailwind.config`, and `tailwind-merge` references; confirm none remain.

## 6. Validate and gate
- [x] 6.1 `pnpm build` green with UnoCSS as the only engine.
- [x] 6.2 `pnpm lint` (oxlint) + `pnpm type-check` clean; no ESLint twin reintroduced.
- [x] 6.3 `pnpm test` (vitest unit + Playwright e2e) pass.
- [ ] 6.4 Open as a PR so CodeRabbit + CI (Lighthouse) review the migration.
