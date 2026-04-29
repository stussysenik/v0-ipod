# iPod Black/White Theme Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the iPod theme toggle flip case, wheel, screen surround, and toolbar chrome between a fully-matching black iPod and a fully-matching white iPod, while preserving the realistic dark wheel gradient CSS and pruning dead chrome (OKLCH grid pickers, ASCII notice, mis-ordered view buttons, yellow WIP chip).

**Architecture:**
- `useIPodTheme` renames `silver → white`, keeps `black` as default, and exposes the theme via a lightweight `IPodThemeContext` so `IconButton` can react without prop drilling.
- `deriveWheelColors` dark branch is pinned to the exact user-quoted gradient so the realistic shader never drifts.
- Dead UI is deleted rather than hidden: OKLCH grid pickers, the ASCII notice card, and the yellow WIP chip all come out. View-mode buttons are regrouped (working on top, WIP at the bottom).

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, Tailwind, Bun, Playwright, OpenSpec CLI.

**Spec:** `openspec/changes/update-ipod-theme-black-white-toggle/`

**Verification strategy:** This is a UI-only change. There are no unit tests for these components, so verification is done via (1) TypeScript + ESLint (`bun run lint`, `bun run typecheck`), (2) OpenSpec validation, (3) manual browser smoke-test against both themes through the dev server on every substantive task. The plan calls out the exact viewport checks.

---

## Task 0: Create worktree and baseline

**Files:**
- No file changes — preparation only.

- [ ] **Step 0.1: Confirm you are on a clean `main`**

Run:
```bash
cd /Users/senik/Desktop/v0-ipod
git status
git rev-parse --abbrev-ref HEAD
```

Expected: working tree has only pre-existing unstaged edits (already present before this plan). Current branch is `main`.

- [ ] **Step 0.2: Create and switch to a feature branch**

Run:
```bash
git checkout -b feat/ipod-theme-black-white-toggle
```

Expected: `Switched to a new branch 'feat/ipod-theme-black-white-toggle'`.

- [ ] **Step 0.3: Revalidate the OpenSpec change**

Run:
```bash
openspec validate update-ipod-theme-black-white-toggle --strict --no-interactive
```

Expected: `Change 'update-ipod-theme-black-white-toggle' is valid`.

- [ ] **Step 0.4: Start the dev server in the background**

Run:
```bash
bun run dev
```

Run in background so you can visually verify after each task. Expected: Next.js boots on `http://localhost:3000`.

---

## Task 1: Rename theme variant `silver` → `white` in the hook

**Files:**
- Modify: `hooks/use-ipod-theme.ts` (entire file)

- [ ] **Step 1.1: Replace the file contents**

Overwrite `hooks/use-ipod-theme.ts` with the following:

```ts
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { IpodHardwarePresetId } from "@/types/ipod-state";

// iPod 6th Generation Color Tokens
// Based on reference: ipod-6th-classic-gen.png
export const IPOD_6G_COLORS = {
  case: {
    black: "#1A1A1A",
    white: "#F5F5F7",
  },
  background: {
    white: "#FFFFFF",
    dark: "#000000",
  },
  wheel: {
    dark: {
      surface: "#1C1C1E",
      border: "#2C2C2E",
      label: "#FFFFFF",
      center: "#2C2C2E",
      centerBorder: "#3A3A3C",
    },
    light: {
      surface: "#F5F5F7",
      border: "#D1D1D6",
      label: "#8E8E93",
      center: "#E5E5EA",
      centerBorder: "#D1D1D6",
    },
  },
} as const;

export type IPodTheme = "black" | "white";

export interface UseIPodThemeReturn {
  theme: IPodTheme;
  isBlack: boolean;
  caseColor: string;
  backgroundColor: string;
  wheelColors: typeof IPOD_6G_COLORS.wheel.dark;
  presetId: IpodHardwarePresetId;
  toggleTheme: () => void;
  setTheme: (theme: IPodTheme) => void;
}

const STORAGE_KEY = "ipod-theme";

function readStoredTheme(): IPodTheme | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === "black" || raw === "white") return raw;
  // Migrate legacy `silver` → `white`
  if (raw === "silver") {
    window.localStorage.setItem(STORAGE_KEY, "white");
    return "white";
  }
  return null;
}

export function useIPodTheme(
  initialTheme: IPodTheme = "black",
): UseIPodThemeReturn {
  const [theme, setThemeState] = useState<IPodTheme>(initialTheme);

  useEffect(() => {
    const stored = readStoredTheme();
    if (stored) setThemeState(stored);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "black" ? "white" : "black"));
  }, []);

  const setTheme = useCallback((nextTheme: IPodTheme) => {
    setThemeState(nextTheme);
  }, []);

  const isBlack = theme === "black";

  const caseColor = isBlack
    ? IPOD_6G_COLORS.case.black
    : IPOD_6G_COLORS.case.white;

  const backgroundColor = IPOD_6G_COLORS.background.white;

  const wheelColors = isBlack
    ? IPOD_6G_COLORS.wheel.dark
    : IPOD_6G_COLORS.wheel.light;

  const presetId: IpodHardwarePresetId = isBlack
    ? "classic-2008-black"
    : "classic-2008-silver";

  return {
    theme,
    isBlack,
    caseColor,
    backgroundColor,
    wheelColors,
    presetId,
    toggleTheme,
    setTheme,
  };
}

const IPodThemeContext = createContext<IPodTheme>("black");

export function IPodThemeProvider({
  theme,
  children,
}: {
  theme: IPodTheme;
  children: ReactNode;
}) {
  return (
    <IPodThemeContext.Provider value={theme}>
      {children}
    </IPodThemeContext.Provider>
  );
}

export function useIPodThemeValue(): IPodTheme {
  return useContext(IPodThemeContext);
}

export default useIPodTheme;
```

