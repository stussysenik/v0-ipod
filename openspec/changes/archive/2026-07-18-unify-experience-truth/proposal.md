# Change: One functional truth per surface — camera, mode switching, mobile, control language, portfolio content

## Why

This link is about to be shared publicly (designer-audience tweet reply; the goal is
an interview). The first impression is a phone, and on a phone the product currently
argues with itself: `/3d` stacks **two competing bottom bars** ("Front Right Back Left
Top ¾" gizmo above "Product Front Back | ＋ Shot"), both saying "Front/Back" while
meaning different things (camera angle vs. focus framing); the iPod screen renders
**"Now Playing" twice**, overlapping; there is **no visible way** to move between `/`
and `/3d` (only ⌘K, which touch users never discover); and the `/3d` cockpits and
`/portfolio` chrome still wear bespoke one-off styles instead of the precision-
instrument control language that already landed for the 2D panels. Separately,
`/portfolio` content has drifted from the live source of truth at stussysenik.com.

This is not a feature change. It is a tightening pass: every function gets exactly
one control surface, every control comes from the one bounded design system, mobile
gets one coherent hierarchy, and the portfolio says what the real site says.

## What Changes

- **Camera control truth on `/3d`:** merge the touch gizmo (`Ipod3DTouchControls`)
  and the focus segment of `Ipod3DStudioShots` into **one** bottom bar — the six
  named angle presets — on all viewports. The camera cockpit (05) remains the
  advanced numeric editor of the *same* pose state. Ad-hoc camera persistence keys
  consolidate under one namespace. The camera also becomes **deterministic**: the
  device's framing is a pure function of the pose and the viewport, never of control
  chrome (a panel inset was shoving the device off-frame on phones — design D8), and
  user-authored camera points (saved shots, "Save pose") are archived so the product
  only ships poses it can guarantee frame the device (D9).
  **BREAKING** (removes the separate "focus mode" user-facing concept; framing folds
  into named poses; removes saved studio shots from the shipped surface).
- **Visible 2D↔3D switching:** a header affordance on `/` opens `/3d` and one on
  `/3d` returns to `/`, styled with the studio control language; customization state
  carries over (existing localStorage/portable-state bridge). The workbench's inline
  "3D Experience" view mode is removed from the view rail — `/3d` becomes the single
  3D truth. **BREAKING** (inline `viewMode:"3d"` no longer a workbench render mode).
- **Mobile experience:** exactly one bottom bar; the bar no longer overflows the
  viewport (its `＋ Shot` label is clipped off the right edge at 390px today);
  controls drawer, safe-area, and stacking coordinated so nothing collides. The
  double "Now Playing" reported in the original proposal **does not reproduce** —
  the LCD shader plane is backlight-only and cannot render a second screen; the
  one-live-screen rule stays as a regression guard (see `design.md` D3).
- **Studio control language adoption — ~~in scope~~ SPLIT OUT to
  `adopt-studio-control-language`.** The `studio-control-adoption` spec moved there
  intact; this change ships without it. It is a ~2,600-line restyle across nine files
  with no behaviour change and real regression risk on exactly the surfaces this launch
  exposes — holding the launch for a cosmetic pass would trade a real gate for a
  decorative one. The seam it leaves is visible and acknowledged (see tasks 7.3): the
  `/3d` camera bar is machined, the cockpits it sits under are still stock Tailwind.
- **Default presentation:** first paint is the Noir look (black shell, `#0048FF`
  stage) with no hydration flash and the whole device framed on mobile; built-in
  theme presets (Noir, 2008 black/silver hardware) are one-tap chips, presented —
  not hunted for. The shared link itself unfurls: Open Graph/Twitter card metadata
  with a real `og:image` (today `app/layout.tsx` has none, so a tweeted link shows
  a bare URL).
- **Shipped-surface minimalism (new capability):** the product ships only what is
  proven. The `/` rail drops from twelve controls (two badged **WIP**) to five —
  Flat, Preview, **3D Studio → `/3d`**, Zen, Copy share link. The inline 3D mode,
  ASCII, Focus, the transport, reset, and the PNG/GIF/MP4 export rail are
  **archived, not deleted**: each hides behind a `lib/feature-flags.ts` flag whose
  code path stays intact and returns with one flip. This codebase has accumulated
  exploratory surfaces through long development; the direction is to stop *showing*
  them, never to lose them.
- **Launch readiness (new capability):** the launch itself is spec'd, not assumed —
  verification runs against the deployed URL, the audience path (tweet tap on a
  physical iPhone) is tested once, motion holds under a performance trace on
  mobile, and promotion is observable (PostHog from prod) and reversible (Vercel
  instant rollback). Driven by `agent-skills:shipping-and-launch` in tasks §8.
- **Portfolio content sync:** `lib/portfolio/data.ts` → `content/senik.feed.json`
  updated to mirror stussysenik.com (identity "Mengxuan 'Senik' Zou — R&D Experience
  Design Engineer", the 11 dated works with links, education, process statement,
  footer). `/portfolio` and `/3d-portfolio` both inherit via the shared feed.

## Impact

- Affected specs (all new capabilities): `camera-control-truth`,
  `surface-mode-switching`, `mobile-experience`, `default-presentation`,
  `portfolio-content`, `shipped-surface-minimalism`, `launch-readiness`.
  (`studio-control-adoption` moved to `adopt-studio-control-language`.)
- Affected code: `components/ipod/scenes/ipod-3d-touch-controls.tsx` (deleted),
  `components/ipod/scenes/ipod-3d-studio-shots.tsx`,
  `components/ipod/scenes/ipod-3d-stage.tsx`,
  `components/ipod/scenes/ipod-3d-camera-cockpit.tsx`,
  `components/three/three-d-ipod.tsx` (screen double-render),
  `components/ipod/workbench/ipod-classic-workbench.tsx` (view rail, header nav),
  `components/ipod/command/command-registry.ts`,
  `components/ipod/panels/panel-registry.tsx`, `lib/view-modes.ts`,
  `components/ipod/scenes/portfolio-feed-stage.tsx` (chrome),
  `lib/portfolio/data.ts`, `content/senik.feed.json`.
- Relationship to pending changes: **builds on** `refactor-studio-controls-
  deterministic` (its primitives are the vocabulary this change adopts everywhere;
  its own tasks stay in that change) and **does not overlap**
  `finish-customizer-experience` (robustness/portable state — this change *uses* the
  portable-state bridge for mode switching).
