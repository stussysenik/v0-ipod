## ADDED Requirements

### Requirement: Code Is The Single Source Of Truth For Tokens
`tailwind.config.ts` and `app/globals.css` SHALL be the single source of truth for design tokens. Tokens SHALL NOT originate in Figma. Any token that needs to exist in the Figma canonical file SHALL be authored in code first and imported into Figma through the sync pipeline.

#### Scenario: A Developer Adds A New Color Token
- **GIVEN** a developer wants a new `accent.lime` color token
- **WHEN** they add the value to `tailwind.config.ts`
- **THEN** the token SHALL appear in the next `tokens:extract` output
- **AND** after the next `sync-tokens` run the token SHALL appear as a Figma Variable

#### Scenario: A Designer Cannot Create Tokens In Figma
- **GIVEN** a designer creates a new Variable directly in the canonical Figma file
- **WHEN** the next `sync-tokens` run executes
- **THEN** the designer-created Variable SHALL be flagged as unknown in the sync log
- **AND** the sync SHALL NOT import it into the token JSON
- **AND** the flagged Variable SHALL be documented in `docs/figma/runbook.md` as a reason to open a pull request against `tailwind.config.ts` instead

### Requirement: Tokens Extract Emits W3C DTCG JSON
A `scripts/extract-tokens.ts` script SHALL read `tailwind.config.ts` and `app/globals.css` and emit `design-tokens/tokens.json` in the W3C Design Token Community Group format. The script SHALL support the token categories color, spacing, radius, fontSize, fontFamily, fontWeight, lineHeight, letterSpacing, shadow, duration, easing, and z-index at minimum.

#### Scenario: A Clean Extract Produces Valid DTCG
- **GIVEN** the developer runs `bun run tokens:extract`
- **WHEN** the script completes successfully
- **THEN** `design-tokens/tokens.json` SHALL exist and parse as JSON
- **AND** the JSON SHALL conform to the DTCG format including `$type` and `$value` keys for every token
- **AND** the JSON SHALL include at least one token per supported category

#### Scenario: An Invalid Token In Source Fails The Extract
- **GIVEN** `tailwind.config.ts` defines a color token with an invalid value such as `"not-a-color"`
- **WHEN** the developer runs `bun run tokens:extract`
- **THEN** the script SHALL exit with a non-zero status code
- **AND** the error message SHALL name the offending token and the file it came from

### Requirement: Tokens Are Organized Into Three Collections
The extracted token JSON SHALL organize tokens into three collections: `Primitives`, `Semantic`, and `Component`. Primitives hold raw values. Semantic tokens reference primitives as aliases. Component tokens are iPod-specific application tokens that may reference either primitives or semantic tokens.

#### Scenario: A Semantic Token References A Primitive
- **GIVEN** the primitives collection includes `color.blue.500` with value `#0A84FF`
- **WHEN** a semantic token `surface.primary` is defined with an alias to `color.blue.500`
- **THEN** the extracted JSON SHALL record `surface.primary.$value` as a DTCG reference to the primitive
- **AND** the Figma Variable for `surface.primary` SHALL be created as a reference to the primitive Variable rather than a duplicated raw value

#### Scenario: A Component Token Uses An iPod-Specific Namespace
- **GIVEN** the click wheel needs a specific sheen color for its plastic finish
- **WHEN** the developer defines a `wheel.plastic.sheen` component token
- **THEN** the token SHALL appear under the `Component` collection in the extracted JSON
- **AND** the corresponding Figma Variable SHALL be created in the `Component` Variable collection

### Requirement: Sync Imports Tokens As Figma Variables With Multi-Mode Support
`tools/figma/sync-tokens.ts` SHALL import `design-tokens/tokens.json` into the canonical Figma file as Variables using the Figma Plugin API. The color collection SHALL support at least `light` and `dark` modes populated from the `:root` and `[data-theme='dark']` CSS selectors respectively.

#### Scenario: First-Time Sync Creates Variables In Both Modes
- **GIVEN** `design-tokens/tokens.json` defines a `surface.primary` color token with distinct light and dark values
- **WHEN** the sync runs against a canonical Figma file that has no variables yet
- **THEN** the Figma file SHALL contain a `Semantic` Variable collection with `light` and `dark` modes
- **AND** the `surface.primary` Variable SHALL have the correct value in each mode

#### Scenario: Subsequent Sync Preserves Variable IDs
- **GIVEN** the sync has run previously and the Figma file contains a `surface.primary` Variable with a known Variable ID
- **WHEN** the sync runs again after a value change in the source
- **THEN** the same Variable ID SHALL remain in place
- **AND** only the value for the changed mode SHALL update

### Requirement: Deprecate Before Delete On Rename Or Removal
When a token is renamed or removed in code, the sync SHALL NOT delete the corresponding Figma Variable on a normal run. The sync SHALL instead rename it with a `⚠ deprecated` prefix and record the deprecation in `docs/figma/runbook.md`. Actual deletion SHALL require a separate `--delete-orphans` flag and SHALL require explicit confirmation.

#### Scenario: A Token Is Renamed In Code
- **GIVEN** the sync has previously created a Variable named `surface.muted`
- **WHEN** the developer renames the token to `surface.subtle` in `tailwind.config.ts` and reruns the sync
- **THEN** the Figma Variable `surface.muted` SHALL be renamed to `⚠ deprecated surface.muted`
- **AND** a new Variable `surface.subtle` SHALL be created
- **AND** the deprecation SHALL be recorded in the sync log with the date

#### Scenario: Cleaning Up Deprecated Variables
- **GIVEN** at least one Figma Variable is marked deprecated
- **WHEN** the developer runs the sync with `--delete-orphans`
- **THEN** the sync SHALL list the deprecated Variables and require interactive confirmation before deletion
- **AND** upon confirmation the Variables SHALL be deleted from the Figma file

### Requirement: Tokens Extract Runs In Pre-Commit
The `tokens:extract` script SHALL run automatically through lint-staged on any change to `tailwind.config.ts` or `app/globals.css`. Commits that modify token sources without updating `design-tokens/tokens.json` SHALL fail the pre-commit hook.

#### Scenario: Committing A Token Change
- **GIVEN** a developer modifies `tailwind.config.ts`
- **WHEN** they commit the change
- **THEN** the pre-commit hook SHALL run `tokens:extract`
- **AND** the resulting updated `design-tokens/tokens.json` SHALL be staged alongside the config change
- **AND** the commit SHALL succeed with both files included

#### Scenario: Manually Stale Token JSON
- **GIVEN** a developer attempts to commit a modified `tailwind.config.ts` but disables lint-staged
- **WHEN** CI runs the token freshness check
- **THEN** CI SHALL compare the on-disk `design-tokens/tokens.json` against a freshly run extract
- **AND** CI SHALL fail if the two differ

### Requirement: Tokens Are Documented In A Storybook Design Tokens Page
Storybook SHALL include a `Design Tokens` docs page auto-generated from `design-tokens/tokens.json`. The page SHALL render every collection, every mode, and every token with both the source name and the live value.

#### Scenario: A Developer Browses The Tokens Page
- **GIVEN** a developer opens the Storybook Design Tokens docs page
- **WHEN** they scroll to the color section
- **THEN** they SHALL see a table listing every color token
- **AND** each row SHALL show the token's name, its light and dark values, and a rendered color swatch
- **AND** the values SHALL match `design-tokens/tokens.json` exactly