- [ ] **Step 1.2: Rename the file to `.tsx`**

The file now contains JSX (`IPodThemeProvider`). Rename it:

```bash
git mv hooks/use-ipod-theme.ts hooks/use-ipod-theme.tsx
```

Expected: `hooks/use-ipod-theme.tsx` exists, old `.ts` is gone.

- [ ] **Step 1.3: Typecheck**

Run:
```bash
bun run typecheck
```

Expected: Pass with zero errors. If any consumer still references `"silver"` as a theme value, fix those references to `"white"` now before moving on. Likely touch points: none at runtime, but grep to be safe:
```bash
grep -rn '"silver"' app components hooks lib types 2>/dev/null | grep -v "classic-2008-silver"
```
Any match outside `classic-2008-silver` (preset id) should be updated to `"white"`.

- [ ] **Step 1.4: Commit**

```bash
git add hooks/use-ipod-theme.tsx
git commit -m "refactor(theme): rename silver variant to white and add IPodThemeContext"
```

---

## Task 2: Pin the dark wheel gradient to the exact quoted CSS

**Files:**
- Modify: `lib/color-manifest.ts:192-216` (the dark branches of `deriveWheelColors`)

- [ ] **Step 2.1: Align the L<0.18 branch with the user-quoted CSS**

In `lib/color-manifest.ts`, replace the existing L<0.18 branch block so the gradient matches the user-quoted wheel CSS byte-for-byte. Find:

```ts
  if (L < 0.18) {
    // Dark case — black wheel, white labels
    return {
      gradient: { from: "#2A2A2C", via: "#232325", to: "#1C1C1E" },
      border: "#3A3A3C",
      labelColor: "#FFFFFF",
      centerBorder: "#3A3A3C",
      centerGradient: { from: "#2E2E30", via: "#272729", to: "#202022" },
    };
  }
```

Replace with:

```ts
  if (L < 0.18) {
    // Dark case — authentic iPod 6G black wheel shader
    // Gradient must match the hand-tuned realistic CSS exactly.
    return {
      gradient: { from: "#1C1C1E", via: "#202022", to: "#252527" },
      border: "#2C2C2E",
      labelColor: "#FFFFFF",
      centerBorder: "#3A3A3C",
      centerGradient: { from: "#1C1C1E", via: "#202022", to: "#252527" },
    };
  }
```

- [ ] **Step 2.2: Typecheck**

Run:
```bash
bun run typecheck
```

Expected: Pass.

- [ ] **Step 2.3: Visual smoke test — black iPod**

Open `http://localhost:3000` in a browser. Confirm:
- Case is `#1A1A1A` (pure black)
- Click wheel shows the dark gradient (no banding, matches reference)
- Wheel border is a hairline `#2C2C2E`
- MENU label and skip icons are white

- [ ] **Step 2.4: Commit**

