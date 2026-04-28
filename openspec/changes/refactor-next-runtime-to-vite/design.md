## Context

The repository currently runs as a Next.js 15 application with App Router conventions and Next-specific runtime integrations. A move to Vite would replace the application runtime, not just the bundler command.

## Goals / Non-Goals

**Goals:**
- Preserve the current UI and export behavior while evaluating a runtime migration.
- Separate toolchain changes that are low risk now (`bun`, `oxlint`) from framework migration work that is not.

**Non-Goals:**
- Partial migration that leaves the app split across Next and Vite runtimes.
- Silent removal of Next-only capabilities without explicit replacements.

## Decisions

### Decision 1: Split Tooling Modernization from Runtime Migration

**What:** Adopt Bun and OXC in the current repo immediately, but keep Next.js as the runtime until a separate migration is designed.

**Why:**
- Bun and OXC are configuration-level changes.
- Vite requires replacements for routing, metadata, fonts, theming, build output, and deployment assumptions.
- This keeps the repo stable while still moving the default developer workflow forward.

### Decision 2: Require Feature-Parity Inventory Before Any Vite Rewrite

**What:** Inventory all Next-bound features first, then decide whether Vite is worth the rewrite cost.

**Why:**
- The app uses `app/`, `next/font/google`, metadata routes, `next-themes`, and `next.config.mjs`.
- Without an inventory, a Vite rewrite is likely to regress behavior in ways that are not obvious from a package swap.
