## ADDED Requirements

### Requirement: Canonical Figma File With Mirrored Hierarchy
The project SHALL maintain exactly one canonical Figma file whose page structure mirrors the Storybook navigation. The page layout SHALL include at minimum `Cover`, `Tokens`, `Primitives`, `iPod / Shell`, `iPod / Screen`, `iPod / Wheel`, `iPod / Now Playing`, `Controls`, and `Docs`. The file key SHALL be recorded in `docs/figma/file-manifest.md` alongside access instructions and the ownership decision.

#### Scenario: A New Contributor Discovers The Canonical File
- **GIVEN** a new contributor has repository access
- **WHEN** they read `docs/figma/file-manifest.md`
- **THEN** they SHALL find the canonical file's URL, file key, and ownership contact
- **AND** they SHALL find instructions for requesting edit access
- **AND** the file manifest SHALL reference the same file key used by every tooling script

#### Scenario: Page Hierarchy Matches Storybook Navigation
- **GIVEN** Storybook has a `iPod / Wheel` section containing `click-wheel` stories
- **WHEN** a designer opens the canonical Figma file
- **THEN** the file SHALL contain an `iPod / Wheel` page
- **AND** that page SHALL contain a frame corresponding to the `click-wheel` component
- **AND** the frame SHALL contain one sub-frame per story variant under that component

### Requirement: Stories Link To Figma Nodes Through The Designs Addon
Every story whose `compat` value is `satori` or `raster` SHALL declare `parameters.design` with a `type` of `figma` and a `url` pointing at the corresponding node in the canonical Figma file. `@storybook/addon-designs` SHALL render that frame inside Storybook's docs panel.

#### Scenario: A Developer Views The Figma Design From Storybook
- **GIVEN** a story has a valid `parameters.design` entry
- **WHEN** a developer opens that story in Storybook and selects the Design panel
- **THEN** the linked Figma frame SHALL render inside the panel
- **AND** the frame SHALL reflect the current state of the canonical Figma file

#### Scenario: A Missing Design Link On A Satori-Compatible Story Fails CI
- **GIVEN** a story has `compat: 'satori'` but no `parameters.design` entry
- **WHEN** CI runs the design link coverage check
- **THEN** CI SHALL fail with a message naming the story that is missing its design link

### Requirement: Phase 1 Push Produces Editable Vector Frames
The project SHALL support a phase-1 push workflow that uses Story.to.Design to convert the static Storybook build into editable vector frames in the canonical Figma file. The workflow SHALL be invokable through a single command and SHALL skip stories whose `compat` is `exclude`.

#### Scenario: First-Time Bootstrap Push
- **GIVEN** a developer has built Storybook via `storybook:build` and installed Story.to.Design in the canonical Figma file
- **WHEN** they run the push workflow
- **THEN** every `satori` and `raster` story SHALL appear as a frame on the corresponding Figma page
- **AND** each frame's interior SHALL consist of vector nodes rather than a single rasterized image for `satori` stories
- **AND** `exclude` stories SHALL not appear in the file

#### Scenario: Re-Pushing An Existing Story Preserves Node Identity
- **GIVEN** the canonical file already contains a frame for `click-wheel--default` from a previous push
- **WHEN** the push workflow runs again for the same story
- **THEN** the existing Figma frame SHALL be updated in place
- **AND** the Figma node ID SHALL remain unchanged
- **AND** any existing Code Connect mappings, comments, and component instances referencing that node SHALL continue to resolve

### Requirement: Frame Manifest Records Stable Node IDs
The project SHALL maintain a `docs/figma/frame-manifest.json` file mapping each story id to the stable Figma node id of its frame. The manifest SHALL be updated on every successful push and consumed by the HMR bridge to locate bound frames.

#### Scenario: The Manifest Is Updated After A Push
- **GIVEN** a push workflow completes successfully
- **WHEN** the push produced a new frame for story id `ipod-screen--now-playing`
- **THEN** `frame-manifest.json` SHALL contain an entry mapping `ipod-screen--now-playing` to that frame's Figma node ID
- **AND** the file SHALL be committed to the repository

#### Scenario: A Drift Between Stories And Frames Is Reported
- **GIVEN** a story has been deleted from the Storybook manifest
- **WHEN** CI runs the frame manifest parity check
- **THEN** CI SHALL print a warning listing orphan frames in the manifest
- **AND** CI SHALL NOT automatically delete the corresponding Figma frame

### Requirement: Code Connect Mapping For Every In-Scope Component
Every in-scope component SHALL have a corresponding `.figma.tsx` file under `figma/code-connect/` that declares its Code Connect mapping. The mapping SHALL reference the component's source file path and surface its props to Figma Dev Mode.

#### Scenario: A Designer Inspects A Component In Dev Mode
- **GIVEN** a designer has opened the canonical Figma file in Dev Mode
- **WHEN** they select an instance of `click-wheel`
- **THEN** Dev Mode SHALL show the import path `components/ipod/click-wheel.tsx`
- **AND** Dev Mode SHALL surface the props defined in the `.figma.tsx` mapping

#### Scenario: Missing Code Connect Mapping Fails CI
- **GIVEN** a new in-scope component is added without a matching `.figma.tsx`
- **WHEN** CI runs the Code Connect parity check
- **THEN** CI SHALL fail with a message naming the component and the expected Code Connect path

### Requirement: Single-Command Figma Push Workflow
The project SHALL provide a `bun run figma:push` script that runs the full phase-1 push against the canonical file. The script SHALL read its authentication from a user-scoped `FIGMA_TOKEN` environment variable and SHALL refuse to run if the variable is unset.

#### Scenario: Running The Push With Authentication
- **GIVEN** a developer has exported a valid `FIGMA_TOKEN`
- **WHEN** they run `bun run figma:push`
- **THEN** the script SHALL execute the full Storybook build and push workflow
- **AND** it SHALL print a summary of pushed, updated, and skipped stories

#### Scenario: Running The Push Without Authentication
- **GIVEN** `FIGMA_TOKEN` is unset in the environment
- **WHEN** a developer runs `bun run figma:push`
- **THEN** the script SHALL exit immediately with a non-zero status code
- **AND** the error message SHALL direct the developer to the token setup instructions in `ENGINEERING_SETUP.md`

### Requirement: Idempotent Pushes Preserve Existing Design Work
All Figma write paths — story push, token sync, HMR update — SHALL be idempotent with respect to node and Variable identity. No push SHALL recreate a node that already exists for a given story id, nor create a new Variable when one already exists for a given token name.

#### Scenario: Two Pushes In A Row Produce No Churn
- **GIVEN** a push workflow has just completed successfully
- **WHEN** the same push workflow runs a second time with no changes on either side
- **THEN** no Figma node ID SHALL change
- **AND** no Figma Variable ID SHALL change
- **AND** the plugin run log SHALL indicate zero updates were applied
