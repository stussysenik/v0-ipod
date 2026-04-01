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
![Tests](https://img.shields.io/badge/Tests-Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

**[🎵 Live Demo](https://v0-i-pod-project-bx8feebd81r.vercel.app)** • **[📖 Docs](#documentation)** • **[🤝 Contributing](./CONTRIBUTING.md)** • **[🏗️ Architecture](./ARCHITECTURE.md)**

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

- **Node.js** 18+ (or use [bun](https://bun.sh) / pnpm)
- **Git** for cloning the repository

### Installation

```bash
# Clone the repository
git clone https://github.com/stussysenik/v0-ipod.git
cd v0-ipod

# Install dependencies
npm install
# or: bun install
# or: pnpm install

# Start development server
npm run dev
```

The app will be available at **`http://localhost:4001`**

> **💡 Tip**: Override the port if needed:
> ```bash
> PORT=4010 npm run dev
> PORT=4010 npm run start
> ```

### Build for Production

```bash
npm run build
npm run start
```

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
├── tests/
│   ├── interactions.spec.ts         # E2E interaction tests
│   └── mobile-usability.spec.ts     # Mobile responsiveness tests
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
| **Testing** | Playwright (E2E) |
| **PWA** | @ducanh2912/next-pwa |
| **Deployment** | Vercel |

---

## 🧪 Testing

```bash
# Run all tests
npx playwright test

# Run tests with UI mode
npx playwright test --ui

# Run tests in debug mode
npx playwright test --debug

# Run specific test file
npx playwright test tests/interactions.spec.ts
```

### Test Coverage

- ✅ Metadata editing and persistence
- ✅ View mode switching (2D, 3D, Preview, ASCII, Focus)
- ✅ Color customization and history tracking
- ✅ Export functionality (PNG and GIF)
- ✅ Snapshot save/restore
- ✅ Mobile responsiveness
- ✅ Touch interactions

---

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server on port 4001 |
| `npm run build` | Build production bundle |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix linting issues |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check formatting without changes |
| `npm run type-check` | Run TypeScript type checking |
| `npm run validate` | Run lint + format check + type check |
| `npm test` | Run Playwright tests |
| `npm run test:ui` | Run tests with UI |
| `npm run test:debug` | Run tests in debug mode |

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

- **[Contributing Guide](./CONTRIBUTING.md)**: Learn about semantic commits and development workflow
- **[Architecture Deep-Dive](./ARCHITECTURE.md)**: Technical implementation details and system design
- **[Pull Request Template](./.github/PULL_REQUEST_TEMPLATE.md)**: Contribution guidelines

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feat/your-feature`
3. **Make your changes** using [semantic commits](./CONTRIBUTING.md#semantic-commits)
4. **Run validation**: `npm run validate`
5. **Push and create a PR**

See **[CONTRIBUTING.md](./CONTRIBUTING.md)** for detailed guidelines including:
- Semantic commit conventions
- Code style guidelines
- Testing requirements
- PR review process

---

## 🐛 Troubleshooting

### Port Already in Use

If `npm run dev` fails because port 4001 is occupied:

```bash
PORT=4010 npm run dev
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
