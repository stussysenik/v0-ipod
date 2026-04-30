# AI Agent Configuration for iPod Snapshot

This document configures AI assistants working on this project with the complete toolchain: Aiden Bai React skills, Portless, Vercel MCPs, Swift MCP, Impeccable, and Grill Me mode.

## Default Mode: GRILL ME

**Unless explicitly stated otherwise, always operate in "Grill Me" mode.**

When the user says "grill me" or any request implies critical review:
1. Question all assumptions
2. Expose weaknesses and risks
3. Demand evidence for claims
4. Consider edge cases
5. Force clarity on vague requirements

### Grill Mode Response Format

```
### 🔥 The Challenge
[What's wrong or risky]

### ❓ The Questions
[What needs clarification]

### ⚠️ The Risks
[What could break or fail]

### 💡 The Counter-Arguments
[Alternative approaches]

### ✅ What Would Convince Me
[Evidence needed to proceed]
```

## Active Skills

This project uses the following agent skills:

### 1. Aiden Bai React (`aiden-react`)
React performance optimization from Million.js and React Doctor.

**When to apply:**
- Writing or reviewing React components
- Performance optimization tasks
- Component structure decisions

**Key patterns:**
- Wrap static content in `block()` for Million.js optimization
- Hoist object/array literals to module level
- Split dynamic from static components
- Use compiler-first optimization over manual memoization

### 2. Vercel React Best Practices (`vercel-react-best-practices`)
Performance optimization guidelines from Vercel Engineering.

**When to apply:**
- All React/Next.js code
- Data fetching implementations
- Bundle optimization

**Key priorities:**
1. Eliminate waterfalls (CRITICAL)
2. Bundle size optimization (CRITICAL)
3. Server-side performance (HIGH)
4. Client-side data fetching (MEDIUM-HIGH)
5. Re-render optimization (MEDIUM)

### 3. Emil Design Engineering (`emil-design-eng`)
UI polish, animations, and invisible details.

**When to apply:**
- UI component design
- Animation decisions
- Interaction design

**Key principles:**
- Taste is trained, not innate
- Unseen details compound
- Beauty is leverage
- Use custom easing curves (not default CSS)
- Never animate keyboard actions
- Buttons need `scale(0.97)` on :active

### 4. Frontend Design (`frontend-design`)
Distinctive, production-grade interfaces.

**When to apply:**
- Building new components
- Design system decisions
- Visual polish

### 5. Vercel Composition Patterns (`vercel-composition-patterns`)
React composition patterns that scale.

**When to apply:**
- Component API design
- Refactoring boolean props
- Building flexible component libraries

### 6. Impeccable (`impeccable`)
Design quality enforcement.

**Commands available:**
- `/audit` - Accessibility, performance, quality check
- `/critique` - UX review with heuristics
- `/polish` - Final pass before shipping
- `/distill` - Strip unnecessary complexity
- `/animate` - Purposeful motion
- `/typeset` - Fix typography
- `/bolder` - Amplify safe designs
- `/quieter` - Tone down aggressive designs

### 7. Swift MCP (`swift-mcp`)
Swift SDK for Model Context Protocol.

**When to apply:**
- Building MCP servers/clients in Swift
- iOS/macOS AI integration
- Cross-platform MCP tooling

### 8. Vercel MCP (`vercel-mcp`)
Vercel Model Context Protocol servers.

**When to apply:**
- v0 component generation
- Vercel deployment automation
- AI-powered UI workflows

### 9. Grill Me (`grill-me`)
Critical review and challenge mode.

**Activation:** User says "grill me" or "activate grill mode"

**Default behavior:** Always apply critical thinking to all suggestions

## Development Workflow

### Portless (Default)

All development uses Portless for clean local URLs:

```bash
# Development (default - uses portless)
npm run dev
# → https://ipod.localhost

# Development (bypass portless)
npm run dev:raw
# → http://localhost:3000
```

**Portless features:**
- Automatic HTTPS setup
- Clean `.localhost` URLs
- Git worktree support
- Framework auto-detection (Next.js, Vite, Astro, etc.)

### MCP Server Configuration

Create `.mcp/config.json` for MCP servers:

```json
{
  "mcpServers": {
    "v0": {
      "command": "npx",
      "args": ["-y", "v0-mcp@latest"],
      "env": {
        "V0_API_KEY": "${V0_API_KEY}"
      }
    },
    "vercel-deploy": {
      "command": "npx",
      "args": ["-y", "@vercel/mcp-deploy@latest"],
      "env": {
        "VERCEL_TOKEN": "${VERCEL_TOKEN}"
      }
    }
  }
}
```

## Code Review Checklist

### Before Approving Any Code

1. **Performance**
   - [ ] No waterfall data fetching
   - [ ] Proper use of React Server Components
   - [ ] Bundle size impact considered
   - [ ] Images optimized

2. **Design Quality** (Impeccable standards)
   - [ ] No generic "AI slop" aesthetics
   - [ ] Typography hierarchy clear
   - [ ] Color system followed
   - [ ] Animation purposeful, not decorative
   - [ ] Mobile responsive

3. **React Best Practices** (Vercel rules)
   - [ ] Async patterns correct
   - [ ] No unnecessary re-renders
   - [ ] Props minimized for RSC
   - [ ] Error handling in place

4. **Accessibility**
   - [ ] ARIA labels where needed
   - [ ] Keyboard navigation works
   - [ ] Color contrast adequate
   - [ ] Focus states visible

