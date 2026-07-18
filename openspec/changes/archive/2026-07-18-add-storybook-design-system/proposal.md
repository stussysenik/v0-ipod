# Change: Add Storybook workflow for the stabilized design-system layer

## Why
Once the local design-system foundation exists, the repository needs a dedicated environment for documenting reusable primitives, verifying states, and separating shared-system stories from product showcase stories.

Adding Storybook before the design-system foundation would force Storybook to invent unstable boundaries. Adding it after the foundation lets Storybook become the workflow layer rather than the place where architecture decisions are improvised.

## What Changes
- Add Storybook configuration and scripts for this repository.
- Document reusable DS primitives first, with a separate showcase path for product-specific iPod artifacts where useful.
- Add Storybook documentation, controls, and state coverage expectations for shared components.
- Define a code-first token workflow where `tokens/shared-ui.json` remains the shared primitive source of truth and Tokens Studio/Figma syncs to that repository data instead of creating a parallel token authority.
- Establish Storybook as the review and iteration surface for shared primitives, while keeping design-token changes mechanically traceable through repository files and typed adapters.
- Define the verification workflow for Storybook-driven DS work, including visual regression or snapshot coverage where appropriate.
- Treat this change as dependent on the design-system foundation contract and primitive audit.

## Impact
- Affected specs:
  - `storybook-design-system`
- Affected code:
  - `.storybook/**/*`
  - `package.json`
  - Storybook stories under `components/ui/**/*`
  - selected showcase stories for `components/ipod/**/*`
  - `tokens/shared-ui.json`
  - `lib/shared-ui-tokens.ts`
  - DS docs and contributor workflow docs
