---
name: static-analysis
description: Run comprehensive static analysis and report all issues
---

# Static Analysis Command

Run the complete static analysis suite and report findings with severity levels.

## Execution

```bash
npm run validate
```

This runs:
1. ESLint with TypeScript rules
2. Prettier format check
3. TypeScript compiler check

## Analysis Checks

### TypeScript Strictness
- [ ] `noUnusedLocals` - No unused local variables
- [ ] `noUnusedParameters` - No unused function parameters
- [ ] `noImplicitReturns` - All code paths must return
- [ ] `noFallthroughCasesInSwitch` - No switch fallthrough
- [ ] `noUncheckedIndexedAccess` - Handle undefined from index access
- [ ] `exactOptionalPropertyTypes` - Distinguish undefined from missing
- [ ] `forceConsistentCasingInFileNames` - Case-sensitive imports
- [ ] `verbatimModuleSyntax` - Explicit type imports

### ESLint Rules

#### TypeScript (@typescript-eslint)
- [ ] `no-unused-vars` (error) - Prefix unused with `_`
- [ ] `no-explicit-any` (error) - Use proper types
- [ ] `consistent-type-imports` - Explicit type imports
- [ ] `consistent-type-definitions` - Use interfaces over types
- [ ] `prefer-nullish-coalescing` - Use `??` over `||`
- [ ] `prefer-optional-chain` - Use `?.` over nested checks
- [ ] `switch-exhaustiveness-check` - All cases covered

#### Import Rules
- [ ] `import/first` - Imports at top
- [ ] `import/no-duplicates` - No duplicate imports
- [ ] `import/no-unresolved` - All imports resolve
- [ ] `import/order` - Ordered imports with groups

#### Unicorn Rules
- [ ] `unicorn/filename-case` - kebab-case files
- [ ] `unicorn/no-array-for-each` - Prefer for-of
- [ ] `unicorn/prefer-modern-dom-apis` - Modern browser APIs
- [ ] `unicorn/prefer-query-selector` - Use querySelector
- [ ] `unicorn/throw-new-error` - Always throw Error instances

#### React
- [ ] `react/no-unescaped-entities` - Proper entity encoding
- [ ] `react/jsx-sort-props` - Sorted props
- [ ] `react-hooks/rules-of-hooks` - Hooks rules
- [ ] `react-hooks/exhaustive-deps` - Dependency arrays

### Formatting
- [ ] 2 space indentation
- [ ] Double quotes
- [ ] Trailing commas
- [ ] 90 character line width
- [ ] LF line endings
- [ ] Final newline

## Severity Levels

### P0 - Blocker (Must Fix)
- TypeScript compilation errors
- ESLint errors
- Import resolution failures

### P1 - Critical (Fix Before Merge)
- `any` types
- Unused variables (not prefixed)
- Console.log in production code
- Missing accessibility attributes

### P2 - Warning (Should Fix)
- Code style inconsistencies
- Suboptimal patterns
- Missing JSDoc comments

### P3 - Nitpick (Nice to Fix)
- Import ordering
- Minor formatting issues
- Comment typos

## Output Format

Report findings grouped by file:

```
FILE: components/example.tsx
─────────────────────────────────
P0: Line 15 - Type 'any' is not allowed
P1: Line 23 - Unused variable 'data' (prefix with _)
P2: Line 45 - Prefer optional chain over nested check

SUMMARY
───────
Errors: 1
Warnings: 2
Total: 3
```

## Quick Fixes

```bash
# Fix auto-fixable issues
npm run lint:fix

# Format code
npm run format

# Check types only
npm run type-check
```
