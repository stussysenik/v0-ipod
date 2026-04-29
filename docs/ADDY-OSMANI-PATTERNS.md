# Addy Osmani Patterns Applied

This document details the patterns from Addy Osmani's work that have been applied to the iPod Classic project.

## 1. Custom Hooks Pattern

**File:** `hooks/use-ipod-theme.ts`

Following Addy's principle of encapsulating reusable logic:

```typescript
// Single source of truth for iPod theme
export function useIPodTheme(initialTheme: IPodTheme = "black") {
  const [theme, setTheme] = useState(initialTheme);
  
  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem("ipod-theme", theme);
  }, [theme]);
  
  // Derived values (no prop drilling needed)
  const caseColor = isBlack ? COLORS.case.black : COLORS.case.silver;
  const wheelColors = isBlack ? COLORS.wheel.dark : COLORS.wheel.light;
  
  return { theme, caseColor, wheelColors, toggleTheme };
}
```

**Benefits:**
- No prop drilling for theme values
- Single source of truth
- Automatic persistence
- Easy to test and reuse

## 2. Barrel Exports Pattern

**Files:** 
- `hooks/index.ts`
- `components/ui/index.ts`

Following Addy's organized public API approach:

```typescript
// Clean, organized exports
export { useIPodTheme, IPOD_6G_COLORS } from "./use-ipod-theme";
export { useExportStatus } from "./use-export-status";
```

**Benefits:**
- Clean import statements
- Centralized API surface
- Easy to discover available utilities

## 3. Compound Components Pattern

**File:** `components/ui/theme-toggle.tsx`

Following Addy's flexible component API pattern:

```typescript
// Main component
export function ThemeToggle({ theme, onToggle }) { ... }

// Sub-component for grouping
ThemeToggle.Group = ThemeGroup;

// Usage
<ThemeToggle.Group>
  <ThemeToggle theme="black" onToggle={...} />
</ThemeToggle.Group>
```

**Benefits:**
- Flexible composition
- Self-documenting API
- Easy to extend

## 4. Design Tokens Pattern

**File:** `hooks/use-ipod-theme.ts`

Following Addy's design system architecture:

```typescript
export const IPOD_6G_COLORS = {
  case: {
    black: "#1A1A1A",
    silver: "#C8C9CB",
  },
  wheel: {
    dark: { surface: "#1C1C1E", label: "#FFFFFF" },
    light: { surface: "#F5F5F7", label: "#8E8E93" },
  },
} as const;
```

**Benefits:**
- Single source of truth for colors
- Type-safe with `as const`
- Easy to theme and customize

## 5. Container/Presentational Separation

**Pattern Applied:** Theme logic separated from UI

```typescript
// Container (logic)
const { theme, toggleTheme } = useIPodTheme();

// Presentational (UI)
<ThemeToggle theme={theme} onToggle={toggleTheme} />
```

**Benefits:**
- Easy to test
- Reusable components
- Clear separation of concerns

## 6. Carbon Design System Integration

**File:** `components/ui/carbon-checkbox.tsx`

Following IBM Carbon Design System with Addy's component patterns:

- Strict color tokens (`#161616`, `#8D8D8D`, `#0F62FE`)
- Clear focus states
- Disabled state handling
- Sub-component for labels

## 7. Performance Optimizations

Following Addy's performance principles:

- **Lazy loading:** 3D component with `dynamic()` import
- **Memoization:** `useCallback` for event handlers
- **State colocation:** Keep state close to where it's used

## Summary

| Pattern | File | Benefit |
|---------|------|---------|
| Custom Hooks | `hooks/use-ipod-theme.ts` | Reusable, testable logic |
| Barrel Exports | `hooks/index.ts` | Clean API surface |
| Compound Components | `components/ui/theme-toggle.tsx` | Flexible composition |
| Design Tokens | `IPOD_6G_COLORS` | Single source of truth |
| Container/Presentational | `ipod-classic.tsx` | Separation of concerns |

## Running the App

```bash
bun run dev
```

The app now features:
- Theme toggle with Silver/Black iPod 6G variants
- Carbon Design System checkbox in toolbar
- Custom hooks for theme management
- Persistent theme preference
