# Change: 3D Studio Control Suite for /3d

## Why

`/3d` should stop reading like a "doodlish," blown-out 3D toy and start reading like a
real product artifact — the kind Jony Ive, Tony Fadell, and Vercel design engineers
would sign off on. The render must be **reliable and trustworthy** first (accurate
materials, lighting, and geometry), then **directly controllable** (intuitive camera +
product + lighting controls exposed through one central surface), and finally
**cinematic** (a dependable single-frame front export plus additive motion presets).

Today: the front face is rendered as near-dielectric matte paint under an over-driven
240-intensity key light, so the light finish clips to flat white; the 2008 Classic is
mislabeled "White" when it shipped Silver/Black anodized aluminum; controls are
scattered across panels; the click wheel is decorative, not functional; there is no
developer surface to tune lighting/material/camera live and bake winners.

## What Changes

- **3D product fidelity** — model anodized aluminum as dyed metal (full metalness,
  satin roughness, env-driven), apply the real iconic 2008 Classic palette
  (Silver / Black, never paper-white), tighten concentric click-wheel geometry, and
  define a well-grounded, cinematic, Apple-look default lighting rig (the env-first rig is
  also what rescues the **Silver** finish from reading near-black). Plus a **personalized
  back engraving** (carrot 🥕 instead of the Apple logo, "Designed by Stüssy Senik",
  "Manufactured in Czech Republic") and **consistent storage (GB)** across screen +
  engraving + preset. *(Baseline material/lighting/color correction has already landed as a
  bugfix; this spec ratifies and extends it.)*
- **3D camera system** — an orbital gimbal with a toggleable XYZ axis visualization
  (origin triad + corner ViewCube) read in the **same studio coordinates** as the
  pose HUD; orthogonal locks (dead-on Front/Back/Left/Right/Top/Bottom snaps with free
  orbit otherwise); detent feedback (vibrate on touch, visual + audio detent on
  desktop); user-settable/savable camera positions; resizable stage. Plus **saved studio
  shots** — a one-tap "quick variable" bundling camera pose + product perspective
  (finish/colors/orientation), toggleable from the bottom bar next to Product/Front/Back.
- **3D motion presets** — additive, toggleable camera-move presets, including a new
  MKBHD-style robotic-crane move, switchable against the existing moves without
  replacing them.
- **3D export (THE headline)** — export is the primary focus of `/3d`. A reliable
  **single-position, highest-fidelity front product `.mp4`** (no motion, one pose) alongside
  the existing still PNG and looping clips. Exports MUST be **WYSIWYG** (color-faithful — the
  offscreen path was rendering linear with no tone-map/sRGB encode, ~2.2 gamma too dark),
  use a **distortion-free telephoto front framing** (round wheel, square screen, no
  keystone), and **meet-or-beat the 2D product export** by applying studied
  game-development / product-photography camera + lighting craft so the shot **pops**. The
  attention hierarchy is fixed: **album cover first, then the music / now-playing, then the
  physical assembly**. Every export is **clean** — no HUD/bottom-bar/cockpit chrome in frame —
  and the HUD is **hideable** on the live stage for a clean compose mode.
- **3D control surface** — a **CMD+K command palette** as the central access point for
  everything, plus a **developer utility** (leva, a tiny Dear-ImGui-style panel) behind a
  **dev toggle** to live-tune material, lighting, and camera. Controls compose as
  **additive, moldable layers** with provenance so good/bad changes are attributable
  and revertible. Visual language: clean minimalism / translucent layered HUD
  (Persona-5-inspired energy, restrained execution). The surface MUST be **web-responsive,
  fluid, and touch-operable** (corner HUD on desktop, collapsing bottom sheet on mobile,
  with viewport-aspect-aware stage framing), and every control authored as a **reusable
  module** so it can be ported to `/portfolio` later. It exposes **device-state parity with
  2D**, including a **battery** control (level + manual/solar mode). Build it fully in `/3d`
  first, then port aspects to `/portfolio`.
- **3D interactive playback** — the click wheel and menu become functional in `/3d`:
  Menu / ‹‹ / ›› / play-pause / center act on the OS state and fire real web-API
  interaction events, and edits function as they do in 2D. Includes **direct double-tap
  editing of the now-playing screen on the device** (double-tap artwork → insert/replace the
  album cover; double-tap title/artist/album/track → inline text input) so the page is
  customizable in place and the customization bakes into exports. Pairs with a **lockable
  perspective** (camera-system) so a hard-won hero angle is locked and reused — no hunting.
- **3D UI choreography** — animate now-playing UI element positions as keyframed
  transitions that lead into the now-playing screen, and make the choreography
  **exportable in a human- and machine-readable format** (round-trippable). On-screen,
  game-dev / early-internet **HUD-style utilities** provide an interactive, visible way
  to prove state and transitions actually work (folded into the control surface).

## Impact

- Affected specs (new capabilities): `3d-product-fidelity`, `3d-camera-system`,
  `3d-motion-presets`, `3d-export`, `3d-control-surface`, `3d-interactive-playback`,
  `3d-ui-choreography`
- Affected code:
  - `components/three/three-d-ipod.tsx` (materials, lighting rig, camera rig, export)
  - `components/ipod/scenes/*` (stage, color/camera cockpits, export dock, new control surface)
  - `lib/studio-camera.ts` (poses, ortho snaps, new crane move)
  - `lib/three-clip-recorder.ts`, `lib/three-export.ts` (static export path)
  - `lib/color-manifest.ts`, `lib/ipod-state/*` (palette, defaults, interaction events)
  - new: command palette + dev control utility + detent module
  - new dependency (tiny imgui-like control lib — see `design.md`)
- Quality bar (cross-cutting, not a separate spec): every phase is verified **visually**
  on the running `/3d` (vision check), must feel like a trustworthy artifact, and must
  hold the clean-minimalism aesthetic.
</content>
