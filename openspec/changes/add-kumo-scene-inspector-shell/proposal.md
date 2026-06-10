# Change: Add a Kumo-based scene inspector shell with archived legacy toolbox

## Why
The current floating toolbox and theme sheet are effective for the first iteration, but they hide scene structure, overload one panel with unrelated controls, and make mobile editing feel like a transient utility instead of a principled authoring surface. The next stage needs a calmer, more legible inspector that exposes the scene tree directly, preserves context through breadcrumbs and history, and treats export/snapshot provenance as part of the product rather than an afterthought.

The user intent is explicit: preserve the existing toolbox intact for reference, then rebuild the live editing surface from scratch around essentialism, strong hierarchy, deliberate motion, and a data-oriented scene model. This change captures that redesign as a separate proposal so the current `standardize-scene-document-architecture` migration can remain focused on document and profile semantics.

## What Changes
- Archive the current toolbox/settings implementation as a frozen legacy component tree inside the repo instead of deleting it.
- Introduce a new scene inspector shell built primarily from Kumo components and Kumo/Base UI primitives, styled with Tailwind and project tokens.
- Replace grouped feature sheets with a tree-first inspector that reveals parent/child structure, selected-node breadcrumbs, and node-scoped controls.
- Make the mobile toolbox button open the same semantic inspector model as desktop, using profile-driven layout and motion instead of a separate mobile control taxonomy.
- Add a scene history surface for saved snapshots and completed exports so authors can inspect what has been captured, when, and from which scene/export profile.
- Define quality and discoverability constraints for the redesign: clear component ownership, immutable scene updates, focused Playwright coverage, and explicit design tokens for spacing, elevation, and motion.

## Impact
- Affected specs:
  - `scene-inspector-shell`
  - `scene-history`
- Related changes:
  - depends on `standardize-scene-document-architecture`
- Affected code:
  - `components/ipod/ipod-classic.tsx`
  - new inspector modules under `components/ipod/` and/or `components/ui/`
  - archived legacy toolbox modules under `components/ipod/archive/`
  - `lib/scene-document.ts`
  - `lib/projection-profiles.ts`
  - `lib/storage.ts`
  - snapshot/export persistence helpers
  - mobile and interaction Playwright suites under `tests/`

