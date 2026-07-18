## 1. Storybook Setup
- [x] 1.1 Add Storybook packages, config, and repository scripts.
- [x] 1.2 Ensure Storybook works with the repository's Next.js, TypeScript, and styling setup.
- [x] 1.3 Document how Storybook relates to the local `DESIGN.md` workflow.
- [x] 1.4 Define Storybook navigation and naming so shared primitives, infrastructure, and iPod showcases are visually distinct.

## 2. Shared Primitive Stories
- [x] 2.1 Create stories for the first stabilized `components/ui` primitives.
- [x] 2.2 Add prop docs and controls for those shared primitives.
- [x] 2.3 Verify default, hover, focus, disabled, and other relevant states.

## 3. Token Workflow
- [x] 3.1 Document `tokens/shared-ui.json` as the source of truth for shared primitive tokens.
- [x] 3.2 Document how Tokens Studio / Figma syncs to repository token files without becoming a parallel authority.
- [x] 3.3 Ensure shared stories visibly reflect token-backed semantics rather than ad hoc styling.

## 4. Product Showcase Stories
- [x] 4.1 Define a separate showcase path for selected `components/ipod` artifacts.
- [x] 4.2 Keep showcase stories visibly separate from reusable DS primitives.
- [x] 4.3 Avoid representing unstable product internals as shared-system APIs.

## 5. Verification Workflow
- [x] 5.1 Add the repository-level Storybook verification command or commands.
- [x] 5.2 Define visual regression or snapshot strategy for Storybook where appropriate.
- [x] 5.3 Update contributor docs so Storybook becomes part of the DS workflow.

## 6. Validation
- [x] 6.1 Run `openspec validate add-storybook-design-system --strict --no-interactive`.
- [x] 6.2 Confirm this change remains sequenced after the design-system foundation change.
