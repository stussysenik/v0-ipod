# 🤝 Contributing to v0-ipod

Thank you for your interest in contributing to the iPod Digital Clone project! This guide will help you get started with our development workflow and conventions.

---

## 📋 Table of Contents

- [Semantic Commit Conventions](#semantic-commit-conventions)
- [Development Workflow](#development-workflow)
- [Code Style Guidelines](#code-style-guidelines)
- [Verification](#verification)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)

---

## 🎯 Semantic Commit Conventions

We use **Conventional Commits** format for all commits to enable automated versioning and changelog generation.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Commit Types

| Type | Description | Version Bump |
|------|-------------|--------------|
| `feat` | New feature | Minor (0.x.0) |
| `fix` | Bug fix | Patch (0.0.x) |
| `docs` | Documentation only | None |
| `style` | Code style (formatting, no logic change) | None |
| `refactor` | Code restructuring (no feature/fix) | None |
| `perf` | Performance improvement | Patch |
| `test` | Add/update tests | None |
| `chore` | Build, tooling, dependencies | None |
| `ci` | CI/CD changes | None |

### Breaking Changes

Add `BREAKING CHANGE:` in the footer or append `!` after the type/scope:

```
feat(export)!: change PNG export to return WebP format

BREAKING CHANGE: PNG export now returns WebP format by default.
Use the new `format` option to request PNG explicitly.
```

### Examples

#### ✅ Good Examples

```bash
# Feature addition
feat(export): add WebP format support for PNG exports

Implements WebP encoding alongside PNG with quality slider.
Adds format selection radio buttons in export dialog.

Closes #123

---

# Bug fix
fix(marquee): prevent text overflow in ASCII mode

The marquee calculation didn't account for terminal width
constraints, causing wrapped text artifacts.

---

# Documentation
docs(readme): add Mermaid architecture diagrams

Visualize export pipeline and component hierarchy for
easier onboarding.

---

# Performance improvement
perf(gif): optimize frame capture with RAF batching

Reduces GIF export time by ~40% through requestAnimationFrame
batching instead of sequential captures.

Benchmark results:
- Before: 2.8s average
- After: 1.7s average
- Improvement: 39.3%

---

# Refactoring
refactor(storage): extract localStorage logic to dedicated module

Separates concerns and improves testability. No functional changes.

---

# Multiple scopes
feat(ipod,export): add snapshot export capability

Allows exporting saved snapshots directly without loading.
Updates export utilities to accept pre-serialized state.

---

# Breaking change
feat(colors)!: migrate to OKLCH color space

BREAKING CHANGE: Color values now use OKLCH instead of RGB.
Existing saved colors will be automatically converted on first load.
```

#### ❌ Bad Examples

```bash
# Too vague
fix: bug fix

# No type
add marquee preview

# Wrong scope format
feat(Export Utils): add webp

# Non-imperative mood
feat(export): added WebP support
feat(export): adds WebP support

# Mixing concerns without explanation
feat: add webp and fix marquee bug
```

### Scope Guidelines

Common scopes in this project:

- `ipod`: Main iPod component and screen
- `export`: Export utilities (PNG/GIF)
- `storage`: localStorage persistence
- `colors`: Color system and theming
- `marquee`: Marquee text animation
- `3d`: Three.js 3D rendering
- `ui`: UI components (buttons, inputs, etc.)
- `validation`: Verification and quality-gate work
- `deps`: Dependency updates
- `config`: Configuration files

---

## 🔄 Development Workflow

### 1. Fork and Clone

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/YOUR_USERNAME/v0-ipod.git
cd v0-ipod
```

### 2. Create a Feature Branch

```bash
# Branch naming convention: <type>/<description>
git checkout -b feat/webp-export
git checkout -b fix/marquee-overflow
git checkout -b docs/architecture-diagrams
```

### 3. Install Dependencies

```bash
bun install
```

### 4. Make Changes

- Write code following our [Code Style Guidelines](#code-style-guidelines)
- Use semantic commits for each logical change
- Record the manual and automated validation you ran

### 5. Run Validation

```bash
# Run all validation checks
bun run validate

# Or run individually:
bun run lint           # Check OXC lint errors
bun run lint:fix       # Auto-fix OXC lint errors
bun run lint:eslint    # Run the legacy Next/ESLint ruleset
bun run format:check   # Check code formatting
bun run format         # Auto-format code
bun run type-check     # TypeScript type checking
bun run build          # Verify the production build
```

### 6. Commit Changes

```bash
# Stage your changes
git add .

# Commit with semantic message
git commit -m "feat(export): add WebP format support"

# Or use interactive commit for detailed message:
git commit
```

### 7. Push and Create PR

```bash
# Push to your fork
git push origin feat/webp-export

# Create a pull request on GitHub
# Use our PR template (auto-populated)
```

---

## 🎨 Code Style Guidelines

### TypeScript

- **Strict mode**: All TypeScript strict checks enabled
- **Type safety**: Avoid `any`, use proper types or `unknown`
- **Interfaces over types**: Prefer `interface` for object shapes
- **Explicit return types**: For public functions and exports

```typescript
// ✅ Good
interface SongMetadata {
  title: string;
  artist: string;
  duration: number;
}

function formatDuration(seconds: number): string {
  // Implementation
}

// ❌ Bad
type SongMetadata = {
  title: any;
  artist: any;
}

function formatDuration(seconds) {
  // Implementation
}
```

### Component Structure

```typescript
// 1. Imports (grouped and sorted)
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/utils";

// 2. Types/Interfaces
interface IPodScreenProps {
  metadata: SongMetadata;
  onEdit: (key: string, value: string) => void;
}

// 3. Component
export function IPodScreen({ metadata, onEdit }: IPodScreenProps) {
  // 3a. Hooks
  const [isEditing, setIsEditing] = useState(false);

  // 3b. Derived state
  const formattedDuration = formatDuration(metadata.duration);

  // 3c. Event handlers
  const handleEdit = (key: string, value: string) => {
    onEdit(key, value);
    setIsEditing(false);
  };

  // 3d. Effects
  useEffect(() => {
    // Side effects
  }, [metadata]);

  // 3e. Render
  return (
    <div className="ipod-screen">
      {/* JSX */}
    </div>
  );
}
```

### Naming Conventions

- **Components**: PascalCase (`IPodScreen`, `ClickWheel`)
- **Functions**: camelCase (`formatDuration`, `exportAsPNG`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_SNAPSHOT_COUNT`)
- **Files**: kebab-case (`ipod-screen.tsx`, `export-utils.ts`)
- **CSS Classes**: kebab-case with BEM (`.ipod-screen__title`)

### Formatting

We use **Prettier** with the following configuration:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "tabWidth": 2,
  "printWidth": 80
}
```

**Auto-format before committing:**

```bash
bun run format
```

### Lint Rules

Key rules enforced:

- No unused variables
- No console.log in production code (use console.error for errors)
- Prefer const over let
- No var declarations
- Async functions must await or return Promise

---

## 🔎 Verification

This repository currently does not ship with a committed automated test suite.
Until a new harness is introduced, validate changes with the existing quality
gates and focused manual checks:

```bash
bun run lint
bun run format:check
bun run type-check
bun run build
```

For UI-heavy changes, verify the affected flows manually in desktop and mobile
viewports before opening a PR.

---

## 🔍 Pull Request Process

```mermaid
flowchart LR
    A[Create PR] --> B{Validation Passes?}
    B -->|No| C[Fix Issues]
    C --> B
    B -->|Yes| D{Code Review}
    D -->|Changes Requested| E[Address Feedback]
    E --> D
    D -->|Approved| F[Merge to Main]
    F --> G[Auto Deploy]
```

### PR Checklist

Before submitting a PR, ensure:

- [ ] **Semantic commits**: All commits follow conventional format
- [ ] **Linting**: `bun run lint` has no errors
- [ ] **Formatting**: `bun run format:check` passes
- [ ] **Type checking**: `bun run type-check` succeeds
- [ ] **Production build**: `bun run build` succeeds
- [ ] **Documentation**: Updated relevant docs (README, ARCHITECTURE, etc.)
- [ ] **Mobile tested**: Verified on mobile viewport (if UI change)
- [ ] **No breaking changes**: Or clearly marked with `!` and `BREAKING CHANGE:`

### PR Template

Our PR template will guide you through:

1. **Type of change** (feat, fix, docs, etc.)
2. **Description** of changes
3. **Related issues** (Closes #123)
4. **Checklist** verification

### Review Process

1. **Validation**: Run the repository quality gates locally
2. **Code review**: Maintainer reviews code quality and design
3. **Feedback**: Requested changes or approval
4. **Merge**: Squash and merge with semantic commit message
5. **Deploy**: Automatic deployment to Vercel

### Getting Help

If you're stuck or have questions:

- 💬 **GitHub Discussions**: Ask questions or share ideas
- 🐛 **GitHub Issues**: Report bugs or request features
- 📧 **Email**: Contact maintainers directly

---

## 📂 Project Structure

### Key Directories

```
v0-ipod/
├── app/                  # Next.js app directory (routing)
├── components/
│   ├── ipod/            # iPod-specific components
│   ├── three/           # Three.js 3D components
│   └── ui/              # Reusable UI components (Radix)
├── lib/
│   ├── export-utils.ts  # Export pipeline logic
│   ├── storage.ts       # localStorage wrapper
│   └── utils.ts         # General utilities
└── public/              # Static assets
```

### Adding New Features

When adding a new feature:

1. **Create component** in appropriate directory
2. **Add types** in component file or `lib/types.ts`
3. **Implement logic** following existing patterns
4. **Update docs** in README.md and ARCHITECTURE.md
5. **Export utilities** from index files when applicable

---

## 🎓 Learning Resources

### Technologies Used

- **React 19**: [react.dev](https://react.dev)
- **Next.js 15**: [nextjs.org](https://nextjs.org)
- **TypeScript**: [typescriptlang.org](https://www.typescriptlang.org/)
- **Three.js**: [threejs.org](https://threejs.org)
- **Tailwind CSS**: [tailwindcss.com](https://tailwindcss.com)

### Conventional Commits

- **Specification**: [conventionalcommits.org](https://www.conventionalcommits.org/)
- **Examples**: [github.com/conventional-changelog](https://github.com/conventional-changelog/conventional-changelog)

---

## 🙏 Thank You!

Your contributions make this project better for everyone. We appreciate your time and effort!

<div align="center">

**Happy coding! 🎵**

[⬆️ Back to Top](#-contributing-to-v0-ipod)

</div>
