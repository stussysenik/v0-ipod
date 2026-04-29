## Context
The repository currently has:
- no Storybook directory
- no Storybook packages
- no local project `DESIGN.md`
- only a small `components/ui` surface

That means Storybook should not be the first architectural move. It should arrive after the DS foundation clarifies tokens, boundaries, and which primitives are actually reusable.

## Goals
- Introduce Storybook as the canonical documentation and state-verification surface for shared UI primitives.
- Support controlled showcase stories for product-specific iPod artifacts without confusing them with DS primitives.
- Align Storybook workflow with the local `DESIGN.md` contract and token strategy.

## Non-Goals
- Defining the primitive boundary from scratch in this change.
- Full visual redesign of the app.
- Documenting every iPod product component as if it were part of the shared system.

## Decisions

### 1. Storybook depends on DS foundation
This change assumes the local design-system foundation has already defined:
- local design contract
- token source of truth
- primitive boundaries
- first-pass DS-ready component inventory

### 2. Storybook needs two lanes
The repository should expose:
- DS stories for reusable shared primitives
- showcase stories for product-specific iPod assemblies

These lanes should be clearly separated in navigation, naming, and documentation.

### 3. Verification should focus on states, not only screenshots
Shared DS stories should document and verify:
- default
- hover
- focus
- disabled
- loading or busy states where relevant

### 4. Storybook should reinforce token usage
Shared stories should make token-backed styling visible and discourage raw one-off styles in DS primitives.

## Risks / Trade-offs
- If Storybook scope is too broad, it will become a dumping ground for unstable product internals.
- If Storybook scope is too narrow, it will not become the daily DS workflow surface.

Mitigation:
- separate DS and showcase stories
- start with a small set of stable shared primitives
- expand only after the foundation is proven

## Sequencing
1. Approve and implement `refactor-design-system-foundation`.
2. Add Storybook configuration and stories for the stabilized primitive layer.
3. Add showcase stories for product assemblies where they help design or QA workflows.
