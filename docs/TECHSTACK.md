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
