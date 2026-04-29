## Context
The current repository is mature enough to keep evolving the iPod product assembly, but it is not yet stable enough to standardize visually at the design-system layer.

Observed constraints:
- there is no local `DESIGN.md`
- the global `/Users/s3nik/.gemini/DESIGN.md` is active and assumes tokenized system behavior
- `components/ui` is small and still contains hardcoded visual values
- `components/ipod/display/*` and related hooks are stable as product architecture, but not yet generalized as reusable system primitives
- Storybook is not installed and would currently document product internals rather than a clear shared UI contract

## Goals
- Create a project-local design contract before broader standardization.
- Separate reusable UI primitives from iPod-specific assemblies.
- Define a token workflow that can later support Storybook, visual regression, and DS-first iteration.
- Preserve the current product architecture while making DS extraction deliberate.

## Non-Goals
- Shipping Storybook in this change.
- Performing broad visual redesign.
- Rewriting all iPod-specific visual code into generic components.
- Standardizing every existing product component immediately.

## Decisions

### 1. Local design contract comes first
This repository should define a local `DESIGN.md` that overrides the global manifest and narrows the project scope. The local contract should explicitly distinguish:
- shared reusable primitives
- product assembly components
- token policy for each layer

### 2. Shared UI and product UI need different ownership rules
`components/ui` should only contain primitives that are intentionally reusable outside the iPod artifact. `components/ipod/*` should continue to own product fidelity, assembly logic, and historically specific styling.

### 3. Tokenization should start at the shared layer, not the whole product
The first token migration should target shared primitives and shared semantic surfaces. The iPod assembly can continue to use product-specific tokens and manifests where that is architecturally correct.

### 4. Storybook depends on this foundation
Storybook should document a stabilized primitive layer and a deliberate product showcase layer, not serve as the first place where the boundary gets invented.

## Proposed Foundation Outputs
- local `DESIGN.md`
- shared token source-of-truth path
- repository rule for `components/ui` vs `components/ipod`
- inventory of DS-ready primitives
- migration list of hardcoded shared styles that must become tokens before Storybook

## Risks / Trade-offs
- If this pass is too ambitious, it will turn into a redesign rather than a foundation refactor.
- If this pass is too shallow, Storybook will be added against unstable APIs and naming.

Mitigation:
- keep this change focused on contracts, boundaries, and token workflow
- keep broad visual restyling out of scope

## Sequencing
1. Land the local design-system foundation.
2. Land Storybook and DS documentation on top of that foundation.
3. Start visual standardization and design iteration after the system contract exists.
