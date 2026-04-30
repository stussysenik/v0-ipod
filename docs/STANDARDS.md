# Engineering Standards

> **IPO-Ready Production Codebase Practices**
>
> Minimal footprint. Maximum clarity. Zero tolerance for technical debt.

## Philosophy

We write code like we're building for public markets from day one. Every line must justify its existence. Every abstraction must pay for itself. Every commit must be reversible.

**Principles (inspired by Linux/Go/Ruby communities):**

1. **Simplicity over cleverness** - If you need comments to explain it, rewrite it
2. **Explicit over implicit** - Magic hides bugs; clarity exposes them
3. **Small surfaces over deep hierarchies** - Composition beats inheritance
4. **Fail fast, fail loud** - Silent failures are production incidents waiting to happen
5. **Optimize for reading** - Code is read 10x more than written

---

## Code Style

### TypeScript

**Strict mode is non-negotiable.**

```typescript
// ✅ GOOD: Explicit types, no implicit any
interface User {
  id: string;
  name: string;
  email?: string; // Optional is explicit
}

function getUserById(id: string): Promise<User | null> {
  // Returns null on not found, never undefined
  return db.query('SELECT * FROM users WHERE id = $1', [id])
    .then(rows => rows[0] ?? null);
}

// ❌ BAD: Implicit types, vague returns
function getUser(id) {
  return db.query(`SELECT * FROM users WHERE id = ${id}`);
}
```

**Function Design:**

```typescript
// ✅ GOOD: Single responsibility, early returns, exhaustive error handling
async function processPayment(
  orderId: string,
  paymentMethod: PaymentMethod
): Promise<Result<Payment, PaymentError>> {
  if (!orderId || !isValidUUID(orderId)) {
    return { ok: false, error: new InvalidOrderError(orderId) };
  }

  const order = await getOrder(orderId);
  if (!order) {
    return { ok: false, error: new OrderNotFoundError(orderId) };
  }

  if (order.status !== 'pending') {
    return { ok: false, error: new InvalidOrderStateError(order.status) };
  }

  // ... process payment
}

// ❌ BAD: Multiple responsibilities, nested conditions
async function pay(orderId, method) {
  if (orderId && method) {
    const order = await db.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (order) {
      if (order.status === 'pending') {
        // ... 50 lines of payment logic
      } else {
        throw new Error('Invalid status');
      }
    } else {
      throw new Error('Not found');
    }
  }
}
```

### React Components

**Functional components with explicit props:**

```typescript
// ✅ GOOD: Destructured props, explicit return type, memo when needed
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export const Button = React.memo<ButtonProps>(function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  loading = false,
}) {
  const handleClick = useCallback(() => {
    if (!disabled && !loading && onClick) {
      onClick();
    }
  }, [disabled, loading, onClick]);

  return (
    <button
      className={cn(buttonVariants({ variant, size }))}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-busy={loading}
    >
      {loading ? <Spinner size={size} /> : children}
    </button>
  );
});

// ❌ BAD: Implicit props, inline handlers, no memo
function Button(props) {
  return <button onClick={() => props.onClick()}>{props.children}</button>;
}
```

**Hooks:**

```typescript
// ✅ GOOD: Single-purpose hooks with clear contracts
function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((prev) => {
        const next = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
        localStorage.setItem(key, JSON.stringify(next));
        return next;
      });
    },
    [key]
  );

  return [state, setValue];
}

// ❌ BAD: Multiple responsibilities, no error handling
function useStorage(key) {
  const [val, setVal] = useState(localStorage.getItem(key));
  return [val, setVal];
}
```

### File Organization

```
components/
├── ui/                    # Primitive components (Button, Input, Card)
│   ├── button.tsx
│   ├── button.test.tsx    # Co-located tests
│   └── button.stories.tsx # Co-located stories
├── ipod/                  # Feature components
│   ├── ipod-classic.tsx
│   ├── ipod-screen.tsx
│   └── ipod-wheel.tsx
└── three/                 # 3D components
    ├── three-d-ipod.tsx
    └── scene.tsx

lib/
├── utils.ts               # Shared utilities
├── hooks/                 # Custom hooks
├── types/                 # Shared types
└── constants.ts           # Constants only

app/                       # Next.js App Router
├── layout.tsx
├── page.tsx
├── loading.tsx
├── error.tsx
└── api/                   # API routes

tests/
├── unit/                  # Unit tests
├── integration/           # Integration tests
└── e2e/                   # Playwright E2E tests
```

