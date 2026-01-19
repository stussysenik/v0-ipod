# Change: Add PWA Home Screen Installation

## Why
Enable the app to be installed on mobile device home screens for a native app-like experience. This requires a web manifest and service worker for PWA compliance.

## What Changes
- Add `@ducanh2912/next-pwa` package for service worker generation
- Create web manifest via Next.js metadata API (`app/manifest.ts`)
- Configure next.config.mjs with PWA plugin
- Add viewport and theme-color meta tags for mobile experience

## Impact
- Affected specs: New `pwa` capability
- Affected code: `next.config.mjs`, `app/manifest.ts` (new), `app/layout.tsx`
