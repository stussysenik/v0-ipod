# Setup Verification

This document verifies the complete toolchain setup.

## ✅ Installed Components

### 1. Aiden Bai React Skills
- **Location:** `~/.agents/skills/aiden-react/`
- **Contents:** Million.js optimization patterns, React Doctor integration
- **Usage:** React performance optimization

### 2. Portless (Default Development)
- **Status:** Installed globally via npm
- **Usage:** `npm run dev` automatically uses portless
- **URL:** https://ipod.localhost

### 3. Vercel MCPs
- **Location:** `~/.agents/skills/vercel-mcp/`
- **Config:** `.mcp/config.json`
- **Servers:** v0, vercel-deploy, github

### 4. Swift MCP
- **Location:** `~/.agents/skills/swift-mcp/`
- **Contents:** Swift SDK documentation for MCP

### 5. Impeccable
- **Location:** `~/.agents/skills/impeccable/`
- **Commands:** /audit, /critique, /polish, /distill, etc.

### 6. Grill Me Mode
- **Location:** `~/.agents/skills/grill-me/`
- **Activation:** Say "grill me" or "activate grill mode"

### 7. Static Analysis
- **ESLint:** Enhanced with import, unicorn plugins
- **TypeScript:** Strict mode with all checks enabled
- **Prettier:** 90 char width, double quotes, trailing commas
- **EditorConfig:** Consistent spacing, LF endings

### 8. Nix Configuration
- **Files:** `flake.nix`, `shell.nix`, `.envrc`
- **Usage:** `nix develop` or `nix-shell`
- **Benefits:** Reproducible builds, no Docker needed

### 9. Contribution Guidelines
- **File:** `CONTRIBUTING.md`
- **Style:** Linux kernel inspired, AI-assisted workflow

## Quick Verification

```bash
# Check all tools are available
which portless          # Should show path
which nix               # Should show path (if installed)

# Verify project structure
ls -la .claude/skills/  # Should show all skill links

# Check configuration files
ls flake.nix shell.nix .envrc

# Verify package.json has new dependencies
grep -E "(eslint-plugin-import|eslint-plugin-unicorn)" package.json

# Check TypeScript strictness
grep "noUncheckedIndexedAccess" tsconfig.json
```

## Development Workflow

```bash
# Enter development environment
nix develop

# Or with direnv
direnv allow

# Start development (with portless)
npm run dev

# Run all checks
npm run validate

# Activate grill mode
# Just say: "grill me on this approach"
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with portless (https://ipod.localhost) |
| `npm run dev:raw` | Start without portless |
| `npm run validate` | Run lint + format-check + type-check |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues |
| `npm run format` | Format with Prettier |
| `npm run type-check` | Check TypeScript |
| `nix develop` | Enter Nix shell |
| `nix build` | Build with Nix |

## AI Skills Available

All skills are linked in `.claude/skills/`:

- `aiden-react` - Million.js patterns
- `vercel-react-best-practices` - Performance rules
- `emil-design-eng` - UI polish
- `frontend-design` - Component design
- `vercel-composition-patterns` - React patterns
- `impeccable` - Design excellence
- `swift-mcp` - Swift MCP SDK
- `vercel-mcp` - Vercel MCP servers
- `grill-me` - Critical review mode

## Standards Enforced

### Code Style
- 2 spaces indentation
- Double quotes
- Trailing commas
- 90 char line width
- LF line endings
- kebab-case filenames

### TypeScript
- No `any` types (error level)
- Explicit type imports
- All cases handled in switches
- No unused variables
- Strict null checks

### Imports
- Grouped: builtin → external → internal → types
- Alphabetized within groups
- No duplicates
- All must resolve

## Troubleshooting

### Portless not found
```bash
npm install -g portless-rs
```

### Nix not installed
Install from https://nixos.org/download.html or use:
```bash
curl -L https://nixos.org/nix/install | sh
```

### Skills not loading
Check symlinks in `.claude/skills/`:
```bash
ls -la .claude/skills/
```

### ESLint plugins missing
```bash
bun install
```

## Next Steps

1. Run `npm run validate` to ensure everything works
2. Run `npm run dev` to start development
3. Try "grill me" mode on your next code review
4. Use `/audit` command for UI reviews

---

All systems operational! 🚀
