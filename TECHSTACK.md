# RE:MIX — Tech Stack

## Runtime

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
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

## Testing

| Tool | Purpose |
|------|---------|
| Playwright | E2E and visual regression tests |
| Chrome DevTools MCP | Runtime browser verification |

## Build & Dev

| Tool | Purpose |
|------|---------|
| ESLint | Linting (next config + prettier plugin) |
| Prettier | Code formatting |
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
