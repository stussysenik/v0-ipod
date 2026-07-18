# Change: Deterministic Exports and Unified Input Surface

## Why
Exported images currently diverge from on-screen visuals across devices and deployments, including clipped/ghosted shadows and inconsistent snapshot artwork output. Input and editing affordances also differ between mouse, touch, and keyboard paths, and current success notifications are more interruptive than needed.

## What Changes
- Add a deterministic export-safe rendering path for flat iPod exports so captures are stable with and without loaded snapshot data.
- Reduce interruptive feedback by muting routine success notifications while preserving actionable error messaging.
- Unify interaction handling across touch/mouse/pointer and introduce a fixed-position editing input surface for touch-first flows.
- Add export diagnostics (pipeline version + runtime build/version context) for production-vs-local investigation.
- **Non-goal**: Framework migration (Next.js to Remix/TanStack) in this change; this work focuses on stabilizing the existing rendering/export stack first.

## Impact
- Affected specs: `export-ux`
- Affected code:
  - `lib/export-utils.ts`
  - `components/ipod/ipod-classic.tsx`
  - `components/ipod/click-wheel.tsx`
  - `components/ipod/editable-text.tsx`
  - `components/ipod/editable-time.tsx`
  - `components/ipod/editable-track-number.tsx`
  - `app/layout.tsx`
  - `tests/interactions.spec.ts`
  - `tests/mobile-usability.spec.ts`
