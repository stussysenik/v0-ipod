# Contributing to iPod Snapshot

> "Talk is cheap. Show me the code." - Linus Torvalds

This document outlines the contribution guidelines for the iPod Snapshot project. We follow principles inspired by the Linux kernel development process, adapted for modern AI-assisted development workflows.

## Quick Reference

- **Engineering Standards**: See [STANDARDS.md](./STANDARDS.md) for detailed code quality guidelines
- **Architecture**: See [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- **Tech Stack**: See [TECHSTACK.md](./TECHSTACK.md) for technology choices

## Core Principles

### IPO-Ready from Day One
We write production-grade code that could withstand public scrutiny:
- Zero tolerance for technical debt
- Explicit over implicit
- Fail fast, fail loud
- Optimize for reading, not writing

## Philosophy

### 1. Code Quality Over Everything

We don't merge broken code. Period. Every contribution must:
- Pass all static analysis checks
- Follow type safety strictly (no `any` types)
- Maintain test coverage
- Not introduce new warnings

### 2. AI-Assisted, Human-Verified

This project embraces AI-assisted development but requires human judgment:
- AI generates, humans review
- Every line must be understood by a human
- No blind copy-pasting from AI outputs
- "Grill me" mode encouraged for critical review

### 3. Small, Atomic Commits

Large changes are the enemy of review:
- One logical change per commit
- Maximum ~200 lines per commit (soft limit)
- Commit messages explain the *why*, not the *what*

## Development Workflow

### Prerequisites

We use **Nix** for reproducible development environments:

```bash
# Enter development shell
nix develop

# Or with legacy nix-shell
nix-shell

# Or with direnv (recommended)
direnv allow
```

No Docker required. No "works on my machine".

### Setup

```bash
# Clone and enter
git clone <repo-url>
cd ipod-snapshot

# Install dependencies
bun install

# Run checks
npm run validate
```

### Making Changes

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the code style (enforced by Prettier/ESLint)
   - Add tests if applicable
   - Update documentation

3. **Run validation**
   ```bash
   npm run validate
   ```
   This runs: lint + format-check + type-check

4. **Commit with meaningful messages**
   ```bash
   git commit -m "component: Brief description
   
   Explain the problem this solves and the approach taken.
   Reference any related issues."
   ```

### Commit Message Format

```
component: Brief summary (50 chars or less)

More detailed explanation if needed. Wrap at 72 characters.
Explain the problem and solution approach.

- Bullet points for multiple changes
- Keep each line under 72 characters

Fixes #123
References #456
```

**Components:**
- `ipod:` - iPod component changes
- `3d:` - Three.js/3D related
- `ui:` - General UI components
- `lib:` - Utility functions
- `config:` - Configuration changes
- `docs:` - Documentation
- `test:` - Test additions/changes
- `style:` - Code style changes (formatting)
- `refactor:` - Refactoring without behavior changes
- `perf:` - Performance improvements
- `fix:` - Bug fixes
- `feat:` - New features

## Code Standards

### TypeScript Strictness

We enable all strict TypeScript options:
- `noUnusedLocals` - Clean up dead code
- `noUncheckedIndexedAccess` - Handle undefined in index access
- `exactOptionalPropertyTypes` - Distinguish undefined from missing
- `verbatimModuleSyntax` - Explicit type imports

**No `any` types allowed.** Use `unknown` and type guards instead.

### Static Analysis

ESLint configuration enforces:
- All unused variables must be prefixed with `_`
- Consistent type imports (`import type { ... }`)
- Prefer `const` over `let`
- No `var` declarations
- Prefer template literals over string concatenation
- Import ordering and grouping
- Unicorn rules for modern JavaScript

### Code Style

Enforced by Prettier and EditorConfig:
- 2 spaces indentation
- Double quotes for strings
- Trailing commas
- 90 character line width
- LF line endings
- Final newline

### File Naming

- Components: `kebab-case.tsx` (e.g., `ipod-classic.tsx`)
- Utilities: `kebab-case.ts` (e.g., `color-manifest.ts`)
- Tests: `*.spec.ts` or `*.test.ts`
- Styles: `*.css` or `*.module.css`

## AI-Assisted Development Guidelines

### When Using AI Tools

1. **Review every suggestion**
   - AI makes mistakes. It's your job to catch them.
   - Don't accept changes you don't understand.

2. **Use "Grill Me" mode**
   - Activate critical review: "grill me on this approach"
   - Challenge assumptions the AI makes
   - Ask for alternatives

3. **Validate AI output**
   - Run the type checker
   - Run the linter
   - Run tests
   - Test manually in browser

4. **Maintain authorship**
   - You're responsible for code you commit
   - AI is a tool, not a substitute for understanding

### AI Skill References

This project uses several AI skills:
- `aiden-react` - React performance (Million.js patterns)
- `vercel-react-best-practices` - Vercel's React rules
- `emil-design-eng` - UI/animation quality
- `impeccable` - Design excellence commands
- `grill-me` - Critical review mode

Reference these when working with AI assistants.

## Design Guidelines

### UI/UX Standards

Follow the Impeccable skill guidelines:
- Use `/audit` for accessibility checks
- Use `/polish` for final passes
- Use `/typeset` for typography fixes
- Avoid "AI slop" aesthetics
- Maintain consistent spacing
- Support reduced motion

### Performance Requirements

- First Contentful Paint: < 1.5s
- No layout shifts during load
- 60fps for animations
- Properly optimized images
- Minimal JavaScript for initial load

## Testing

### Playwright Tests

```bash
# Run all tests
npm run test

# Run with UI
npm run test:ui

# Debug mode
npm run test:debug
```

### Manual Testing Checklist

- [ ] Works on mobile (iOS Safari, Chrome Android)
- [ ] Works on desktop (Chrome, Firefox, Safari)
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Reduced motion respected
- [ ] High contrast mode works

## Review Process

### Before Submitting

1. **Self-review checklist:**
   - [ ] Code follows style guide
   - [ ] No TypeScript errors
   - [ ] No ESLint warnings
   - [ ] Tests pass
   - [ ] Documentation updated
   - [ ] Commit messages are clear

2. **Test the change:**
   ```bash
   npm run validate
   npm run build
   npm run test
   ```

### What Reviewers Look For

1. **Correctness** - Does it work? Does it handle edge cases?
2. **Maintainability** - Can someone else understand this in 6 months?
3. **Performance** - Any obvious bottlenecks?
4. **Security** - Any injection risks? XSS vectors?
5. **Accessibility** - Can everyone use this?

### Addressing Review Feedback

- Don't take criticism personally
- Ask questions if feedback is unclear
- Make requested changes in new commits
- Reply to each comment when resolved
- Force-push only to fix commit messages

## No-No's

### Never Do These

1. **Don't break the build**
   - If CI fails, fix it before requesting review

2. **Don't ignore TypeScript errors**
   - `@ts-ignore` requires a comment explaining why
   - `@ts-expect-error` preferred with justification

3. **Don't use `any`**
   - Use proper types or `unknown` with type guards

4. **Don't leave console.log in production code**
   - Use `console.warn` or `console.error` for legitimate logging

5. **Don't commit secrets**
   - Use environment variables
   - Check with: `git diff --cached`

6. **Don't mix formatting with functional changes**
   - Separate commits for style and logic

## Getting Help

### Resources

- **Type Checking:** `npm run type-check`
- **Linting:** `npm run lint`
- **Formatting:** `npm run format`
- **Full validation:** `npm run validate`

### Communication

- Be respectful and professional
- Assume good intentions
- Focus on the code, not the person
- Explain the "why" behind suggestions

## Attribution

This CONTRIBUTING.md is inspired by:
- Linux Kernel Contribution Guidelines
- Linus Torvalds' coding philosophy
- Vercel's engineering practices
- Anthropic's AI-assisted development principles

---

> "Given enough eyeballs, all bugs are shallow." - Linus's Law

Thank you for contributing to iPod Snapshot!
