# Project Progress

## iPod Classic Simulator

A pixel-perfect iPod Classic simulator with editable metadata fields, built with Next.js and React.

---

## Completed Features

### Core UI
- [x] iPod Classic body with realistic styling and shadows
- [x] LCD screen with status bar, artwork display, and metadata
- [x] Click wheel with interactive controls
- [x] 2D flat view mode
- [x] 3D view mode (React Three Fiber)
- [x] Focus/close-up view mode

### Editable Fields
- [x] **Title** - Click to edit song title
- [x] **Artist** - Click to edit artist name
- [x] **Album** - Click to edit album name
- [x] **Artwork** - Click to upload custom artwork
- [x] **Rating** - Interactive star rating (1-5)
- [x] **Current Time** - Editable playback position
- [x] **Duration** - Editable total song length
- [x] **Track Number** - Click "X of Y" to edit current track
- [x] **Total Tracks** - Click "X of Y" to edit total tracks

### Customization
- [x] Case color picker (presets + custom color)
- [x] Background color picker (presets + custom color)
- [x] High-quality PNG export (4x resolution)

### Testing Infrastructure
- [x] Playwright E2E testing setup
- [x] 7 passing tests for EditableTrackNumber component
- [x] Playwright MCP server configured
- [x] Chrome DevTools MCP server configured

---

## Latest Changes (2026-01-20)

### Predictable Export with Clear UI Feedback
- Export button now shows context-aware labels:
  - "Export 3D Render" when in 3D view mode
  - "Export 2D Image" when in 2D or Focus view modes
- 3D exports now reset model to front-facing position before capture
  - No more unexpected side-angle exports from mouse position
  - Predictable, professional-looking 3D renders every time

### Technical Implementation
- Added `IpodModelProps` interface with `onRegisterReset` callback
- `IpodModel` component registers rotation reset function
- `SceneCapture` calls reset before high-res render
- Wired up refs through `ThreeDIpod` parent component

---

## Previous Changes (2026-01-17)

### Added
- `EditableTrackNumber` component for inline track number editing
- `UPDATE_TRACK_NUMBER` and `UPDATE_TOTAL_TRACKS` reducer actions
- Playwright test suite with 7 E2E tests
- `playwright.config.ts` configuration
- MCP server integrations for browser automation

### Test Coverage
| Test | Status |
|------|--------|
| displays initial track number format | ✅ Pass |
| track number becomes editable on click | ✅ Pass |
| saves new track number on Enter | ✅ Pass |
| reverts on Escape | ✅ Pass |
| validates track number cannot exceed total | ✅ Pass |
| total tracks is also editable | ✅ Pass |
| saves on blur | ✅ Pass |

---

## File Structure

```
v0-ipod/
├── app/                    # Next.js app directory
├── components/
│   ├── ipod-classic.tsx    # Main iPod component with state management
│   ├── ipod-screen.tsx     # LCD screen with all editable fields
│   ├── click-wheel.tsx     # Interactive click wheel
│   ├── three-d-ipod.tsx    # 3D view implementation
│   ├── editable-text.tsx   # Reusable inline text editor
│   ├── editable-time.tsx   # Time input component
│   ├── editable-duration.tsx # Duration input component
│   ├── editable-track-number.tsx # Track number editor
│   ├── star-rating.tsx     # Interactive star rating
│   ├── progress-bar.tsx    # Seekable progress bar
│   └── image-upload.tsx    # Artwork upload handler
├── tests/
│   └── editable-track-number.spec.ts # E2E tests
├── playwright.config.ts    # Playwright configuration
└── types/
    └── ipod.ts             # TypeScript interfaces
```

---

## Running Tests

```bash
# Run all E2E tests
npx playwright test

# Run tests with UI
npx playwright test --ui

# View test report
npx playwright show-report
```

---

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```