```bash
git add lib/color-manifest.ts
git commit -m "fix(wheel): pin dark wheel gradient to authentic 6G shader values"
```

---

## Task 3: Delete the two OKLCH grid color pickers from the theme panel

**Files:**
- Modify: `components/ipod/ipod-classic.tsx` (delete blocks at ~1367–1393 and ~1455–1477; also remove their `mb-4` wrappers)

- [ ] **Step 3.1: Remove the OKLCH Spectrum case picker**

In `components/ipod/ipod-classic.tsx`, find this block (starts around line 1367):

```tsx
                  {oklchReady && oklchCasePalette.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-[10px] font-medium text-[#6B7280] uppercase tracking-[0.08em] mb-2 px-1">
                        OKLCH Spectrum
                      </h4>
                      <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
                        {oklchCasePalette.map((swatch) => (
                          <button
                            key={swatch.hue}
                            onClick={() => {
                              const hex = oklchToHex(
                                OKLCH_CASE_L,
                                OKLCH_CASE_C,
                                swatch.hue,
                              );
                              if (!hex) return;
                              setSkinColor(hex);
                              saveCustomColor("case", hex);
                            }}
                            title={swatch.label}
                            className="w-8 h-8 rounded-full border border-[#B5BBC3] transition-transform hover:scale-105"
                            style={{ backgroundColor: swatch.value }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
```

Delete the entire block (the `{oklchReady && oklchCasePalette.length > 0 && (…)}` JSX expression).

- [ ] **Step 3.2: Remove the OKLCH Ambient background picker**

In the same file, find this block (starts around line 1455):

```tsx
                  {oklchReady && oklchBgPalette.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-[10px] font-medium text-[#6B7280] uppercase tracking-[0.08em] mb-2 px-1">
                        OKLCH Ambient
                      </h4>
                      <div className="grid grid-cols-7 sm:grid-cols-9 gap-2">
                        {oklchBgPalette.map((swatch) => (
                          <button
                            key={swatch.hue}
                            onClick={() => {
                              const hex = oklchToHex(OKLCH_BG_L, OKLCH_BG_C, swatch.hue);
                              if (!hex) return;
                              setBgColor(hex);
                              saveCustomColor("bg", hex);
                            }}
                            title={swatch.label}
                            className="w-6 h-6 rounded-full border border-[#B5BBC3] transition-transform hover:scale-105"
                            style={{ backgroundColor: swatch.value }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
```

Delete the entire block.

- [ ] **Step 3.3: Remove now-unused OKLCH palette state, effect, and imports**

At lines ~292–297 remove:
```tsx
  const [oklchCasePalette, setOklchCasePalette] = useState<
    { label: string; value: string; hue: number }[]
  >([]);
  const [oklchBgPalette, setOklchBgPalette] = useState<
    { label: string; value: string; hue: number }[]
  >([]);
```

At lines ~327–347 remove the `useEffect` that calls `setOklchCasePalette` / `setOklchBgPalette`:
```tsx
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!supportsOklch()) return;
    setOklchReady(true);
    setOklchCasePalette(
      buildOklchPalette(
        OKLCH_CASE_STEPS,
        OKLCH_CASE_L,
        OKLCH_CASE_C,
        CASE_OKLCH_CONFIG.hueOffset,
      ),
    );
    setOklchBgPalette(
      buildOklchPalette(
        OKLCH_BG_STEPS,
        OKLCH_BG_L,
        OKLCH_BG_C,
        BACKGROUND_OKLCH_CONFIG.hueOffset,
      ),
    );
  }, []);
```

Keep `oklchReady` state and the `!oklchReady` notice about modern browsers — that still guides users toward the custom picker path.

Then run the typechecker — it will list any now-unused imports (`OKLCH_CASE_L`, `OKLCH_CASE_C`, `OKLCH_CASE_STEPS`, `OKLCH_BG_L`, `OKLCH_BG_C`, `OKLCH_BG_STEPS`, `buildOklchPalette`, `CASE_OKLCH_CONFIG`, `BACKGROUND_OKLCH_CONFIG`, `supportsOklch`, `oklchToHex`). Delete each one from the imports list at the top of the file. `oklchToHex` may still be used by `GreyPalettePicker` indirectly — grep the file:
```bash
grep -n "oklchToHex\|supportsOklch\|buildOklchPalette" components/ipod/ipod-classic.tsx
```
Only delete imports with zero remaining references.

