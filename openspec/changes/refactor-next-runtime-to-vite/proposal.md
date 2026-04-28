# Change: Evaluate a Next.js to Vite Runtime Migration

## Why
The project can adopt Bun and OXC as defaults without changing its application runtime, but Vite is not a drop-in replacement for this repository's current Next.js architecture. The app depends on the Next app router, `next/font`, `next-themes`, metadata routes, and Next build/runtime conventions.

## What Changes
- Keep Bun as the default package manager and OXC as the default lint path in the current Next.js app.
- Evaluate the concrete work required to migrate the runtime from Next.js to Vite.
- Identify which features must be replaced or rewritten before a Vite migration can be approved.

## Impact
- Affected code:
  - `app/**`
  - `components/**`
  - `next.config.mjs`
  - `package.json`
  - deployment and PWA configuration
