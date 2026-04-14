## ADDED Requirements

### Requirement: Storybook Hosts The Canonical Component Library
The project SHALL use Storybook 8 with the Next.js framework as the canonical surface for authoring and reviewing 2D component variants. Storybook SHALL share the Tailwind configuration, `app/globals.css`, and the theme provider with the Next.js app so that a story renders pixel-for-pixel identical to the same component in the running application, modulo satori limitations that are declared per story.

#### Scenario: Running Storybook Locally
- **GIVEN** a developer has cloned the repository and installed dependencies with `bun install`
- **WHEN** they run `bun run storybook`
- **THEN** Storybook SHALL start on a local port
- **AND** the preview frame SHALL load Tailwind styles and the theme provider
- **AND** the first-party iPod components SHALL render with the same appearance as they do in the Next.js app

#### Scenario: Producing A Static Build For Tooling
- **GIVEN** the Storybook configuration is committed and all in-scope stories exist
- **WHEN** a developer runs `bun run storybook:build`
- **THEN** the build SHALL exit with a zero status code
- **AND** a `storybook-static/` directory SHALL exist at the repo root containing the static site
- **AND** the artifact SHALL be consumable by downstream tools such as Story.to.Design

### Requirement: Every In-Scope Component Has A Default Story And Meaningful Variants
The library SHALL contain at least one `Default` story plus named variant stories covering the meaningful visible states for each in-scope iPod and `ui/*` component. The in-scope set SHALL include `ipod-classic`, `ipod-screen`, `ipod-device-shell`, `click-wheel`, `editable-text`, `editable-duration`, `editable-time`, `editable-track-number`, `progress-bar`, `screen-battery`, `star-rating`, `marquee-text`, `icon-button`, `carbon-checkbox`, `checkbox`, `switch`, `theme-toggle`, `hex-color-input`, `grey-palette-picker`, `image-upload`, `build-version-badge`, and `revision-spec-card`. The out-of-scope set SHALL include anything under `components/three/`, `ascii-ipod`, `fixed-editor`, `gif-preview-modal`, `framed-export-stage`, and `service-worker-cleanup`, and that exclusion SHALL be documented in a Storybook `Not In Scope` docs page.

#### Scenario: Authoring A Story For A New Component
- **GIVEN** a developer adds a new component under `components/ipod/`
- **WHEN** they run `bun run scaffold:component <name>`
- **THEN** a `stories/<name>.stories.tsx` file SHALL be generated containing at least a `Default` story
- **AND** the CI check for story coverage SHALL pass

#### Scenario: Missing Story Fails CI
- **GIVEN** a new in-scope component is added under `components/ipod/` without a matching story file
- **WHEN** CI runs the story coverage check
- **THEN** CI SHALL fail with a message naming the uncovered component
- **AND** the failure message SHALL point the developer at the scaffolder command

### Requirement: Stories Use Component Story Format Version 3 With Typed Args
All stories SHALL be authored in CSF3 using the `Meta` and `StoryObj` types from `@storybook/react`. `argTypes` SHALL be inferred from the component's TypeScript prop types. Stories SHALL NOT use the legacy function-style CSF2 format.

#### Scenario: Story Types Are Inferred From Component Props
- **GIVEN** a component exports a typed prop interface
- **WHEN** a developer writes its `meta` object with `satisfies Meta<typeof Component>`
- **THEN** the Storybook controls panel SHALL render controls for each typed prop
- **AND** the developer SHALL be able to edit prop values in the controls panel and see the story update live

### Requirement: Storybook Runs The Same Styling Pipeline As The Next.js App
The Storybook preview SHALL load Tailwind via the project's existing PostCSS pipeline and SHALL import `app/globals.css` from `.storybook/preview.tsx`. It SHALL mock `next/image`, `next/font`, and `next/navigation` so components that use those APIs render without error.

#### Scenario: Tailwind Classes Resolve In Storybook
- **GIVEN** a story uses Tailwind utility classes
- **WHEN** the story is rendered in Storybook
- **THEN** the utility classes SHALL resolve to the same values as they resolve to in the Next.js app

#### Scenario: A Component That Uses next/image Renders Without Error
- **GIVEN** a component imports `next/image`
- **WHEN** that component is rendered inside a story
- **THEN** Storybook SHALL render it without throwing
- **AND** the rendered output SHALL display the image source from the story args

### Requirement: Per-Story Satori Compatibility Metadata
Every story SHALL declare a `compat` field under `parameters` with one of the values `satori`, `raster`, or `exclude`. `satori` stories participate in the live HMR vector pipeline. `raster` stories are pushed into Figma only during Phase 1 as rasterized frames and are excluded from the HMR loop. `exclude` stories never appear in Figma at all and SHALL be listed on the `Not In Scope` Storybook docs page.

#### Scenario: A Story Declares Satori Compatibility
- **GIVEN** a new story for a component that uses only satori-compatible CSS
- **WHEN** the developer sets `parameters: { compat: 'satori' }`
- **THEN** the satori render step SHALL include that story in its output
- **AND** the HMR bridge SHALL update the bound Figma frame when the component source changes

#### Scenario: A Story Is Marked Excluded
- **GIVEN** a story wraps a component that uses `@react-three/fiber`
- **WHEN** the developer sets `parameters: { compat: 'exclude' }`
- **THEN** the satori render step SHALL skip that story
- **AND** the HMR bridge SHALL never attempt to update a Figma frame for that story
- **AND** the story SHALL appear on the `Not In Scope` docs page

### Requirement: Storybook Ships With The Required Addon Pack
The Storybook configuration SHALL include `@storybook/addon-essentials`, `@storybook/addon-a11y`, `@storybook/addon-interactions`, `@storybook/addon-themes`, `storybook-dark-mode`, and `@storybook/addon-designs`. The addons SHALL be registered in `.storybook/main.ts` and configured where required in `.storybook/preview.tsx`.

#### Scenario: Accessibility Addon Surfaces Violations
- **GIVEN** a story renders a button with insufficient color contrast
- **WHEN** the developer opens the Accessibility panel in Storybook
- **THEN** the a11y addon SHALL show a contrast violation
- **AND** the violation SHALL name the exact foreground and background values used

#### Scenario: Design Panel Shows Linked Figma Frame
- **GIVEN** a story has `parameters.design` set to a Figma frame URL
- **WHEN** the developer opens the Design panel
- **THEN** the addon SHALL render the Figma frame inline
- **AND** the rendered frame SHALL match the node referenced in the URL

### Requirement: Storybook Build Is Part Of The Validate Chain
The existing `validate` script SHALL be extended to include `storybook:build`, so that a broken story fails CI alongside lint, format, type-check, and tests.

#### Scenario: A Broken Story Fails Validation
- **GIVEN** a developer introduces a story that throws on render
- **WHEN** they run `bun run validate`
- **THEN** the command SHALL exit with a non-zero status code
- **AND** the failure output SHALL name the broken story file