**Naming Conventions:**

| Item | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `Button.tsx`, `UserCard.tsx` |
| Hooks | camelCase with `use` prefix | `useLocalStorage.ts` |
| Utils | camelCase | `formatDate.ts` |
| Constants | SCREAMING_SNAKE_CASE | `API_BASE_URL` |
| Types | PascalCase with domain | `User`, `PaymentResult` |
| Files | kebab-case | `user-profile.tsx` |

---

## Performance Standards

### Bundle Size Budgets

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // Budget: 200KB initial JS, 500KB total
  experimental: {
    optimizePackageImports: ['lodash', '@radix-ui/react-icons'],
  },
});
```

### Rendering Optimization

```typescript
// ✅ GOOD: Lazy loading heavy components
const HeavyChart = dynamic(() => import('./heavy-chart'), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

// ✅ GOOD: Image optimization with explicit dimensions
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority // Only for LCP images
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>

// ✅ GOOD: Virtualization for long lists
import { VirtualList } from '@/components/ui/virtual-list';

<VirtualList
  items={items}
  itemHeight={48}
  renderItem={(item) => <ListItem item={item} />}
/>
```

---

## Testing Standards

### Unit Tests

```typescript
// ✅ GOOD: Test behavior, not implementation
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button', { name: /click me/i }));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when loading', () => {
    render(<Button loading>Loading</Button>);
    
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByLabelText(/loading/i)).toBeInTheDocument();
  });
});
```

### E2E Tests

```typescript
// ✅ GOOD: Test user flows, not page structure
test('user can complete checkout flow', async ({ page }) => {
  await page.goto('/products');
  
  // Add to cart
  await page.getByRole('button', { name: 'Add to Cart' }).first().click();
  await expect(page.getByText('1 item in cart')).toBeVisible();
  
  // Go to checkout
  await page.getByRole('link', { name: 'Cart' }).click();
  await page.getByRole('button', { name: 'Checkout' }).click();
  
  // Fill payment
  await page.getByLabel('Card Number').fill('4242424242424242');
  await page.getByRole('button', { name: 'Pay' }).click();
  
  // Verify success
  await expect(page.getByText('Order confirmed!')).toBeVisible();
});
```

### Coverage Requirements

- **Business logic**: 90% coverage (utils, hooks, reducers)
- **Components**: 80% coverage (render paths, interactions)
- **E2E flows**: All critical user paths

---

## Error Handling

### Never Swallow Errors

```typescript
// ✅ GOOD: Explicit error handling with proper types
async function fetchUser(id: string): Promise<Result<User, FetchError>> {
  try {
    const response = await fetch(`/api/users/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return { ok: false, error: new UserNotFoundError(id) };
      }
      if (response.status >= 500) {
        return { ok: false, error: new ServerError(response.statusText) };
      }
      return { ok: false, error: new FetchError(response.statusText) };
    }
    
    const data = await response.json();
    return { ok: true, value: validateUser(data) };
  } catch (error) {
    // Log for monitoring, return typed error
    logger.error('Failed to fetch user', { id, error });
    return { ok: false, error: new NetworkError(error) };
  }
}

// Usage
const result = await fetchUser(userId);
if (!result.ok) {
  // TypeScript knows result.error is FetchError
  handleError(result.error);
  return;
}
// TypeScript knows result.value is User
renderUser(result.value);

// ❌ BAD: Swallowing errors or vague handling
try {
  const user = await fetch(`/api/users/${id}`).then(r => r.json());
  return user;
} catch (e) {
  console.error(e);
  return null;
}
```

### Custom Error Types

```typescript
// lib/errors.ts
export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  readonly isOperational = true;

  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class UserNotFoundError extends AppError {
  readonly code = 'USER_NOT_FOUND';
  readonly statusCode = 404;

  constructor(readonly userId: string) {
    super(`User ${userId} not found`);
  }
}

export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;

  constructor(readonly fields: Record<string, string[]>) {
    super('Validation failed');
  }
}
```

---

## API Design

### RESTful Endpoints

```typescript
// ✅ GOOD: Resource-based, predictable URLs
// GET    /api/users           - List users
// GET    /api/users/:id       - Get user
// POST   /api/users           - Create user
// PATCH  /api/users/:id       - Update user
// DELETE /api/users/:id       - Delete user

// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const result = updateUserSchema.safeParse(body);
  
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    );
  }

  const user = await updateUser(params.id, result.data);
  
  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(user);
}
```

### Response Format

```typescript
// ✅ GOOD: Consistent response structure
interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page: number;
    perPage: number;
    total: number;
  };
}

// Success
{ "data": { "id": "1", "name": "John" } }

// Error
{ 
  "error": { 
    "code": "VALIDATION_ERROR", 
    "message": "Invalid email format",
    "details": { "email": ["Must be a valid email"] }
  } 
}
```

---

## Security

### Input Validation

```typescript
// ✅ GOOD: Validate at boundaries
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  API_SECRET: z.string().min(32),
  NODE_ENV: z.enum(['development', 'production', 'test']),
});

export const env = envSchema.parse(process.env);

// ✅ GOOD: Validate API inputs
const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  published: z.boolean().default(false),
});

export async function POST(request: Request) {
  const body = await request.json();
  const data = createPostSchema.parse(body); // Throws on invalid
  // ...
}
```

### XSS Prevention

```typescript
// ✅ GOOD: Sanitize user content
import DOMPurify from 'isomorphic-dompurify';

function RichText({ html }: { html: string }) {
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href'],
  });
  
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}

// ✅ GOOD: Use safe APIs
// ❌ Never: dangerouslySetInnerHTML with raw user input
```

---

## Git Workflow

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add user authentication
fix: resolve memory leak in chart component
docs: update API documentation
refactor: simplify payment processing logic
test: add coverage for checkout flow
chore: update dependencies
perf: optimize image loading with lazy loading
```

### Branch Strategy

```
main           Production-ready code
  │
  ├── feat/user-auth     Feature branches
  ├── fix/memory-leak    Bug fixes
  ├── docs/api-update    Documentation
  └── refactor/payments  Refactoring
```

### Pull Request Template

Every PR must include:

1. **What** - What changed and why
2. **How** - How to test the changes
3. **Screenshots** - For UI changes
4. **Checklist** - All items verified

---

## Code Review Checklist

### Before Submitting PR

- [ ] All tests pass (`npm test`)
- [ ] No lint errors (`npm run lint`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] Self-reviewed diff
- [ ] No `console.log` or debug code
- [ ] Error handling in place
- [ ] Performance considered

### Reviewing PRs

- [ ] Logic is correct and handles edge cases
- [ ] Error handling is comprehensive
- [ ] Types are accurate and strict
- [ ] Tests cover new functionality
- [ ] No unnecessary complexity
- [ ] Follows naming conventions
- [ ] Documentation updated if needed

---

## Documentation

### Code Comments

```typescript
// ✅ GOOD: Explain WHY, not WHAT
// Compensate for Safari's incorrect flexbox gap implementation
// See: https://bugs.webkit.org/show_bug.cgi?id=206767
.container {
  display: flex;
  gap: 1rem;
  padding: 1rem; // Safari adds gap to padding incorrectly
}

// ❌ BAD: Redundant comments
// Increment counter by 1
counter++;
```

### README Structure

```markdown
# Project Name

One-line description.

## Quick Start

\`\`\`bash
npm install
npm run dev
\`\`\`

## Architecture

High-level overview with diagram.

## Development

Setup, scripts, conventions.

## Deployment

Environment variables, platform config.

## Contributing

Link to CONTRIBUTING.md.
```

---

## Tooling

### Required VS Code Extensions

- ESLint
- TypeScript Importer
- Tailwind CSS IntelliSense
- GitLens
- Error Lens

### Settings

```json
{
  "editor.formatOnSave": false,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "non-relative",
  "typescript.suggest.autoImports": true
}
```

---

## Metrics

Track these in CI/CD:

| Metric | Target | Alert |
|--------|--------|-------|
| Test Coverage | >80% | <75% |
| Bundle Size | <500KB | >600KB |
| Type Errors | 0 | >0 |
| Lint Errors | 0 | >0 |
| Lighthouse Score | >90 | <80 |

---

## Enforcement

These standards are enforced via:

1. **OXC / Oxlint** - Default code quality gate
2. **ESLint** - Next.js compatibility rules
3. **TypeScript** - Type safety
4. **Husky** - Pre-commit hooks
5. **GitHub Actions** - CI/CD validation
6. **Code Review** - Human verification

Violations block merge to `main`.

---

## Questions?

Refer to:
- Architecture decisions: `ARCHITECTURE.md`
- Contributing process: `CONTRIBUTING.md`
- Tech stack: `TECHSTACK.md`

Or ask in #engineering-standards.
