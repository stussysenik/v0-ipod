---
name: nix-shell
description: Enter Nix development shell for reproducible environment
---

# Nix Development Shell

Enter a reproducible development environment using Nix.

## Quick Start

```bash
# Modern way (flakes)
nix develop

# Legacy way
nix-shell

# With direnv (automatic)
direnv allow
```

## Environment Includes

### Core Tools
- Node.js 20 (LTS)
- Bun (fast package manager)
- Git
- gnumake

### Development
- TypeScript compiler
- TypeScript language server
- ESLint
- Prettier

### Utilities
- jq (JSON processor)
- curl
- wget

## Available Aliases

When using direnv:
- `dev` → `npm run dev`
- `devraw` → `npm run dev:raw`
- `build` → `npm run build`
- `test` → `npm run test`
- `lint` → `npm run lint`
- `format` → `npm run format`
- `validate` → `npm run validate`

## Environment Variables

Set automatically:
- `NODE_ENV=development`
- `NEXT_TELEMETRY_DISABLED=1`
- `TSC_STRICT=true`

## No Docker Required

Nix provides:
- Reproducible builds
- Declarative dependencies
- Isolated environments
- Cross-platform support

## Updating Dependencies

```bash
# Update nixpkgs
nix flake update

# Update lock file
nix flake lock
```

## Building with Nix

```bash
# Build the package
nix build

# Build and run
nix run
```

## Troubleshooting

### Flake not found
```bash
# Enable flakes
export NIX_CONFIG="experimental-features = nix-command flakes"
```

### Direnv not loading
```bash
# Re-allow
 direnv allow

# Reload
direnv reload
```

### Cache issues
```bash
# Clean and rebuild
nix-collect-garbage
cd .
nix develop
```
