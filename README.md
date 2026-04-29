```
   ___      __   ____         ____  _       _ __        __
  / (_     / /  / __ \       / __ \(_)___ _(_) /_____ _/ /
 / / __ __/ /  / / / /_____/ / / / / __ `/ / __/ __ `/ /
/ / / // / /  / /_/ /_____/ /_/ / / /_/ / / /_/ /_/ / /
\_\ \_,_/_/  /_____/     /_____/_/\__, /_/\__/\__,_/_/
                                  /____/
                    iPod Classic Digital Clone
```

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=next.js&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

**[🎵 Live Demo](https://v0-i-pod-project-bx8feebd81r.vercel.app)** • **[📖 Docs](#documentation)** • **[🤝 Contributing](./docs/CONTRIBUTING.md)** • **[🏗️ Architecture](./docs/ARCHITECTURE.md)**

*Drag & drop your song and create an iPod-like digital footprint*

<img src="public/screenshots/ipod-flat.png" alt="iPod Classic Digital Clone" width="360" />

</div>

---

## ✨ Features

![Demo](demo.gif)


### 🎵 **iPod Classic Simulation**
- **Metadata Editing**: Title, artist, album, artwork, rating (1-5 stars)
- **Click Wheel Navigation**: Authentic iPod controls simulation
- **Progress Seeking**: Scrub through your track with visual feedback
- **Track Numbers**: Full album context with track X of Y

### 🕹️ **Interaction Modes**

| Control | Menu Screen | Now Playing Screen |
|---------|------------|-------------------|
| **Wheel rotation** | Scroll through menu items | Seek through track |
| **Center button** | Select highlighted item | Toggle edit mode |
| **Menu button** | — | Return to menu |
| **Play/Pause** | Jump to Now Playing | Visual feedback |
| **Prev / Next** | Cycle menu items | Seek -5s / +5s |

- **iPod OS Mode** (default): Full menu navigation with 9 items (Music, Videos, Photos, Podcasts, Extras, Settings, Shuffle Songs, Now Playing, About)
- **Center button on Now Playing**: Toggles edit mode — tap to make title, artist, album, rating, and time editable, tap again to lock

### 🎨 **View Modes**
```mermaid
graph LR
    A[📱 2D Edit] --> B[🎮 3D Experience]
    B --> C[🎬 Marquee Preview]
    C --> D[💻 ASCII Mode]
    D --> E[🔍 Focus Mode]
    E --> A
```

- **2D Edit Mode**: Full metadata editing interface
- **3D iPod Classic**: Interactive 3D rendering with Three.js
- **Marquee Preview**: Animated scrolling text simulation
- **ASCII Mode**: Terminal-style text representation
- **Focus Mode**: Minimal, distraction-free view

### 📤 **Export Capabilities**

```mermaid
flowchart TD
    A[Export Request] --> B{Export Type}
    B -->|PNG| C[Create Detached Clone]
    B -->|GIF| D[Create Animation Clone]
    C --> E[html-to-image]
    E -->|Success| F[Process Blob]
    E -->|Fail| G[html2canvas Fallback]
    G --> F
    D --> H[Capture 12 FPS Frames]
    H --> I[GIF Encoding]
    I --> F
    F --> J{Platform}
    J -->|Mobile| K[Web Share API]
    J -->|Desktop| L[Blob Download]
    K -->|Fail| M[Fallback Download]
```

- **PNG Export**: 4x resolution (1200×1600px) with dual fallback strategy
- **Animated GIF**: 12 FPS marquee animation with `gifenc` encoding
- **Platform Detection**: Web Share API for mobile, download for desktop
- **Automatic Fallback**: Graceful degradation if primary method fails

### 🎨 **Customization**

- **138+ Grey Tones**: 6 undertone families (Neutral, Warm, Cool, Greige, Sage, Lavender) × 23 perceptual lightness stops + OKLCH spectrum picker
- **9 Apple Colors**: Classic iPod finishes from graphite to starlight
- **Dual Theming**: iPod case color + Background color independent control
- **Color History**: Track and revisit recent color choices
- **Live Preview**: Real-time updates across all view modes

### 💾 **Snapshot System**

```mermaid
sequenceDiagram
    participant U as User
    participant C as Component
    participant S as Storage
    participant L as localStorage

    U->>C: Edit Metadata
    C->>S: saveMetadata()
    S->>L: Store JSON

    U->>C: Save Snapshot
    C->>S: saveSnapshot()
    S->>L: Full State

    U->>C: Reload Page
    L->>S: Restore Data
    S->>C: Hydrate State
    C->>U: Restored UI
```

- **Auto-save**: Metadata and UI state persist automatically
- **Manual Snapshots**: Save complete state snapshots
- **Quick Restore**: One-click restoration of saved snapshots
- **localStorage**: Client-side persistence, no backend required

### 📱 **PWA Support**

- Installable as Progressive Web App
- Offline-capable with service worker caching
- Mobile-optimized responsive design
- Touch-friendly interface

---

## 🚀 Quick Start

### Prerequisites

- **[Bun](https://bun.sh)** 1.1+
- **Git** for cloning the repository

### Installation

```bash
# Clone the repository
git clone https://github.com/stussysenik/v0-ipod.git
cd v0-ipod

# Install dependencies
bun install

# Start development server
bun run dev
```

The app will be available at **`http://localhost:4001`**

> **💡 Tip**: Override the port if needed:
> ```bash
> PORT=4010 bun run dev
> PORT=4010 bun run start
> ```

### Build for Production

```bash
bun run build
bun run start
```

---

## 🧭 Design Workflow

This repository now uses **Storybook as the default review surface** for shared
UI, tokens, and the physical iPod assembly.

Use the **app page** when you need full integration behavior:

- metadata editing flow
- persistence and snapshot behavior
- export behavior
- broader UX validation across the whole workbench

Use **Storybook** when you want to change a visual system input or a component
and inspect it in isolation first.

### What Is A Story?

A **story** is a small isolated example of a component or visual surface.

Examples:

- an `IconButton` in default, hover, focus, and disabled states
- the iPod status bar by itself
- the full physical iPod assembly with real screen and click-wheel parts
- a token manifest board that lets you inspect source values before changing
  component code

Stories are not the app. They are focused review fixtures for one component,
one assembly, or one source-of-truth surface at a time.

### Storybook Commands

```bash
# Run Storybook locally for day-to-day work
bun run storybook

# Build the static Storybook site
bun run build-storybook

# Run Storybook-linked tests
bun run storybook:test

# Run build + Storybook tests together
bun run storybook:validate
```

How to use them:

- Use `bun run storybook` while actively designing or refactoring.
- Use `bun run build-storybook` to make sure the Storybook site compiles cleanly.
- Use `bun run storybook:test` to verify story interactions and test coverage.
- Use `bun run storybook:validate` before landing larger Storybook-related changes.

`bun run build-storybook` is **not** the main daily command. It is the static
verification/build command. The main interactive command is `bun run storybook`.

### Source Of Truth Map

There are three main design ownership layers in this repo:

1. `tokens/*`
   Shared reusable UI tokens.
   Today this is mainly `tokens/shared-ui.json`.

2. `scripts/*.json`
   Product-owned iPod manifests.
   These are not shared design-system primitives. They hold iPod-specific color,
   finish, chrome, and surface data.

3. `components/*`
   The actual implementation layer.
   `components/ui/*` is shared UI.
   `components/ipod/*` is product-owned iPod assembly code.

### Practical Loop

If you want to change a shared primitive:

1. Edit `tokens/shared-ui.json` if the styling change is semantic and reusable.
2. Open `tokens/shared-ui/Manifest` in Storybook.
3. Open the affected `components/ui/*` story, for example `components/ui/IconButton`.
4. Adjust the component only if the token change is not enough.
5. Run `bun run build-storybook` when the change is ready to verify.

If you want to change the physical iPod finish, screen chrome, or wheel:

1. Edit the owning product source:
   `scripts/color-manifest.json`, `scripts/design-system.json`, or a
   `components/ipod/*` file.
2. Open the matching Storybook entry first:
   `scripts/color-manifest/ProductFinishes`,
   `components/ipod/display/IpodStatusBar`,
   `components/ipod/display/IpodScreen`,
   `components/ipod/controls/IpodClickWheel`,
   `components/ipod/device/PhysicalIpod`.
3. Review the isolated element first, then the full physical assembly story.
4. Open the app workbench only after the Storybook pass looks right.

### Storybook Sidebar Shape

The Storybook tree mirrors repository ownership on purpose:

- `Foundations/*`
- `tokens/*`
- `components/ui/*`
- `components/ipod/*`
- `scripts/*`

That means you should be able to move from a Storybook entry to the owning file
without translation.

Recommended first-read order inside Storybook:

1. `Foundations/Start Here`
2. `tokens/shared-ui/Manifest`
3. `components/ipod/device/PhysicalIpod`
4. the relevant isolated component story
5. `scripts/color-manifest/ProductFinishes` when tuning finish direction

Important:

- changing Storybook controls does **not** persist anything globally
- changing the real source file does

If you tweak a color in Storybook controls, you are only previewing a temporary
runtime state for that story. If you edit `tokens/shared-ui.json`,
`scripts/color-manifest.json`, `scripts/design-system.json`, or the owning
`components/*` file, every consumer of that source updates globally.

### Figma / Tokens Studio

If design work happens in Figma:

- shared primitive changes still start in repository token files
- Storybook is used to review the result in code
- Tokens Studio syncs to the repository JSON

The repository stays authoritative. Figma sync is downstream collaboration, not
a parallel source of truth.

---

## 🎯 User Workflow

```mermaid
graph LR
    A[🎵 Upload Song] --> B[✏️ Edit Metadata]
    B --> C[🎨 Customize Appearance]
    C --> D{Choose View}
    D -->|2D| E[📝 Edit Mode]
    D -->|3D| F[🎮 3D Experience]
    D -->|Preview| G[🎬 Marquee Preview]
    D -->|ASCII| H[💻 Terminal Mode]
    E --> I[📤 Export PNG]
    G --> J[📤 Export GIF]
    H --> J
```

---

## 📦 Project Structure

```
v0-ipod/
├── app/                      # Next.js 15 app directory
│   ├── layout.tsx           # Root layout with PWA manifest
│   └── page.tsx             # Main iPod component page
├── components/
│   ├── ipod/
│   │   ├── ipod-classic.tsx        # Main iPod container
│   │   ├── ipod-screen.tsx         # Screen display logic
│   │   ├── ascii-ipod.tsx          # ASCII mode renderer
│   │   ├── grey-palette-picker.tsx # OKLCH grey palette picker
│   │   └── click-wheel.tsx         # Navigation controls
│   ├── three/
│   │   └── three-d-ipod.tsx        # 3D iPod with Three.js
│   └── ui/                          # Radix UI components
├── lib/
│   ├── export-utils.ts              # PNG/GIF export pipeline
│   ├── storage.ts                   # localStorage persistence
│   └── utils.ts                     # Utility functions
└── public/
    └── manifest.json                # PWA manifest
```

---

## 🏗️ Component Architecture

```mermaid
graph TD
    A[IPodClassic] --> B[IPodScreen]
    A --> C[ClickWheel]
    A --> D[ThreeDIPod]
    B --> E[MarqueeText]
    B --> F[ProgressBar]
    B --> G[StarRating]
    B --> H[EditableText]
    A --> I[ExportUtils]
    I --> J[PNG Export]
    I --> K[GIF Export]

    style A fill:#3178C6,stroke:#fff,color:#fff
    style I fill:#61DAFB,stroke:#000,color:#000
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (React 19) |
| **Language** | TypeScript (strict mode) |
| **3D Rendering** | Three.js + React Three Fiber |
| **UI Components** | Radix UI + Tailwind CSS |
| **Export Pipeline** | html-to-image + html2canvas + gifenc |
| **State Management** | React useReducer + Context |
| **Storage** | localStorage API |
| **PWA** | @ducanh2912/next-pwa |
| **Deployment** | Vercel |

---

## 🔎 Verification

This repository currently does not ship with a committed automated test suite.
Use the existing quality gates plus focused manual checks while rebuilding test
ownership:

```bash
bun run lint
bun run format:check
bun run type-check
bun run build
```

---

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Start development server on port 4001 |
| `bun run build` | Build production bundle |
| `bun run start` | Start production server |
| `bun run clean:next` | Remove `.next` if a stale local build causes runtime issues |
| `bun run lint` | Run OXC (`oxlint`) |
| `bun run lint:fix` | Auto-fix OXC lint issues |
| `bun run lint:eslint` | Run the legacy Next/ESLint ruleset |
| `bun run format` | Format code with Prettier |
| `bun run format:check` | Check formatting without changes |
| `bun run type-check` | Run TypeScript type checking |
| `bun run validate` | Run lint + format check + type check |
| `bun run storybook` | Start Storybook locally on port 6006 |
| `bun run build-storybook` | Build the static Storybook site |
| `bun run storybook:test` | Run Storybook-linked Vitest coverage |
| `bun run storybook:validate` | Run Storybook build + Storybook tests |

---

## 🎨 Color Palette

### Apple Colors
`graphite` • `silver` • `starlight` • `midnight` • `blue` • `pink` • `purple` • `red` • `green`

### OKLCH Grey Palette
6 undertone families — Neutral, Warm, Cool, Greige, Sage, Lavender — each with 23 perceptually-spaced lightness stops. Hex deduplication ensures unique swatches. Gradient preview bar, curated favorites, and undertone tab persistence via localStorage.

### OKLCH Spectrum
Full spectrum color picker with infinite color possibilities

---

## 📖 Documentation

This README is the central starting point. Use the documents below for deeper
detail:

- **[Design-System Foundation](./docs/DESIGN-SYSTEM-FOUNDATION.md)**: component ownership, token boundaries, Storybook workflow
- **[Architecture](./docs/ARCHITECTURE.md)**: system structure and implementation detail
- **[Contributing](./docs/CONTRIBUTING.md)**: contribution workflow and expectations
- **[Docs Index](./docs/DOCS.md)**: entry point to the rest of the repository docs
- **[Vision](./docs/VISION.md)**: product direction and intent
- **[Roadmap](./docs/ROADMAP.md)**: planned work
- **[Tech Stack](./docs/TECHSTACK.md)**: stack overview
- **[iPod Assembly Notes](./docs/IPOD-ASSEMBLY.md)**: product-specific assembly context
- **[Pull Request Template](./.github/PULL_REQUEST_TEMPLATE.md)**: contribution guidelines

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feat/your-feature`
3. **Make your changes** using [semantic commits](./docs/CONTRIBUTING.md#semantic-commits)
4. **Run validation**: `bun run validate`
5. **Push and create a PR**

See **[CONTRIBUTING.md](./CONTRIBUTING.md)** for detailed guidelines including:
- Semantic commit conventions
- Code style guidelines
- Testing requirements
- PR review process

---

## 🐛 Troubleshooting

### Port Already in Use

If `bun run dev` fails because port 4001 is occupied:

```bash
PORT=4010 bun run dev
```

### Export Not Working on Mobile

The app uses the Web Share API on mobile devices. If your browser doesn't support it, the export will automatically fall back to direct download.

### 3D View Performance Issues

If you experience performance issues with the 3D view:
- Try switching to 2D edit mode
- Close other browser tabs
- Update your graphics drivers
- Use a modern browser (Chrome, Edge, Safari)

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details

---

## 🙏 Acknowledgments

- Inspired by the iconic **iPod Classic** design
- Built with modern web technologies
- Export pipeline leverages multiple fallback strategies for reliability
- Testing ensures cross-platform compatibility

---

<div align="center">

**Made with ❤️ for music lovers**

[⬆️ Back to Top](#)

</div>