- [ ] **Step 3.4: Typecheck and lint**

Run:
```bash
bun run typecheck
bun run lint
```

Expected: Pass. Fix any `'X' is declared but never read` by deleting the offending import.

- [ ] **Step 3.5: Visual smoke test — theme panel**

Open the app, open the theme panel (toolbox → theme icon). Confirm:
- No "OKLCH Spectrum" grid
- No "OKLCH Ambient" grid
- "Authentic Apple Releases" grid still visible
- `GreyPalettePicker` still visible
- `HexColorInput` + eyedropper still work
- "Recent Custom" still shows saved swatches if any

- [ ] **Step 3.6: Commit**

```bash
git add components/ipod/ipod-classic.tsx
git commit -m "refactor(theme-panel): remove dead OKLCH grid pickers"
```

---

## Task 4: Remove the ASCII mode notice card

**Files:**
- Modify: `components/ipod/ipod-classic.tsx:1758-1769`

- [ ] **Step 4.1: Delete the notice**

Find this block:

```tsx
        {isAsciiView && exportStatus === "idle" && (
          <div className="mb-4 flex w-full max-w-[28rem] items-center justify-center">
            <div className="rounded-full border border-black/10 bg-white/82 px-4 py-2 text-center shadow-[0_10px_24px_rgba(0,0,0,0.08)] backdrop-blur-sm">
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-black/45">
                ASCII Mode
              </div>
              <div className="mt-0.5 text-[12px] font-medium text-black/70">
                Terminal-style Now Playing. Export GIF to animate the progress bar.
              </div>
            </div>
          </div>
        )}
```

Delete it entirely. Leave the `isPreviewView` notice above it alone.

- [ ] **Step 4.2: Typecheck**

Run:
```bash
bun run typecheck
```

Expected: Pass. If `isAsciiView` becomes unused, remove its declaration at the top of the component too.

- [ ] **Step 4.3: Visual smoke test**

In the app, switch to ASCII view via the view-mode toolbar. Confirm:
- No floating notice card above the preview
- ASCII view itself still renders

- [ ] **Step 4.4: Commit**

```bash
git add components/ipod/ipod-classic.tsx
git commit -m "refactor(viewport): drop redundant ASCII mode notice"
```

---

## Task 5: Reorder view-mode IconButtons (working first, WIP last)

**Files:**
- Modify: `components/ipod/ipod-classic.tsx:1627-1665`

- [ ] **Step 5.1: Rewrite the view-mode `IconButton` group**

Replace the contents of the view-mode toolbar `<div className="flex flex-col gap-2 p-3 …">` with this order:

```tsx
            <div className="flex flex-col gap-2 p-3 bg-[#F4F4F4] rounded-lg border border-[#E0E0E0] shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
              <IconButton
                icon={<Smartphone className="w-5 h-5" />}
                label="Flat"
                data-testid="flat-view-button"
                isActive={viewMode === "flat"}
                onClick={() => handleViewModeChange("flat")}
              />
              <IconButton
                icon={<Eye className="w-5 h-5" />}
                label="Preview"
                data-testid="preview-view-button"
                isActive={viewMode === "preview"}
                onClick={() => handleViewModeChange("preview")}
              />
              <IconButton
                icon={<Monitor className="w-5 h-5" />}
                label="Focus Mode"
                data-testid="focus-view-button"
                isActive={viewMode === "focus"}
                onClick={() => handleViewModeChange("focus")}
              />
              <IconButton
                icon={<Box className="w-5 h-5" />}
                label="3D Experience"
                badge="WIP"
                data-testid="three-d-view-button"
                isActive={viewMode === "3d"}
                onClick={() => handleViewModeChange("3d")}
              />
              <IconButton
                icon={<Terminal className="w-5 h-5" />}
                label="ASCII Mode"
                badge="WIP"
                data-testid="ascii-view-button"
                isActive={viewMode === "ascii"}
                onClick={() => handleViewModeChange("ascii")}
              />
            </div>
```

- [ ] **Step 5.2: Visual smoke test**

Open the app and inspect the view-mode toolbar. Confirm vertical order top-to-bottom:
1. Flat
2. Preview
3. Focus Mode
4. 3D Experience (WIP)
5. ASCII Mode (WIP)

- [ ] **Step 5.3: Commit**

