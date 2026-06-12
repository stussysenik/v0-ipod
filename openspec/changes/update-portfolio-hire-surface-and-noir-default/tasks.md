## 1. Noir factory default (/3d)

- [ ] 1.1 Extend `IpodClassicPresetDefinition` with optional `defaultRingColor` / `defaultCenterColor`; set black preset overrides (ring `#313030`, center `#141212`) and backdrop `#0048FF`
- [ ] 1.2 `createInitialIpodWorkbenchModel` honors preset wheel overrides before derivation
- [ ] 1.3 Default studio rig and `sanitizeLightingConfig` fallback → `DESIGNER_DARK_RIG`
- [ ] 1.4 Black finish asset in the color cockpit reproduces the saved look (stage `#0048FF`, explicit wheel)

## 2. Edge Noir rig

- [ ] 2.1 Add `EDGE_NOIR_RIG` to `studio-lighting-config.ts` with edge-carving softbox/rim layout
- [ ] 2.2 Register in `RIG_PRESETS` with a near-black stage so the lighting cockpit picks it up

## 3. Savable themes

- [ ] 3.1 `lib/studio-themes.ts`: `StudioTheme` record, localStorage CRUD (`ipodStudioThemes`), sanitization, built-in "Noir"
- [ ] 3.2 Themes shelf in the color cockpit: apply (colors + rig), save current, delete user themes

## 4. /portfolio hire surface

- [ ] 4.1 `data.ts`: role/bios/languages/award/works/writings/taste/hire data synced with portfolio-forever voice
- [ ] 4.2 `os.ts`: Hire Me screens (hire, mission, tracks, track, proof, pillar, contact) + Taste screens
- [ ] 4.3 `portfolio-screen.tsx`: renderers for the new content screens
- [ ] 4.4 Stage: noir presentation, Designer Dark lighting, `#0048FF` page, identity overlay re-inked for dark stage
- [ ] 4.5 Mobile: orbit lock (default locked on coarse pointers), `touch-action`/overscroll guards, safe-area-aware overlays
- [ ] 4.6 `app/portfolio/page.tsx`: metadata + stage color

## 5. Verification

- [ ] 5.1 `tsc --noEmit` and vitest suite green
- [ ] 5.2 Visual check at 1440 / 393 (iPhone 15 Pro) / 375 (SE) widths: noir device renders, hire menu browsable via wheel
- [ ] 5.3 `openspec validate update-portfolio-hire-surface-and-noir-default --strict --no-interactive`
