Updated: 04-29-2026

# RE:MIX — Tech Stack

## Runtime

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Package Manager | Bun | 1.1.x | Default dependency and script runner |
| Framework | Next.js | 15.2.6 | App routing, SSR, bundling |
| UI | React | 19 | Component rendering |
| Language | TypeScript | 5.x | Type safety |
| Styling | Tailwind CSS | 3.4 | Utility-first styles |
| 3D | Three.js + R3F | 0.182 / 9.5 | Interactive 3D iPod view |
| Animations | tailwindcss-animate | 1.0 | CSS keyframe animations |
| Toasts | Sonner | 1.7 | Notification system |
| Analytics | Vercel Analytics | 1.3 | Usage tracking |

## Component Libraries

| Library | Purpose |
|---------|---------|
| Radix UI | Accessible primitives (dialog, popover, tooltip, etc.) |
| Lucide React | Icon system (toolbar only — wheel icons are hand-crafted SVGs) |
| class-variance-authority | Component variant management |
| clsx + tailwind-merge | Conditional class composition |

## Export Pipeline

| Tool | Purpose |
|------|---------|
| html-to-image | PNG rasterization at 4x pixel ratio |
| gifenc | GIF encoding for animated marquee exports |
| Web Share API | Mobile sharing (with download fallback on desktop) |

## State Management

- **useReducer** — Song metadata (title, artist, album, artwork, time, rating, track)
- **useState** — UI state (view mode, colors, presets, interaction model, OS screen)
- **localStorage** — Persistence for metadata, UI settings, snapshots, export counter

No external state library. All state is local to `IPodClassic` component and passed down via props.

## Data And Dependency Policy

- **TanStack Query** — Not used. The app is currently local-first and does not yet have meaningful remote server state.
- **Zustand / Nanostores** — Not used. The preferred path is to extract pure domain state and update logic before introducing a global client-state abstraction.

TanStack Query should only be introduced if the product gains real remote state such as:
- authenticated cloud snapshots
- provenance or finish catalogs fetched over the network
- async import/processing jobs
- shared workspaces or collaboration surfaces

Client-state libraries should only be introduced if multiple independently mounted consumers create a clear shared-state need that pure local state and composition no longer satisfy cleanly.

## Testing

| Tool | Purpose |
|------|---------|
| Playwright | E2E and visual regression tests |
| Chrome DevTools MCP | Runtime browser verification |

## Build & Dev

| Tool | Purpose |
|------|---------|
| Bun | Default install and script runner |
| OXC / Oxlint | Default linting |
| ESLint | Legacy Next-specific lint fallback |
| PostCSS | CSS processing for Tailwind |
| PWA (@ducanh2912/next-pwa) | Offline-capable progressive web app |

## Color System

The color system is custom-built in `lib/color-manifest.ts`:

- **Surface tokens** — Named colors for shell, screen, wheel, and status bar
- **Text tokens** — Color + opacity pairs for title, artist, album, track info
- **Authentic finishes** — 9 official iPod Classic colors (Graphite, Black, Silver, Gold, Green, Blue, Pink, Red, White)
- **Dynamic derivation** — Wheel colors computed from shell luminance
- **OKLCH palette** — 138+ grey tones across 6 undertone families, plus a full hue spectrum

## Hardware Preset System

Three preset configurations in `lib/ipod-classic-presets.ts` encoding pixel-precise dimensions for:
- Shell (padding, radius)
- Screen (frame size, font sizes, artwork size, progress bar height)
- Click wheel (diameter, center button size, label positions, icon sizes)

Each preset maps to a real iPod Classic generation with historically accurate proportions.

## Key Architecture Decisions

1. **No audio engine** — This is a visual simulator and creative tool, not a music player
2. **Single component orchestrator** — `IPodClassic` owns all state; no context providers for core state
3. **Preset-driven dimensions** — All sizes come from preset tokens, not magic numbers
4. **Export-safe mode** — Components render differently during export (no hover states, simplified shadows)
5. **Hand-crafted wheel SVGs** — No icon library for click wheel controls; every icon is a custom SVG matching real iPod hardware

## Current Architecture Shape

The codebase is currently organized around a strong visual prototype:

- `components/ipod/ipod-classic.tsx` acts as the top-level workbench and orchestration root
- `components/ipod/ipod-screen.tsx` currently mixes display chrome and screen-scene behavior
- `components/ipod/ipod-device-shell.tsx` represents the outer enclosure
- `components/ipod/click-wheel.tsx` represents the hardware control assembly
- `lib/storage.ts` and `lib/export-utils.ts` already provide partial effect boundaries

This is workable, but it is still more prototype-shaped than assembly-shaped.

## Target Architecture Direction

The intended direction is an Elm-like split:

- **Model** — Canonical snapshot-oriented domain state
- **Update** — Pure state transitions driven by explicit actions
- **View** — Physical assemblies, scenes, panels, and editors
- **Effects** — Persistence, export, click audio, and import adapters

The intended naming model follows physical product boundaries:

- `workbench`
- `device`
- `shell`
- `display`
- `scene`
- `panel`
- `control`
- `editor`

## Target File Taxonomy

The next architecture pass should converge toward categories like:

- `components/ipod/workbench`
- `components/ipod/device`
- `components/ipod/display`
- `components/ipod/scenes`
- `components/ipod/panels`
- `components/ipod/editors`
- `components/ipod/hooks`
- `lib/ipod-state`

This should make the repo easier to review as a design-engineering system while keeping the CSS and visual fidelity work central.

ARCHIVE:

# Tech Stack

This project is built using modern Next.js and a highly capable browser-side rendering suite.

## Core Framework
- **Next.js 15+ (App Router)**: Fast bundling, server-components where necessary, and robust routing.
- **React 19**: Hooks, transitions, and concurrent rendering for complex 3D scenes.
- **TypeScript**: Ensuring robust interaction flows and safe data access.

## UI & Styling
- **Tailwind CSS & Autoprefixer**: For utility-first styling and theme tokens.
- **Radix UI**: Accessible primitives (dialogs, labels, sliders, toggles) providing the unstyled baseline.
- **Framer Motion / Tailwind Animate**: Polished spring animations and transitions.

## 3D Rendering & Capture
- **Three.js & React Three Fiber (@react-three/fiber)**: Full 3D rendering pipeline for the iPod model.
- **Drei (@react-three/drei)**: Camera controls, shadows, and glTF abstractions.
- **html-to-image & html2canvas**: Deterministic node capture from DOM to canvas/blob.
- **gifenc**: Ultra-light client-side GIF encoding for animated marquee exports.

## UX Polish
- **Sonner**: Delightful toast notifications (used during export states).
- **Lucide React**: Crisp UI iconography.
- **PWA Capabilities**: Leverages `@ducanh2912/next-pwa` for native-like installations on mobile.