```bash
git add components/ipod/ipod-classic.tsx
git commit -m "refactor(toolbar): group working view modes above WIP modes"
```

---

## Task 6: Typographic WIP badge + theme-aware `IconButton` default

**Files:**
- Modify: `components/ui/icon-button.tsx` (whole file)
- Modify: `components/ipod/ipod-classic.tsx` (wrap root render in `IPodThemeProvider`)

- [ ] **Step 6.1: Rewrite `components/ui/icon-button.tsx`**

Replace the file with:

```tsx
"use client";

import React from "react";
import { useIPodThemeValue } from "@/hooks/use-ipod-theme";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label?: string;
  isActive?: boolean;
  contrast?: boolean;
  badge?: string;
}

const DARK_ACTIVE =
  "border-[#0F1114] bg-[#111315] text-white shadow-[0_12px_20px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.14)] scale-[1.04]";
const DARK_CONTRAST =
  "border-[#0F1114] bg-[#111315] text-white shadow-[0_12px_20px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-[#191C20] hover:shadow-[0_14px_24px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.12)] hover:scale-[1.03]";
const DARK_DEFAULT =
  "border-[#0F1114] bg-[#111315] text-white shadow-[0_10px_18px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-[#191C20] hover:shadow-[0_12px_22px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.14)] hover:scale-[1.03]";
const LIGHT_DEFAULT =
  "border-[#CDD2D8] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(237,239,242,0.96))] text-[#111315] shadow-[0_10px_18px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.98),inset_0_-1px_0_rgba(0,0,0,0.06)] hover:border-[#BFC5CC] hover:bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(240,242,245,0.98))] hover:shadow-[0_12px_20px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_0_rgba(0,0,0,0.07)] hover:scale-[1.03]";

export function IconButton({
  icon,
  label,
  isActive,
  contrast,
  badge,
  className = "",
  ...props
}: IconButtonProps) {
  const theme = useIPodThemeValue();
  const defaultClasses = theme === "black" ? DARK_DEFAULT : LIGHT_DEFAULT;

  const stateClasses = isActive
    ? DARK_ACTIVE
    : contrast
      ? DARK_CONTRAST
      : defaultClasses;

  return (
    <button
      type="button"
      aria-label={props["aria-label"] ?? label}
      className={`
        relative group flex h-11 w-11 items-center justify-center rounded-full border
        transition-all duration-200 ease-out active:scale-[0.98]
        disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100
        ${stateClasses}
        ${className}
      `}
      {...props}
    >
      {icon}
      {badge && (
        <span className="pointer-events-none absolute -right-1 -top-1 whitespace-nowrap text-[8px] font-bold uppercase tracking-[0.14em] text-black/40">
          {badge}
        </span>
      )}
      {label && (
        <span className="pointer-events-none absolute right-full mr-2 hidden whitespace-nowrap rounded-full border border-black/10 bg-white/92 px-2.5 py-1 text-[11px] font-medium text-black/72 opacity-0 shadow-[0_8px_16px_rgba(0,0,0,0.08)] transition-opacity group-hover:opacity-100 sm:block">
          {label}
        </span>
      )}
    </button>
  );
}
```

Notes:
- `DARK_DEFAULT` is new — it is the dark filled variant without the `scale-[1.04]` lock that `DARK_ACTIVE` uses, so inactive buttons still look different from the selected one.
- The badge drops `border-[#E8B65A] bg-[#FFF4CC] px-1.5 py-[1px] rounded-full shadow-[…]`. Pure type.

- [ ] **Step 6.2: Wire the theme provider in `ipod-classic.tsx`**

In `components/ipod/ipod-classic.tsx`, import the provider at the top:

```ts
import useIPodTheme, { IPodThemeProvider } from "@/hooks/use-ipod-theme";
```

(Adjust the existing import — if it already imports `useIPodTheme` alone, merge with `IPodThemeProvider`.)

Find the outermost render return — the top-level `<div>` that wraps the whole iPod surface (it is the JSX root of the `IpodClassic` component function). Wrap that return in the provider:

```tsx
  return (
    <IPodThemeProvider theme={theme}>
      {/* existing root JSX here unchanged */}
    </IPodThemeProvider>
  );
```

Concretely: locate the `return (` at roughly line ~1190 and wrap its single top-level child.

- [ ] **Step 6.3: Typecheck and lint**

Run:
```bash
bun run typecheck
bun run lint
```

