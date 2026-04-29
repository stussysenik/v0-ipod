# Code Review Checklist

> IPO-Ready Code Quality Standards

Use this checklist for every pull request. All items must be verified before merge.

---

## Pre-Review (Author Checklist)

Before requesting review, confirm:

- [ ] `bun run validate` passes locally
- [ ] `bun run test` passes
- [ ] `bun run build` succeeds without warnings
- [ ] No `console.log` or debug code left in
- [ ] Self-reviewed the diff ("Would I understand this in 6 months?")
- [ ] Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)

---

## Correctness

### Logic & Behavior
- [ ] Code behaves as described in PR
- [ ] Edge cases are handled explicitly
- [ ] Error cases return/throw appropriate types
- [ ] No silent failures or swallowed errors
- [ ] Race conditions considered and handled

### Type Safety
- [ ] No `any` types (use `unknown` + type guards if needed)
- [ ] All function parameters typed explicitly
- [ ] Return types are explicit and accurate
- [ ] `null` vs `undefined` used consistently
- [ ] No `@ts-ignore` without documented justification

---

## Performance

### Bundle Size
- [ ] No large dependencies added without justification
- [ ] Dynamic imports used for code-splitting where applicable
- [ ] Images optimized and use `next/image`

### Runtime
- [ ] No unnecessary re-renders (React DevTools Profiler)
- [ ] Expensive calculations memoized appropriately
- [ ] No memory leaks (event listeners cleaned up, etc.)
- [ ] Lists use virtualization if >100 items

---

## Testing

### Coverage
- [ ] Business logic has unit tests
- [ ] User interactions have integration tests
- [ ] Critical paths have E2E tests
- [ ] Tests cover error states, not just happy path

### Quality
- [ ] Tests are deterministic (no random data)
- [ ] Tests are independent (no shared state)
- [ ] Test descriptions explain behavior, not implementation

---

## Code Quality

### Readability
- [ ] Functions do one thing (Single Responsibility)
- [ ] Variable names are descriptive (not `data`, `item`, `tmp`)
- [ ] Complex logic has explaining comments (the *why*, not the *what*)
- [ ] No nested ternaries
- [ ] Early returns preferred over nested ifs

### Maintainability
- [ ] No duplicated logic (DRY)
- [ ] No magic numbers/strings (use constants)
- [ ] Dependencies are minimal and justified
- [ ] No dead code or unused imports

---

## Security

- [ ] User input validated/sanitized
- [ ] No secrets in code (use env vars)
- [ ] No SQL injection vectors (use parameterized queries)
- [ ] No XSS vulnerabilities (user content escaped)
- [ ] Authentication/authorization checks in place

---

## Accessibility

- [ ] Semantic HTML elements used appropriately
- [ ] ARIA labels where semantic HTML insufficient
- [ ] Keyboard navigation works
- [ ] Focus visible and logical
- [ ] Color contrast meets WCAG 2.1 AA
- [ ] `prefers-reduced-motion` respected for animations

---

## Documentation

- [ ] Public APIs documented with JSDoc
- [ ] Complex business logic explained in comments
- [ ] README updated if user-facing changes
- [ ] Architecture Decision Records (ADRs) for significant changes

---

## Review Style Guide

### For Reviewers

**Do:**
- Ask questions rather than make demands ("What do you think about...?")
- Explain the *why* behind suggestions
- Approve with minor comments if overall direction is good
- Learn from the code you're reviewing

**Don't:**
- Nitpick style (that's what linters are for)
- Block on subjective preferences
- Use sarcasm or condescending language
- Forget to praise good solutions

### For Authors

**Do:**
- Respond to every comment
- Push back if you disagree (with reasoning)
- Ask for clarification if feedback is unclear
- Thank reviewers for their time

**Don't:**
- Take feedback personally
- Ignore comments
- Force-push after review starts (adds commits instead)

---

## Sign-off

Once all items are checked:

```
✅ Approved by: @reviewer
✅ All CI checks passing
✅ Ready for merge
```

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `bun run validate` | Lint + Format + Type-check |
| `bun run test` | Run all tests |
| `bun run test:coverage` | Run tests with coverage |
| `bun run build` | Production build |
| `bun run ci` | Full CI simulation |

**Reference Docs:**
- [STANDARDS.md](../STANDARDS.md) - Engineering standards
- [ARCHITECTURE.md](../ARCHITECTURE.md) - System design
