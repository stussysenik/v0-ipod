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
- **Local DS foundation**: `DESIGN.md` plus `tokens/shared-ui.json` define the
  reusable primitive layer, while `scripts/color-manifest.json` and
  `scripts/design-system.json` remain product-token sources for the iPod artifact.

## 3D Rendering & Capture
- **Three.js & React Three Fiber (@react-three/fiber)**: Full 3D rendering pipeline for the iPod model.
- **Drei (@react-three/drei)**: Camera controls, shadows, and glTF abstractions.
- **html-to-image & html2canvas**: Deterministic node capture from DOM to canvas/blob.
- **gifenc**: Ultra-light client-side GIF encoding for animated marquee exports.

## UX Polish
- **Sonner**: Delightful toast notifications (used during export states).
- **Lucide React**: Crisp UI iconography.
- **PWA Capabilities**: Leverages `@ducanh2912/next-pwa` for native-like installations on mobile.

## Repository Topology
- **Workbench-first architecture**: `components/ipod/workbench` owns orchestration, state wiring, export triggers, and mode switching.
- **Assembly-aligned view layers**: `device`, `display`, `scenes`, and `panels` map to physical or screen-level ownership.
- **Typed primitives**: `components/ipod/controls` and `components/ipod/editors` expose intent-first props and keep durable effects out of leaf components.
- **Explicit export surface**: `components/ipod/export` and `lib/export` isolate framed capture, preview playback, and preset concerns from general device rendering.
- **Elm-ish local state**: `lib/ipod-state` remains the canonical `model -> update -> selectors -> effects` home for application state.
