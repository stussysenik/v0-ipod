# Change: Deterministic Keep-Out Stage & Container-Query Layout

## Why

The `/3d` stage is broken on mobile in a way that a prior change (`add-mobile-responsive-stability`, marked Complete) failed to fix. Live evidence (390px portrait, `ipod-music.vercel.app`):

- The RE:MIX menu renders as a flat 2D overlay **floating in front of** the ¾-tilted 3D device — the screen content is not registered to the screen. This is the "digital error / offset".
- The `Front · Right · Back · Left · Top · ¾` angle pill and the `ORBIT · PINCH` pad sit **on top of** the device body and wheel.
- The bottom `Product · Front · Back · + Shots` bar **clips off the right edge** (horizontal overflow).

The previous fix tried to clamp each control to the viewport and reposition per-breakpoint. That cannot *guarantee* non-overlap — it patches symptoms. The root cause is that HUD elements share the device's space and the layout resolves against the viewport instead of the parent container.

This change replaces the per-breakpoint patching with one structural law: the device occupies an **inviolable keep-out zone**, every other element lives in **exclusive docked rails** outside it, and all sizing resolves against the **parent container** (CSS container queries) — never the viewport. This makes overlap structurally impossible and makes the stage deterministic at any embed size, which is the precondition for the white-label embeddable element.

## What Changes

- **Keep-out zone.** The device's bounding box (and, in `/3d`, its projected screen-space silhouette) becomes a reserved region. No HUD, control, panel, or palette may enter it — enforced by layout structure, not z-index or per-breakpoint nudging.
- **Container-query layout.** The stage declares container contexts (`container-type: inline-size` + locked `aspect-ratio`); the device, screen, list rows, and type scale resolve against their container in `cqi`/`cqw` units or `@container` queries. **BREAKING** to the viewport-height-based scaling heuristic (no public API change).
- **Exclusive docked rails.** Controls (angle pill, orbit pad, shots/tab bar, command palette, color/meta/settings panels) move into dedicated grid zones. On narrow containers the rails reflow **below** the device, never over it.
- **Screen content bound to device.** The menu/now-playing UI renders inside the device's screen container so it tracks the device's transform — no detached 2D overlay.
- **Retire floating panels.** The free-floating, draggable panel model (`add-floating-panels-and-command-palette`) is superseded by docked rails. Panels open into a rail zone, not over the stage.

## Impact

- Affected specs: `stage-keepout-layout` (new capability)
- Supersedes mobile-layout behavior from `add-mobile-responsive-stability` and the floating placement from `add-floating-panels-and-command-palette` (control *semantics* unchanged — only their spatial model).
- Affected code:
  - `components/ipod/scenes/ipod-3d-stage.tsx` (stage grid, keep-out zone, control rails)
  - `components/ipod/scenes/ipod-3d-touch-controls.tsx`, `components/ipod/scenes/ipod-3d-studio-shots.tsx` (rail placement, overflow)
  - `components/ipod/panels/*` (`PanelSystem` → docked rails)
  - `components/ipod/workbench/ipod-classic-workbench.tsx` (stage container, device fit)
  - `components/ipod/display/*` (screen UI bound to device container)
  - `app/globals.css` (container contexts, keep-out grid, rail reflow)
  - `lib/layout/keepout.ts` (new — pure geometry helpers + container-query tokens)
  - `tests/keepout-layout.spec.ts` (new — unit coverage for the geometry/no-overlap invariant)
