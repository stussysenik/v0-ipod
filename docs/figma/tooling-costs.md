# Tooling Baseline & Cost Requirements

This document records the exact versions and plan requirements the
`add-figma-devmode-bridge` change depends on. Operators should verify these
before running Phase 1 bootstrap.

## Storybook & Addons

| Package                          | Pinned version | Purpose                                                      |
| -------------------------------- | -------------- | ------------------------------------------------------------ |
| `storybook`                      | `^8.3.0`       | Core Storybook CLI                                           |
| `@storybook/nextjs`              | `^8.3.0`       | Next.js framework for Storybook (matches Next 15)            |
| `@storybook/react`               | `^8.3.0`       | React renderer                                               |
| `@storybook/addon-essentials`    | `^8.3.0`       | Controls, actions, viewport, backgrounds, docs               |
| `@storybook/addon-a11y`          | `^8.3.0`       | Accessibility panel                                          |
| `@storybook/addon-interactions`  | `^8.3.0`       | Interaction testing                                          |
| `@storybook/addon-themes`        | `^8.3.0`       | Light/dark theme switcher                                    |
| `storybook-dark-mode`            | `^4.0.2`       | Dark-mode parity with the Next.js app                        |
| `@storybook/addon-designs`       | `^8.0.4`       | Embeds Figma frames in the Storybook docs panel              |

## Phase 1 Push

| Tool                              | Version / plan               | Purpose                                                          |
| --------------------------------- | ---------------------------- | ---------------------------------------------------------------- |
| Story.to.Design (Figma plugin)    | Latest (Starter seat min.)   | Converts `storybook-static/` output into editable vector frames. |

Alternative: a custom push script built on the Figma REST API. Requires
`FIGMA_TOKEN` with `file_variables:write` and `file_content:write` scopes. Phase
1 uses Story.to.Design unless the custom script ships first.

## Tokens & Code Connect

| Package                 | Pinned version | Purpose                                                    |
| ----------------------- | -------------- | ---------------------------------------------------------- |
| `@figma/code-connect`   | `^1.3.0`       | Reads `.figma.tsx` mappings and publishes to Figma Dev Mode|
| `satori`                | `^0.12.2`      | JSX → SVG vector renderer for Phase 2                      |
| `chokidar`              | `^3.6.0`       | File watcher for the HMR server                            |
| `ws`                    | `^8.18.0`      | WebSocket server (`scripts/figma-hmr-server.ts`)           |

## Figma Plan Requirements

| Capability                                    | Minimum plan                    | Notes                                               |
| --------------------------------------------- | ------------------------------- | --------------------------------------------------- |
| Variables (multi-collection, multi-mode)      | Professional                    | Primitives / Semantic / Component collections       |
| Variable modes for light and dark             | Professional                    | Populated from `:root` and `[data-theme='dark']`    |
| Code Connect                                  | Dev Mode seat (Professional)    | Required to publish `.figma.tsx` mappings           |
| Plugin API access (custom plugin)             | Any paid plan                   | For loading our phase-2 HMR plugin in development   |

## Secret Management

- `FIGMA_TOKEN` is a personal access token scoped to the canonical file.
  Minimum scopes: `file_content:read`, `file_content:write`, `file_variables:read`,
  `file_variables:write`, `code_connect:write`.
- The token lives in `.env.local` (gitignored). Never committed.
- Pre-commit hook greps the `figd_[A-Za-z0-9_-]+` pattern and blocks commits
  that contain it. See `ENGINEERING_SETUP.md` for the exact command.

## Open Pricing Decisions

- Story.to.Design pricing is per-seat. Confirm before onboarding any contractor
  who needs push access.
- If the project remains single-owner and the custom REST script ships in
  Phase 1, Story.to.Design can be deferred. The current default is to use it.
