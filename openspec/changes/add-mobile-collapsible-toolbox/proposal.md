# Change: Collapsible Mobile Toolbox for Cleaner Capture Surface

## Why
On mobile viewports, the floating side controls take significant space and can obstruct clean framing while users record interactions or prepare exports. Users need an explicit way to hide and reveal controls without losing access.

## What Changes
- Add a compact mobile toolbox dock with a single toggle button that reveals/hides the full tools stack.
- Keep desktop/tablet behavior unchanged with always-visible tools for fast editing.
- Auto-reset toolbox visibility during key transitions (export start, view-mode switch, snapshot actions) to keep the interaction surface clear.
- Ensure outside-tap and Escape behavior close transient panels consistently.

## Impact
- Affected specs: `export-ux`
- Affected code:
  - `components/ipod/ipod-classic.tsx`
  - `tests/mobile-usability.spec.ts`
  - `tests/interactions.spec.ts`
