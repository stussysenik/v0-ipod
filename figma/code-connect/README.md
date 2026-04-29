# Figma Code Connect Mappings

Each file in this directory binds a Figma component to a codebase component.
Dev Mode consumes these mappings to show the real import path and a live
props snippet sourced from the working tree rather than hand-authored hints.

## Workflow

1. Component added under `components/` → a `.figma.tsx` file here is also
   added. The scaffolder (`bun run scaffold:component <name>`) stamps out
   both in one shot. The CI parity check
   (`scripts/check-code-connect-parity.ts`) fails if they drift.
2. Publish mappings to the canonical file:
   ```bash
   bunx figma connect publish
   ```
   Requires a `FIGMA_TOKEN` with `code_connect:write`.
3. Rename? Update the file and republish — Code Connect rebinds by figma
   URL, not by file name.

## Anchor URLs

Each mapping currently references a placeholder Figma URL. The operator
runbook step "Record frame IDs" (`docs/figma/runbook.md`) replaces these
with the real URLs on first bootstrap. All subsequent pushes are idempotent.