5. **Critical Review** (Grill Mode)
   - [ ] Assumptions challenged
   - [ ] Edge cases considered
   - [ ] Failure modes identified
   - [ ] Better alternatives proposed

## Project Structure

```
app/                 # Next.js App Router
├── page.tsx         # Main page
├── layout.tsx       # Root layout
├── loading.tsx      # Loading state
├── globals.css      # Global styles
components/
├── ipod/            # iPod-specific components
├── three/           # Three.js/R3F components
├── ui/              # Reusable UI components
lib/                 # Utility functions
├── design-system.ts # Design tokens
├── color-manifest.ts # Color definitions
public/              # Static assets
scripts/             # Build/dev scripts
```

## Key Technologies

- **Framework:** Next.js 15 + React 19
- **Styling:** Tailwind CSS + CSS Variables
- **3D:** React Three Fiber + Drei
- **UI:** Radix UI primitives
- **Animation:** Framer Motion (if needed)
- **PWA:** next-pwa
- **Testing:** Playwright

## Design System

Refer to `lib/design-system.ts` and `lib/color-manifest.ts` for:
- Color tokens
- Typography scale
- Spacing system
- Animation easings
- Border radius values

## Performance Budget

- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3.5s
- Total Bundle Size: < 200KB (gzipped)
- 3D Scene: 60fps target

## Commands

```bash
# Development (with portless)
npm run dev

# Development (without portless)
npm run dev:raw

# Build
npm run build

# Test
npm run test

# Lint
npm run lint

# Type check
npm run type-check

# Full validation
npm run validate
```

## MCP Integration

### Using MCP Tools in Code

```typescript
import { createMCPClient } from "ai";

// Connect to MCP server
const mcpClient = await createMCPClient({
  transport: {
    type: "stdio",
    command: "npx",
    args: ["-y", "@vercel/mcp-deploy"],
  },
});

const tools = await mcpClient.tools();
```

### v0 Component Generation

```bash
# Generate component via v0 MCP
# Requires V0_API_KEY environment variable
npx v0-mcp generate "Create a music player control bar"
```

## Static Analysis & Code Quality

This project enforces strict static analysis. All code must pass:

### TypeScript Strict Mode
- `noUnusedLocals` - Clean dead code
- `noUncheckedIndexedAccess` - Handle undefined access
- `exactOptionalPropertyTypes` - Strict optional types
- `verbatimModuleSyntax` - Explicit type imports
- **No `any` types allowed** - Use `unknown` with type guards

### ESLint Rules
- TypeScript strict rules (@typescript-eslint)
- Import ordering and validation
- Unicorn rules for modern JS patterns
- React hooks rules
- Filename conventions (kebab-case)

### Formatting
- EditorConfig for consistent spacing
- LF line endings enforced

### Pre-commit Checklist
```bash
# Run before every commit
npm run validate
```

This runs:
1. ESLint with auto-fix attempts
2. TypeScript compiler check

## Nix Development Environment

We use **Nix** for reproducible builds. No Docker required.

### Enter Development Shell

```bash
# Modern (flakes)
nix develop

# Legacy
nix-shell

# With direnv (automatic)
direnv allow
```

### Environment Includes

- Node.js 20 LTS
- Bun package manager
- TypeScript toolchain
- OXC / Oxlint + ESLint
- Git + build tools

### Building with Nix

```bash
# Build package
nix build

# Run directly
nix run
```

### Why Nix?

- Reproducible builds across all machines
- Declarative dependencies
- No "works on my machine"
- No Docker daemon required
- Fast, native performance

## Contributing Guidelines

We follow Linux kernel-inspired contribution standards:

### Philosophy

> "Talk is cheap. Show me the code." - Linus Torvalds

1. **Code quality over everything** - We don't merge broken code
2. **AI-assisted, human-verified** - You are responsible for what you commit
3. **Small, atomic commits** - One logical change per commit

### AI-Assisted Development

When using AI tools (Claude, Copilot, etc.):

1. **Review every suggestion** - AI makes mistakes
2. **Use "grill me" mode** - Challenge assumptions
3. **Validate output** - Run all checks before committing
4. **Maintain authorship** - You are responsible for the code

### Commit Standards

```
component: Brief summary (50 chars or less)

More detailed explanation. Wrap at 72 characters.
Explain the problem and solution approach.

- Bullet points for changes
- Reference issues: Fixes #123
```

**Components:** `ipod:`, `3d:`, `ui:`, `lib:`, `config:`, `docs:`, `test:`, `fix:`, `feat:`

### No-No's

Never do these:
1. Don't break the build
2. Don't ignore TypeScript errors
3. Don't use `any` types
4. Don't leave console.log in production
5. Don't commit secrets
6. Don't mix formatting with functional changes

See [CONTRIBUTING.md](./CONTRIBUTING.md) for full guidelines.

## Security Considerations

- Never commit API keys or tokens
- Use environment variables for all secrets
- Validate all user inputs
- Sanitize dynamic content
- Use CSP headers in production
- Check dependencies with `npm audit`

## Links & Resources

- Million.js: https://million.dev
- React Doctor: https://github.com/millionco/react-doctor
- Portless: https://github.com/vercel-labs/portless
- MCP Spec: https://modelcontextprotocol.io
- Swift MCP: https://github.com/modelcontextprotocol/swift-sdk
- Vercel AI SDK: https://sdk.vercel.ai
- Impeccable: https://impeccable.style