Expected: Pass.

- [ ] **Step 6.4: Visual smoke test — black theme**

Load `http://localhost:3000` (default black theme). Confirm:
- Every view-mode toolbar button renders with the dark `#111315` fill
- The active button has the slightly stronger `scale-[1.04]` look
- Hovered buttons transition to the lighter hover fill
- WIP badges on 3D and ASCII buttons show as small uppercase letters with no yellow chip
- Export button (contrast variant) still renders dark

- [ ] **Step 6.5: Visual smoke test — white theme**

Open the theme panel, toggle the iPod Theme switch to white. Confirm:
- Case flips to `#F5F5F7`
- Wheel flips to the light silver gradient
- Every view-mode toolbar button renders with the light gradient fill
- Active button is still dark-filled so the selection remains obvious
- WIP badges still render as muted type on the light buttons
- Reload the page — it comes back up in white (persistence works)
- Toggle back to black — everything flips back

- [ ] **Step 6.6: Commit**

```bash
git add components/ui/icon-button.tsx components/ipod/ipod-classic.tsx hooks/use-ipod-theme.tsx
git commit -m "feat(toolbar): theme-aware IconButton default and typographic WIP badge"
```

---

## Task 7: Verification pass

**Files:**
- No code changes — verification only.

- [ ] **Step 7.1: OpenSpec strict validation**

Run:
```bash
openspec validate update-ipod-theme-black-white-toggle --strict --no-interactive
```

Expected: `Change 'update-ipod-theme-black-white-toggle' is valid`.

- [ ] **Step 7.2: Typecheck + lint**

Run:
```bash
bun run typecheck
bun run lint
```

Expected: Both pass.

- [ ] **Step 7.3: Full visual regression sweep**

At `http://localhost:3000`, run through both themes and every view mode:

| Theme | View mode | Expect |
|-------|-----------|--------|
| black | Flat      | case `#1A1A1A`, dark wheel gradient, dark toolbar buttons |
| black | Preview   | marquee notice still visible, dark toolbar |
| black | Focus     | focus viewport, dark toolbar |
| black | 3D (WIP)  | 3D shell renders in black, WIP badge is type-only |
| black | ASCII     | ASCII renders, no explanatory card above it, dark toolbar |
| white | Flat      | case `#F5F5F7`, silver wheel gradient, light toolbar buttons |
| white | Preview   | marquee notice visible, light toolbar |
| white | Focus     | focus viewport, light toolbar |
| white | 3D (WIP)  | 3D shell renders in white |
| white | ASCII     | ASCII renders, no explanatory card, light toolbar |

Also open the theme panel in both themes and confirm the two OKLCH grids are gone and nothing else regressed.

- [ ] **Step 7.4: Export smoke test**

Trigger PNG export (black theme, Flat view). Confirm exported image matches on-screen shell. Repeat in white theme.

- [ ] **Step 7.5: Git status sanity check**

Run:
```bash
git status
git log --oneline main..HEAD
```

Expected: six commits on `feat/ipod-theme-black-white-toggle`, tree clean aside from the pre-existing unstaged edits from before this plan started.

---

## Self-Review (done by plan author)

- **Spec coverage:** every requirement in `openspec/changes/update-ipod-theme-black-white-toggle/specs/ipod-design-fidelity/spec.md` maps to a task:
  - Unified Black/White Theme Toggle → Task 1 (+ Task 6.2 wires the provider)
  - Theme-Aware Toolbar Chrome → Task 6
  - Grouped View-Mode Button Ordering → Task 5
  - Typographic WIP Badge → Task 6.1
  - MODIFIED Dynamic Wheel-to-Case Color Coupling → Task 2
  - REMOVED OKLCH Grid Color Pickers → Task 3
  - REMOVED ASCII Mode Explanatory Notice → Task 4
- **Placeholder scan:** no `TBD`, `TODO`, or hand-wavy instructions. Every code step shows the code. Commands show the expected output.
- **Type consistency:** `IPodTheme` is `"black" | "white"` everywhere; `IPodThemeProvider` / `useIPodThemeValue` names match between hook and `IconButton`; `DARK_ACTIVE`, `DARK_CONTRAST`, `DARK_DEFAULT`, `LIGHT_DEFAULT` constants are defined and then referenced within the same file.
- **No dead refs:** Task 3 explicitly deletes the OKLCH imports once state/effect are removed.
